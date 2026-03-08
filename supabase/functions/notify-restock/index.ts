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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get body params
    const { variant_id, product_id } = await req.json();

    if (!product_id) {
      return new Response(JSON.stringify({ error: "product_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find pending notifications for this product/variant
    let query = supabase
      .from("stock_notifications")
      .select("id, user_id, email, variant_id, product_id")
      .eq("product_id", product_id)
      .eq("is_notified", false);

    if (variant_id) {
      query = query.eq("variant_id", variant_id);
    }

    const { data: subscriptions, error: fetchError } = await query;
    if (fetchError) throw fetchError;

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending notifications", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get product info for notification
    const { data: product } = await supabase
      .from("products")
      .select("name, slug, thumbnail")
      .eq("id", product_id)
      .single();

    const productName = product?.name || "Product";
    const productSlug = product?.slug || "";

    // Get variant info if applicable
    let variantLabel = "";
    if (variant_id) {
      const { data: variant } = await supabase
        .from("product_variants")
        .select("size, color")
        .eq("id", variant_id)
        .single();
      if (variant) {
        variantLabel = [variant.size, variant.color].filter(Boolean).join(" / ");
      }
    }

    const notifiedIds: string[] = [];
    const emailResults: { sent: number; failed: number } = { sent: 0, failed: 0 };

    for (const sub of subscriptions) {
      // Create in-app notification
      await supabase.from("notifications").insert({
        user_id: sub.user_id,
        title: "Back in Stock! 🎉",
        message: `${productName}${variantLabel ? ` (${variantLabel})` : ""} is now available again.`,
        type: "restock",
        icon: "package",
        link_url: `/product/${productSlug}`,
        priority: "high",
      });

      // Send email if available and Resend is configured
      if (sub.email) {
        const resendKey = Deno.env.get("RESEND_API_KEY");
        if (resendKey) {
          try {
            const siteUrl = Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", "") || "";
            const emailRes = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${resendKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev",
                to: sub.email,
                subject: `${productName} is back in stock!`,
                html: `
                  <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
                    <h2 style="color: #111;">Good news! 🎉</h2>
                    <p style="color: #555; line-height: 1.6;">
                      <strong>${productName}</strong>${variantLabel ? ` (${variantLabel})` : ""} is now back in stock.
                    </p>
                    <p style="color: #555; line-height: 1.6;">
                      Don't miss out — grab it before it sells out again!
                    </p>
                    <a href="${siteUrl}/product/${productSlug}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 12px; font-weight: 600;">
                      Shop Now
                    </a>
                    <p style="color: #999; font-size: 12px; margin-top: 24px;">
                      You received this because you subscribed to stock notifications.
                    </p>
                  </div>
                `,
              }),
            });

            if (emailRes.ok) emailResults.sent++;
            else emailResults.failed++;
          } catch {
            emailResults.failed++;
          }
        }
      }

      notifiedIds.push(sub.id);
    }

    // Mark as notified
    if (notifiedIds.length > 0) {
      await supabase
        .from("stock_notifications")
        .update({ is_notified: true })
        .in("id", notifiedIds);
    }

    return new Response(
      JSON.stringify({
        message: `Notified ${notifiedIds.length} subscriber(s)`,
        count: notifiedIds.length,
        emails: emailResults,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
