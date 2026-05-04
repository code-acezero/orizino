// Returns ICE servers (STUN + Metered TURN) for WebRTC voice calls.
// Keeps the Metered API key server-side. Public access (no auth required) so
// both customer and admin clients can fetch fresh credentials.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_STUN = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun.relay.metered.ca:80" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("METERED_API_KEY");
    const domain = Deno.env.get("METERED_DOMAIN") || "global.relay.metered.ca";

    let iceServers: any[] = [...DEFAULT_STUN];

    if (apiKey) {
      try {
        const resp = await fetch(
          `https://${domain}/api/v1/turn/credentials?apiKey=${apiKey}`,
        );
        if (resp.ok) {
          const turn = await resp.json();
          if (Array.isArray(turn) && turn.length) {
            // Metered already returns a STUN entry; merge them.
            iceServers = turn;
          }
        } else {
          console.warn("Metered credential fetch failed:", resp.status);
        }
      } catch (e) {
        console.warn("Metered fetch error:", e);
      }
    } else {
      console.warn("METERED_API_KEY not configured; returning STUN only");
    }

    return new Response(
      JSON.stringify({ iceServers }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=60",
        },
      },
    );
  } catch (e) {
    console.error("get-ice-servers error:", e);
    return new Response(
      JSON.stringify({ iceServers: DEFAULT_STUN, error: "fallback" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
