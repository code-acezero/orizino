// Returns ICE servers (STUN + Metered TURN) for WebRTC voice calls.
// Strategy:
//   1) Try Metered REST API (dynamic short-lived creds) using METERED_API_KEY + METERED_DOMAIN.
//   2) If that fails (or key missing), fall back to static long-lived Metered creds
//      (METERED_TURN_USERNAME + METERED_TURN_CREDENTIAL) on standard.relay.metered.ca.
//   3) Final fallback: STUN-only (won't work cross-network).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STUN: any[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun.relay.metered.ca:80" },
];

function staticMeteredTurn(username: string, credential: string) {
  return [
    { urls: "turn:standard.relay.metered.ca:80", username, credential },
    { urls: "turn:standard.relay.metered.ca:80?transport=tcp", username, credential },
    { urls: "turn:standard.relay.metered.ca:443", username, credential },
    { urls: "turns:standard.relay.metered.ca:443?transport=tcp", username, credential },
  ];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const apiKey = Deno.env.get("METERED_API_KEY");
  const domain = Deno.env.get("METERED_DOMAIN") || "global.relay.metered.ca";
  const staticUser = Deno.env.get("METERED_TURN_USERNAME");
  const staticCred = Deno.env.get("METERED_TURN_CREDENTIAL");

  let iceServers: any[] = [];
  let source = "none";

  // 1) Dynamic creds via Metered REST API
  if (apiKey) {
    try {
      const url = `https://${domain}/api/v1/turn/credentials?apiKey=${apiKey}`;
      const resp = await fetch(url);
      if (resp.ok) {
        const turn = await resp.json();
        if (Array.isArray(turn) && turn.length) {
          iceServers = turn;
          source = "metered-api";
        }
      } else {
        const masked = apiKey.slice(0, 4) + "…" + apiKey.slice(-4);
        console.warn(`Metered API ${resp.status} for domain=${domain} key=${masked}`);
      }
    } catch (e) {
      console.warn("Metered fetch error:", e);
    }
  }

  // 2) Static long-lived creds fallback
  if (iceServers.length === 0 && staticUser && staticCred) {
    iceServers = [...STUN, ...staticMeteredTurn(staticUser, staticCred)];
    source = "metered-static";
  }

  // 3) STUN-only fallback
  if (iceServers.length === 0) {
    iceServers = STUN;
    source = "stun-only";
  }

  console.log(`get-ice-servers source=${source} count=${iceServers.length}`);

  return new Response(JSON.stringify({ iceServers, source }), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60",
    },
  });
});
