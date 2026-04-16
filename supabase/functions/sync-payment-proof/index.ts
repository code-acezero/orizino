import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SHEET_ID = "1z0zSMW04NYLlw6OlrG5AACMAXAjDsU9vlixg6Rh8GHg";

async function getAccessToken(serviceAccountKey: any): Promise<string> {
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const claimSet = btoa(JSON.stringify({
    iss: serviceAccountKey.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  }));

  const signInput = `${header}.${claimSet}`;

  // Import the private key
  const pemContent = serviceAccountKey.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const binaryKey = Uint8Array.from(atob(pemContent), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8", binaryKey, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5", cryptoKey, new TextEncoder().encode(signInput)
  );

  const jwt = `${signInput}.${btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) throw new Error("Failed to get access token: " + JSON.stringify(tokenData));
  return tokenData.access_token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { proof_id, action } = await req.json();
    if (!proof_id) {
      return new Response(JSON.stringify({ error: "proof_id required" }), { status: 400, headers: corsHeaders });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch the payment proof with order info
    const { data: proof, error: proofError } = await serviceClient
      .from("payment_proofs")
      .select("*, orders(order_number, total, payment_method, shipping_address, created_at)")
      .eq("id", proof_id)
      .single();

    if (proofError || !proof) {
      return new Response(JSON.stringify({ error: "Proof not found" }), { status: 404, headers: corsHeaders });
    }

    // If admin confirming/rejecting
    if (action === "confirm" || action === "reject") {
      const newStatus = action === "confirm" ? "confirmed" : "rejected";
      await serviceClient.from("payment_proofs").update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      }).eq("id", proof_id);

      // Update order status
      if (action === "confirm") {
        await serviceClient.from("orders").update({
          status: "confirmed",
          updated_at: new Date().toISOString(),
        }).eq("id", proof.order_id);
      }
    }

    // Sync to Google Sheets
    const saKeyRaw = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_KEY");
    if (!saKeyRaw) {
      console.warn("GOOGLE_SERVICE_ACCOUNT_KEY not set, skipping sheet sync");
      return new Response(JSON.stringify({ success: true, sheet_synced: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const saKey = JSON.parse(saKeyRaw);
    const accessToken = await getAccessToken(saKey);

    const order = proof.orders as any;
    const shippingAddr = order?.shipping_address as any || {};

    const row = [
      new Date().toISOString(),
      order?.order_number || "",
      proof.payment_method,
      proof.customer_name || "",
      proof.customer_phone || "",
      shippingAddr.street || "",
      shippingAddr.city || "",
      String(proof.amount),
      String(order?.total || 0),
      proof.transaction_id || "",
      proof.screenshot_url || "",
      proof.status,
      action === "confirm" ? "Yes" : action === "reject" ? "Rejected" : "Pending",
    ];

    // Append row to sheet
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Sheet1!A:M:append?valueInputOption=USER_ENTERED`;
    const appendRes = await fetch(appendUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: [row] }),
    });

    if (!appendRes.ok) {
      const errText = await appendRes.text();
      console.error("Sheets API error:", errText);
    } else {
      await serviceClient.from("payment_proofs").update({ sheet_synced: true }).eq("id", proof_id);
    }

    return new Response(JSON.stringify({ success: true, sheet_synced: appendRes.ok }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
