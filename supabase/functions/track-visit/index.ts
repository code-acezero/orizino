import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { event_type, page, section_id, session_id, metadata, duration_ms } = body;

    // Get visitor IP from headers (Supabase edge functions expose this)
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // Geolocate using free ip-api.com (no key needed, 45 req/min)
    let geo: Record<string, string> = {};
    if (ip && ip !== "unknown" && ip !== "127.0.0.1") {
      try {
        const geoRes = await fetch(
          `http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,lat,lon`,
          { signal: AbortSignal.timeout(3000) }
        );
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData.status === "success") {
            geo = {
              country: geoData.country,
              country_code: geoData.countryCode,
              region: geoData.regionName,
              city: geoData.city,
              lat: String(geoData.lat),
              lon: String(geoData.lon),
            };
          }
        }
      } catch {
        // Geolocation failed — proceed without it
      }
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await supabase.from("page_analytics").insert({
      event_type: event_type || "page_view",
      page: page || "/home",
      section_id: section_id || null,
      session_id: session_id || null,
      duration_ms: duration_ms || 0,
      metadata: { ...((metadata as Record<string, unknown>) || {}), ...geo, ip },
    });

    if (error) {
      console.error("Insert error:", error);
      return new Response(JSON.stringify({ error: "Failed to record analytics" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
