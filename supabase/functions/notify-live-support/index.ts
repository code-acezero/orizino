import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Authenticate the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");

    const { conversation_id } = await req.json();

    // Use the authenticated user's ID, not a client-supplied one
    const userId = user.id;

    // Get user profile
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", userId).single();
    const userName = profile?.full_name || "A customer";

    // Get admin/mod emails from user_roles + auth
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .in("role", ["admin", "moderator"]);

    if (adminRoles?.length && resendKey) {
      const adminIds = adminRoles.map((r: any) => r.user_id);
      const adminEmails: string[] = [];

      for (const id of adminIds) {
        const { data } = await supabase.auth.admin.getUserById(id);
        if (data?.user?.email) adminEmails.push(data.user.email);
      }

      if (adminEmails.length > 0) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Ace Store <noreply@acezero-shop.lovable.app>",
            to: adminEmails,
            subject: `🎧 Live Support Request from ${userName}`,
            html: `
              <h2>Live Support Request</h2>
              <p><strong>${userName}</strong> has requested live support.</p>
              <p>Please log into the admin panel to respond.</p>
              <p><a href="https://acezero-shop.lovable.app/admin/support">Go to Support Dashboard</a></p>
            `,
          }),
        });
      }
    }

    // Create notification for admins
    await supabase.from("notifications").insert({
      title: "🎧 Live Support Request",
      message: `${userName} is requesting live support`,
      type: "support",
      priority: "high",
      link_url: "/admin/support",
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("notify-live-support error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
