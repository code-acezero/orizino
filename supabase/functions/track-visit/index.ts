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

    // --- Input validation ---
    const ALLOWED_EVENT_TYPES = ["page_view", "section_view", "section_engagement", "click"];
    const validatedEventType = ALLOWED_EVENT_TYPES.includes(event_type) ? event_type : null;
    if (!validatedEventType) {
      return new Response(JSON.stringify({ error: "Invalid event_type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (typeof page !== "string" || page.length > 255 || !page.startsWith("/")) {
      return new Response(JSON.stringify({ error: "Invalid page" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (session_id != null && (typeof session_id !== "string" || session_id.length > 64)) {
      return new Response(JSON.stringify({ error: "Invalid session_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (section_id != null && (typeof section_id !== "string" || section_id.length > 100)) {
      return new Response(JSON.stringify({ error: "Invalid section_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validatedDuration = typeof duration_ms === "number" && duration_ms >= 0 && duration_ms <= 3600000
      ? Math.round(duration_ms)
      : 0;

    // Limit metadata payload size (max 2KB serialized)
    let validatedMetadata: Record<string, unknown> = {};
    if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
      const serialized = JSON.stringify(metadata);
      if (serialized.length <= 2048) {
        validatedMetadata = metadata as Record<string, unknown>;
      }
    }

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
