// Pathao Courier Merchant API integration
// Action-based router. Admin actions require admin role; tracking-status is user-scoped.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const BASE = {
  sandbox: "https://courier-api-sandbox.pathao.com",
  live: "https://api-hermes.pathao.com",
};

function envCreds(env: "sandbox" | "live") {
  const prefix = env === "sandbox" ? "PATHAO_SANDBOX" : "PATHAO_LIVE";
  return {
    client_id: Deno.env.get(`${prefix}_CLIENT_ID`) || "",
    client_secret: Deno.env.get(`${prefix}_CLIENT_SECRET`) || "",
    username: Deno.env.get(`${prefix}_USERNAME`) || "",
    password: Deno.env.get(`${prefix}_PASSWORD`) || "",
  };
}

async function getAccessToken(env: "sandbox" | "live"): Promise<string> {
  // Check cached token
  const { data: cached } = await adminClient
    .from("pathao_tokens")
    .select("*")
    .eq("environment", env)
    .maybeSingle();

  if (cached && new Date(cached.expires_at).getTime() > Date.now() + 60_000) {
    return cached.access_token;
  }

  const creds = envCreds(env);
  if (!creds.client_id || !creds.username) {
    throw new Error(`Pathao ${env} credentials not configured`);
  }

  let body: Record<string, string>;
  let res: Response;

  if (cached?.refresh_token) {
    // Try refresh first
    body = {
      client_id: creds.client_id,
      client_secret: creds.client_secret,
      refresh_token: cached.refresh_token,
      grant_type: "refresh_token",
    };
    res = await fetch(`${BASE[env]}/aladdin/api/v1/issue-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      // Fall back to password grant
      body = {
        client_id: creds.client_id,
        client_secret: creds.client_secret,
        username: creds.username,
        password: creds.password,
        grant_type: "password",
      };
      res = await fetch(`${BASE[env]}/aladdin/api/v1/issue-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      });
    }
  } else {
    body = {
      client_id: creds.client_id,
      client_secret: creds.client_secret,
      username: creds.username,
      password: creds.password,
      grant_type: "password",
    };
    res = await fetch(`${BASE[env]}/aladdin/api/v1/issue-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
  }

  const json = await res.json();
  if (!res.ok || !json.access_token) {
    throw new Error(`Pathao auth failed: ${JSON.stringify(json)}`);
  }

  const expiresAt = new Date(Date.now() + (json.expires_in || 432000) * 1000).toISOString();
  await adminClient.from("pathao_tokens").upsert(
    {
      environment: env,
      access_token: json.access_token,
      refresh_token: json.refresh_token,
      expires_at: expiresAt,
    },
    { onConflict: "environment" }
  );

  return json.access_token;
}

async function pathaoFetch(
  env: "sandbox" | "live",
  path: string,
  init: RequestInit = {}
) {
  const token = await getAccessToken(env);
  const res = await fetch(`${BASE[env]}${path}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await adminClient.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  return !!data;
}

async function getUserFromReq(req: Request) {
  const auth = req.headers.get("Authorization");
  if (!auth) return null;
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: auth } },
  });
  const { data } = await userClient.auth.getUser();
  return data.user;
}

async function getActiveEnv(): Promise<"sandbox" | "live"> {
  const { data } = await adminClient
    .from("site_settings")
    .select("value")
    .eq("key", "pathao_public_config")
    .maybeSingle();
  const cfg = (data?.value || {}) as any;
  return cfg.environment === "live" ? "live" : "sandbox";
}

