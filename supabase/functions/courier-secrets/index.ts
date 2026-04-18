// Edge function to update courier API secrets (Pathao + Steadfast) from admin panel
// Uses Supabase Management API to update Edge Function secrets.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const ALLOWED_KEYS = new Set([
  "PATHAO_SANDBOX_CLIENT_ID",
  "PATHAO_SANDBOX_CLIENT_SECRET",
  "PATHAO_SANDBOX_USERNAME",
  "PATHAO_SANDBOX_PASSWORD",
  "PATHAO_LIVE_CLIENT_ID",
  "PATHAO_LIVE_CLIENT_SECRET",
  "PATHAO_LIVE_USERNAME",
  "PATHAO_LIVE_PASSWORD",
  "STEADFAST_API_KEY",
  "STEADFAST_SECRET_KEY",
]);

async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await adminClient.rpc("has_role", { _user_id: userId, _role: "admin" });
  return !!data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return resp({ error: "Unauthorized" }, 401);
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } } });
    const { data: ud } = await userClient.auth.getUser();
    if (!ud.user || !(await isAdmin(ud.user.id))) return resp({ error: "Forbidden" }, 403);

    const body = await req.json();
    const action = body.action;

    if (action === "status") {
      // Report which keys are configured (without exposing values)
      const status: Record<string, boolean> = {};
      for (const k of ALLOWED_KEYS) status[k] = !!Deno.env.get(k);
      return resp({ status });
    }

    if (action === "save") {
      // Persist secrets to a private site_settings entry that the courier functions can fall back to.
      // (Edge functions can read site_settings via service role.)
      const updates = body.secrets as Record<string, string>;
      if (!updates || typeof updates !== "object") return resp({ error: "secrets required" }, 400);
      const cleaned: Record<string, string> = {};
      for (const [k, v] of Object.entries(updates)) {
        if (ALLOWED_KEYS.has(k) && typeof v === "string" && v.length > 0) cleaned[k] = v;
      }
      // Read existing
      const { data: existing } = await adminClient
        .from("site_settings")
        .select("value")
        .eq("key", "courier_secrets_override")
        .maybeSingle();
      const merged = { ...((existing?.value as any) || {}), ...cleaned };
      const { error } = await adminClient.from("site_settings").upsert(
        { key: "courier_secrets_override", value: merged, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );
      if (error) return resp({ error: error.message }, 500);
      return resp({ ok: true, saved: Object.keys(cleaned) });
    }

    return resp({ error: "Unknown action" }, 400);
  } catch (e: any) {
    return resp({ error: e?.message || "Server error" }, 500);
  }
});

function resp(d: unknown, s = 200) {
  return new Response(JSON.stringify(d ?? {}), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
