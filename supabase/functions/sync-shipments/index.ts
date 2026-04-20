// Auto-sync shipment statuses from Pathao + Steadfast.
// Can be invoked per-order (body: {orderId}) or as a cron job (no body — syncs all in-transit).
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const TERMINAL = ["delivered", "returned", "cancelled", "lost"];
const isTerminal = (s?: string | null) => !!s && TERMINAL.some((t) => s.toLowerCase().includes(t));

async function syncSteadfast(supabase: any, shipment: any) {
  const apiKey = Deno.env.get("STEADFAST_API_KEY");
  const secret = Deno.env.get("STEADFAST_SECRET_KEY");
  if (!apiKey || !secret || !shipment.consignment_id) return;
  try {
    const res = await fetch(
      `https://portal.packzy.com/api/v1/status_by_cid/${shipment.consignment_id}`,
      { headers: { "Api-Key": apiKey, "Secret-Key": secret } }
    );
    const data = await res.json();
    if (data?.status === 200) {
      await supabase
        .from("steadfast_shipments")
        .update({
          status: data.delivery_status || shipment.status,
          last_synced_at: new Date().toISOString(),
          raw_response: data,
        })
        .eq("id", shipment.id);
    }
  } catch (e) {
    console.error("steadfast sync error", shipment.id, e);
  }
}

async function syncPathao(supabase: any, shipment: any) {
  // Use the existing pathao function which already handles token + status.
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/pathao`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_ROLE}` },
      body: JSON.stringify({ action: "status", consignment_id: shipment.consignment_id, environment: shipment.environment }),
    });
    const data = await res.json();
    if (data?.data) {
      await supabase
        .from("pathao_shipments")
        .update({
          order_status: data.data.order_status || shipment.order_status,
          order_status_slug: data.data.order_status_slug || shipment.order_status_slug,
          last_synced_at: new Date().toISOString(),
          raw_response: data,
        })
        .eq("id", shipment.id);
    }
  } catch (e) {
    console.error("pathao sync error", shipment.id, e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
  let orderId: string | null = null;
  try { const body = await req.json(); orderId = body?.orderId || null; } catch {}

  // Pull active shipments
  const pathaoQ = supabase.from("pathao_shipments").select("*");
  const steadQ = supabase.from("steadfast_shipments").select("*");
  if (orderId) { pathaoQ.eq("order_id", orderId); steadQ.eq("order_id", orderId); }

  const [{ data: pathao }, { data: steadfast }] = await Promise.all([pathaoQ, steadQ]);
  const pathaoActive = (pathao || []).filter((s: any) => !isTerminal(s.order_status));
  const steadActive = (steadfast || []).filter((s: any) => !isTerminal(s.status));

  await Promise.all([
    ...pathaoActive.map((s: any) => syncPathao(supabase, s)),
    ...steadActive.map((s: any) => syncSteadfast(supabase, s)),
  ]);

  // Reflect terminal status to orders
  if (orderId) {
    const allDelivered = [...(pathao || []), ...(steadfast || [])].every((s: any) =>
      (s.order_status || s.status || "").toLowerCase().includes("deliver")
    );
    if (allDelivered) {
      await supabase.from("orders").update({ status: "delivered" }).eq("id", orderId);
    }
  }

  return new Response(
    JSON.stringify({ success: true, synced: { pathao: pathaoActive.length, steadfast: steadActive.length } }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