async function getStoreId(env: "sandbox" | "live"): Promise<number | null> {
  const { data } = await adminClient
    .from("site_settings")
    .select("value")
    .eq("key", "pathao_public_config")
    .maybeSingle();
  const cfg = (data?.value || {}) as any;
  return env === "live" ? cfg.live_store_id || null : cfg.sandbox_store_id || null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const action = body.action as string;
    const user = await getUserFromReq(req);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = await isAdmin(user.id);
    const env: "sandbox" | "live" = body.environment || (await getActiveEnv());

    // ---------------- ADMIN: list stores ----------------
    if (action === "list-stores") {
      if (!admin) return forbidden();
      const r = await pathaoFetch(env, "/aladdin/api/v1/stores");
      return ok(r.json);
    }

    // ---------------- ADMIN: cities/zones/areas ----------------
    if (action === "cities") {
      if (!admin) return forbidden();
      const r = await pathaoFetch(env, "/aladdin/api/v1/city-list");
      return ok(r.json);
    }
    if (action === "zones") {
      if (!admin) return forbidden();
      const r = await pathaoFetch(env, `/aladdin/api/v1/cities/${body.city_id}/zone-list`);
      return ok(r.json);
    }
    if (action === "areas") {
      if (!admin) return forbidden();
      const r = await pathaoFetch(env, `/aladdin/api/v1/zones/${body.zone_id}/area-list`);
      return ok(r.json);
    }

    // ---------------- ADMIN: price calculation ----------------
    if (action === "price") {
      if (!admin) return forbidden();
      const store_id = body.store_id || (await getStoreId(env));
      const r = await pathaoFetch(env, "/aladdin/api/v1/merchant/price-plan", {
        method: "POST",
        body: JSON.stringify({ ...body.payload, store_id }),
      });
      return ok(r.json);
    }

    // ---------------- ADMIN: create order (push to Pathao) ----------------
    if (action === "create-order") {
      if (!admin) return forbidden();
      const orderId = body.order_id;
      const { data: order } = await adminClient
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();
      if (!order) return bad("Order not found");

      const store_id = body.store_id || (await getStoreId(env));
      if (!store_id) return bad("Store not configured");

      const addr = (order.shipping_address as any) || {};
      const itemDesc = body.item_description || "Order Items";

      const payload = {
        store_id: Number(store_id),
        merchant_order_id: order.order_number,
        recipient_name: addr.full_name || addr.name || "Customer",
        recipient_phone: addr.phone || "",
        recipient_address: addr.address || addr.street || "",
        recipient_city: Number(body.recipient_city),
        recipient_zone: Number(body.recipient_zone),
        recipient_area: body.recipient_area ? Number(body.recipient_area) : undefined,
        delivery_type: body.delivery_type || 48, // 48=Normal, 12=On Demand
        item_type: body.item_type || 2, // 2=Parcel, 1=Document
        special_instruction: order.notes || "",
        item_quantity: body.item_quantity || 1,
        item_weight: body.item_weight || 0.5,
        amount_to_collect: order.payment_method === "cod" ? Number(order.total) : 0,
        item_description: itemDesc,
      };

      const r = await pathaoFetch(env, "/aladdin/api/v1/orders", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!r.ok) {
        return new Response(
          JSON.stringify({ error: "Pathao create failed", details: r.json }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = (r.json as any)?.data || r.json;
      const consignment_id =
        data?.consignment_id || data?.data?.consignment_id;

      await adminClient.from("pathao_shipments").upsert(
        {
          order_id: orderId,
          consignment_id,
          merchant_order_id: order.order_number,
          environment: env,
          shipment_type: "delivery",
          order_status: data?.order_status || "Pickup_Requested",
          order_status_slug: data?.order_status || "pickup_requested",
          delivery_fee: data?.delivery_fee || 0,
          cod_amount: payload.amount_to_collect,
          recipient_city: payload.recipient_city,
          recipient_zone: payload.recipient_zone,
          recipient_area: payload.recipient_area || null,
          recipient_city_name: body.recipient_city_name || null,
          recipient_zone_name: body.recipient_zone_name || null,
          invoice_id: data?.invoice_id || null,
          raw_response: data,
          last_synced_at: new Date().toISOString(),
        },
        { onConflict: "consignment_id,environment" }
      );

      // Update order tracking_number
      await adminClient
        .from("orders")
        .update({ tracking_number: consignment_id, status: "shipped" })
        .eq("id", orderId);

      return ok({ consignment_id, data });
    }

    // ---------------- ADMIN: sync status for one consignment ----------------
    if (action === "sync-status") {
      if (!admin) return forbidden();
      const consignment_id = body.consignment_id;
      const r = await pathaoFetch(
        env,
        `/aladdin/api/v1/orders/${consignment_id}/info`
      );
      if (!r.ok) return bad(`Sync failed: ${JSON.stringify(r.json)}`);
      const data = (r.json as any)?.data || r.json;
      await adminClient
        .from("pathao_shipments")
        .update({
          order_status: data?.order_status,
          order_status_slug: data?.order_status_slug || data?.order_status,
          delivery_fee: data?.delivery_fee || undefined,
          raw_response: data,
          last_synced_at: new Date().toISOString(),
        })
        .eq("consignment_id", consignment_id)
        .eq("environment", env);
      return ok(data);
    }

    // ---------------- ADMIN: bulk sync all active shipments ----------------
    if (action === "sync-all") {
      if (!admin) return forbidden();
      const { data: shipments } = await adminClient
        .from("pathao_shipments")
        .select("consignment_id, environment")
        .not("order_status_slug", "in", "(delivered,returned,cancelled)");
      let synced = 0;
      for (const s of shipments || []) {
        try {
          const r = await pathaoFetch(
            s.environment as "sandbox" | "live",
            `/aladdin/api/v1/orders/${s.consignment_id}/info`
          );
          if (r.ok) {
            const d = (r.json as any)?.data || r.json;
            await adminClient
              .from("pathao_shipments")
              .update({
                order_status: d?.order_status,
                order_status_slug: d?.order_status_slug || d?.order_status,
                raw_response: d,
                last_synced_at: new Date().toISOString(),
              })
              .eq("consignment_id", s.consignment_id)
              .eq("environment", s.environment);
            synced++;
          }
        } catch (_) {}
      }
      return ok({ synced, total: shipments?.length || 0 });
    }

    // ---------------- ADMIN: create return shipment ----------------
    if (action === "create-return") {
      if (!admin) return forbidden();
      const orderId = body.order_id;
      const { data: order } = await adminClient
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();
      if (!order) return bad("Order not found");

      const store_id = body.store_id || (await getStoreId(env));
      const addr = (order.shipping_address as any) || {};

      // Pathao return: pickup from customer, deliver to store. Use same orders endpoint with reversed addresses (handled via separate API in production; using merchant return flow).
      const payload = {
        store_id: Number(store_id),
        merchant_order_id: `RET-${order.order_number}`,
        recipient_name: body.return_to_name || "Store",
        recipient_phone: body.return_to_phone || "",
        recipient_address: body.return_to_address || "",
        recipient_city: Number(body.return_city),
        recipient_zone: Number(body.return_zone),
        delivery_type: 48,
        item_type: 2,
        item_quantity: 1,
        item_weight: 0.5,
        amount_to_collect: 0,
        item_description: `Return from ${addr.full_name || "customer"}`,
      };

      const r = await pathaoFetch(env, "/aladdin/api/v1/orders", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!r.ok) return bad(`Return create failed: ${JSON.stringify(r.json)}`);
      const data = (r.json as any)?.data || r.json;
      await adminClient.from("pathao_shipments").insert({
        order_id: orderId,
        consignment_id: data?.consignment_id,
        merchant_order_id: payload.merchant_order_id,
        environment: env,
        shipment_type: "return",
        order_status: data?.order_status || "Pickup_Requested",
        order_status_slug: data?.order_status || "pickup_requested",
        raw_response: data,
        last_synced_at: new Date().toISOString(),
      });
      return ok(data);
    }

    return bad(`Unknown action: ${action}`);
  } catch (e: any) {
    console.error("pathao function error", e);
    return new Response(JSON.stringify({ error: e?.message || "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function ok(data: unknown) {
  return new Response(JSON.stringify(data ?? {}), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
function bad(msg: string) {
  return new Response(JSON.stringify({ error: msg }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
function forbidden() {
  return new Response(JSON.stringify({ error: "Forbidden" }), {
    status: 403,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
