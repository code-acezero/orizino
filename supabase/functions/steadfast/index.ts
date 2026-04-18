// Steadfast Courier API integration
// Action-based router. Admin actions require admin role.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const BASE_URL = "https://portal.packzy.com/api/v1";

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

async function creds() {
  const { data: ovRow } = await adminClient
    .from("site_settings").select("value").eq("key", "courier_secrets_override").maybeSingle();
  const ov = (ovRow?.value as any) || {};
  return {
    api_key: ov.STEADFAST_API_KEY || Deno.env.get("STEADFAST_API_KEY") || "",
    secret_key: ov.STEADFAST_SECRET_KEY || Deno.env.get("STEADFAST_SECRET_KEY") || "",
  };
}

async function sfFetch(path: string, init: RequestInit = {}) {
  const c = await creds();
  if (!c.api_key || !c.secret_key) throw new Error("Steadfast credentials not configured");
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      "Api-Key": c.api_key,
      "Secret-Key": c.secret_key,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await adminClient.rpc("has_role", { _user_id: userId, _role: "admin" });
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const action = body.action as string;
    const user = await getUserFromReq(req);
    if (!user) return resp({ error: "Unauthorized" }, 401);
    const admin = await isAdmin(user.id);
    if (!admin) return resp({ error: "Forbidden" }, 403);

    // ---- Test connection / balance
    if (action === "balance" || action === "test") {
      const r = await sfFetch("/get_balance");
      return resp(r.json, r.ok ? 200 : 400);
    }

    // ---- Create order (push to Steadfast)
    if (action === "create-order") {
      const orderId = body.order_id;
      const { data: order } = await adminClient.from("orders").select("*").eq("id", orderId).maybeSingle();
      if (!order) return resp({ error: "Order not found" }, 400);

      const addr = (order.shipping_address as any) || {};
      const payload = {
        invoice: order.order_number,
        recipient_name: addr.full_name || addr.name || "Customer",
        recipient_phone: (addr.phone || "").replace(/\D/g, "").slice(-11),
        recipient_address: [addr.address || addr.street, addr.city, addr.area].filter(Boolean).join(", ").slice(0, 250),
        cod_amount: order.payment_method === "cod" ? Number(order.total) : 0,
        note: body.note || order.notes || "",
        item_description: body.item_description || "Order Items",
        delivery_type: body.delivery_type ?? 0,
      };

      const r = await sfFetch("/create_order", { method: "POST", body: JSON.stringify(payload) });
      if (!r.ok) return resp({ error: "Steadfast create failed", details: r.json }, 400);

      const c = (r.json as any)?.consignment || r.json;
      await adminClient.from("steadfast_shipments").insert({
        order_id: orderId,
        consignment_id: String(c.consignment_id),
        tracking_code: c.tracking_code,
        invoice: c.invoice,
        cod_amount: c.cod_amount || payload.cod_amount,
        status: c.status,
        recipient_name: c.recipient_name,
        recipient_phone: c.recipient_phone,
        recipient_address: c.recipient_address,
        note: c.note,
        raw_response: c,
        last_synced_at: new Date().toISOString(),
      });

      await adminClient.from("orders")
        .update({ tracking_number: String(c.tracking_code || c.consignment_id), status: "shipped" })
        .eq("id", orderId);

      return resp({ consignment: c });
    }

    // ---- Sync status for one consignment
    if (action === "sync-status") {
      const cid = body.consignment_id;
      const r = await sfFetch(`/status_by_cid/${cid}`);
      if (!r.ok) return resp({ error: "Sync failed", details: r.json }, 400);
      const status = (r.json as any).delivery_status;
      await adminClient.from("steadfast_shipments")
        .update({ status, raw_response: r.json, last_synced_at: new Date().toISOString() })
        .eq("consignment_id", String(cid));
      return resp({ status });
    }

    // ---- Bulk sync
    if (action === "sync-all") {
      const { data: shipments } = await adminClient.from("steadfast_shipments")
        .select("consignment_id")
        .not("status", "in", "(delivered,cancelled,partial_delivered)");
      let synced = 0;
      for (const s of shipments || []) {
        try {
          const r = await sfFetch(`/status_by_cid/${s.consignment_id}`);
          if (r.ok) {
            const st = (r.json as any).delivery_status;
            await adminClient.from("steadfast_shipments")
              .update({ status: st, last_synced_at: new Date().toISOString() })
              .eq("consignment_id", s.consignment_id);
            synced++;
          }
        } catch (_) {}
      }
      return resp({ synced, total: shipments?.length || 0 });
    }

    // ---- Create return request
    if (action === "create-return") {
      const payload: any = { reason: body.reason || "Return requested" };
      if (body.consignment_id) payload.consignment_id = body.consignment_id;
      else if (body.invoice) payload.invoice = body.invoice;
      else if (body.tracking_code) payload.tracking_code = body.tracking_code;
      else return resp({ error: "consignment_id, invoice, or tracking_code required" }, 400);
      const r = await sfFetch("/create_return_request", { method: "POST", body: JSON.stringify(payload) });
      return resp(r.json, r.ok ? 200 : 400);
    }

    // ---- Get all return requests
    if (action === "list-returns") {
      const r = await sfFetch("/get_return_requests");
      return resp(r.json, r.ok ? 200 : 400);
    }

    // ---- Get payments
    if (action === "list-payments") {
      const r = await sfFetch("/payments");
      return resp(r.json, r.ok ? 200 : 400);
    }

    return resp({ error: `Unknown action: ${action}` }, 400);
  } catch (e: any) {
    console.error("steadfast error", e);
    return resp({ error: e?.message || "Server error" }, 500);
  }
});

function resp(data: unknown, status = 200) {
  return new Response(JSON.stringify(data ?? {}), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
