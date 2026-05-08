// Sync a call recording (or both sides of one) from the private
// `call-recordings` Supabase Storage bucket to Google Drive using a
// Google service account. Triggered by the admin browser right after
// a call ends and the admin's recording has finished uploading.
//
// Body: { call_log_id: string, drive_folder_id?: string }
// The drive_folder_id is read from site_settings.value->>folder_id at
// key 'call_recordings_drive' if not provided in the body. The folder
// MUST be shared with the service-account email or live in a Shared Drive.

import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SA_KEY = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_KEY") || "";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

/* ── Google service-account JWT → access token ── */
async function getDriveAccessToken(): Promise<string> {
  if (!SA_KEY) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY not configured");
  const sa = JSON.parse(SA_KEY);
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/drive.file",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const enc = (o: unknown) =>
    btoa(JSON.stringify(o)).replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const unsigned = `${enc(header)}.${enc(claim)}`;

  // Import PKCS8 RSA private key
  const pkcs8 = sa.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");
  const der = Uint8Array.from(atob(pkcs8), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "pkcs8", der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false, ["sign"],
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned)),
  );
  const sigB64 = btoa(String.fromCharCode(...sig))
    .replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const jwt = `${unsigned}.${sigB64}`;

  const tokRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  if (!tokRes.ok) throw new Error(`token exchange failed: ${await tokRes.text()}`);
  const { access_token } = await tokRes.json();
  return access_token as string;
}

async function uploadToDrive(token: string, name: string, blob: Blob, parentId?: string): Promise<string> {
  const metadata: Record<string, unknown> = { name };
  if (parentId) metadata.parents = [parentId];

  const boundary = "orizino_" + crypto.randomUUID();
  const meta = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
  const body = `--${boundary}\r\nContent-Type: ${blob.type || "audio/webm"}\r\n\r\n`;
  const tail = `\r\n--${boundary}--`;

  const enc = new TextEncoder();
  const merged = new Blob([enc.encode(meta), enc.encode(body), blob, enc.encode(tail)]);

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: merged,
    },
  );
  if (!res.ok) throw new Error(`drive upload failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.id as string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { call_log_id, drive_folder_id } = await req.json();
    if (!call_log_id) {
      return new Response(JSON.stringify({ error: "call_log_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve target folder id (body > site_settings)
    let folderId = drive_folder_id as string | undefined;
    if (!folderId) {
      const { data } = await admin
        .from("site_settings")
        .select("value")
        .eq("key", "call_recordings_drive")
        .maybeSingle();
      folderId = (data?.value as any)?.folder_id;
    }

    const { data: log, error: logErr } = await admin
      .from("call_logs")
      .select("id, recording_user_url, recording_admin_url, drive_file_id")
      .eq("id", call_log_id)
      .maybeSingle();
    if (logErr || !log) throw new Error("call log not found");

    const token = await getDriveAccessToken();
    const uploaded: string[] = [];

    for (const role of ["admin", "user"] as const) {
      const path = role === "admin" ? log.recording_admin_url : log.recording_user_url;
      if (!path) continue;
      const { data: file, error: dlErr } = await admin.storage.from("call-recordings").download(path);
      if (dlErr || !file) {
        console.warn(`[sync] download ${role} failed`, dlErr);
        continue;
      }
      const fileName = `call_${call_log_id}_${role}_${Date.now()}.webm`;
      const id = await uploadToDrive(token, fileName, file, folderId);
      uploaded.push(`${role}:${id}`);
    }

    if (uploaded.length) {
      await admin.from("call_logs").update({
        drive_file_id: uploaded.join(","),
        drive_synced_at: new Date().toISOString(),
      }).eq("id", call_log_id);
    }

    return new Response(JSON.stringify({ uploaded }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("[sync-recording-to-drive] error", e);
    return new Response(JSON.stringify({ error: e?.message || "Failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
