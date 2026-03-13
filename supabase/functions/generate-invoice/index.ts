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
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "moderator"])
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { order_id } = await req.json();
    if (!order_id) {
      return new Response(JSON.stringify({ error: "order_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch order + items
    const { data: order } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: items } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order_id);

    // Fetch user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone, email:id")
      .eq("id", order.user_id)
      .single();

    // Fetch site settings for branding
    const { data: settings } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["site_name", "logo_url"]);

    const settingsMap: Record<string, any> = {};
    settings?.forEach((s: any) => {
      const val = s.value?.value ?? s.value;
      settingsMap[s.key] = val;
    });

    const siteName = settingsMap.site_name || "Store";
    const shippingAddr = order.shipping_address as any || {};

    // Generate invoice HTML
    const invoiceHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1a1a2e; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #10b981; padding-bottom: 20px; }
    .header h1 { font-size: 28px; color: #10b981; margin: 0; }
    .header .order-info { text-align: right; }
    .header .order-info p { margin: 4px 0; font-size: 14px; color: #666; }
    .section { margin-bottom: 30px; }
    .section h3 { font-size: 14px; text-transform: uppercase; color: #999; letter-spacing: 1px; margin-bottom: 10px; }
    .address-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
    .address-box p { margin: 3px 0; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #f8f9fa; text-align: left; padding: 12px; font-size: 13px; text-transform: uppercase; color: #666; letter-spacing: 0.5px; border-bottom: 2px solid #e9ecef; }
    td { padding: 12px; font-size: 14px; border-bottom: 1px solid #e9ecef; }
    .totals { text-align: right; }
    .totals td { border: none; padding: 6px 12px; }
    .totals .total-row { font-size: 18px; font-weight: bold; color: #10b981; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e9ecef; text-align: center; color: #999; font-size: 12px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${siteName}</h1>
      <p style="color: #666; margin: 5px 0 0;">INVOICE</p>
    </div>
    <div class="order-info">
      <p><strong>Order #${order.order_number}</strong></p>
      <p>Date: ${new Date(order.created_at).toLocaleDateString()}</p>
      <p>Status: ${order.status.toUpperCase()}</p>
      <p>Payment: ${order.payment_method}</p>
    </div>
  </div>
  
  <div class="address-grid section">
    <div class="address-box">
      <h3>Ship To</h3>
      <p><strong>${shippingAddr.full_name || ""}</strong></p>
      <p>${shippingAddr.street || ""}</p>
      <p>${shippingAddr.city || ""}, ${shippingAddr.state || ""} ${shippingAddr.zip || ""}</p>
      <p>${shippingAddr.country || ""}</p>
      <p>Phone: ${shippingAddr.phone || ""}</p>
    </div>
    <div class="address-box">
      <h3>Customer</h3>
      <p><strong>${profile?.full_name || "N/A"}</strong></p>
      <p>Phone: ${profile?.phone || "N/A"}</p>
    </div>
  </div>

  <div class="section">
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th>Qty</th>
          <th>Unit Price</th>
          <th style="text-align:right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${(items || []).map((item: any) => `
        <tr>
          <td>${item.product_name}</td>
          <td>${item.quantity}</td>
          <td>${Number(item.unit_price).toFixed(2)}</td>
          <td style="text-align:right">${Number(item.total_price).toFixed(2)}</td>
        </tr>`).join("")}
      </tbody>
    </table>

    <table class="totals">
      <tr><td>Subtotal</td><td>${Number(order.subtotal).toFixed(2)}</td></tr>
      ${order.coupon_discount ? `<tr><td>Discount (${order.coupon_code})</td><td>-${Number(order.coupon_discount).toFixed(2)}</td></tr>` : ""}
      <tr><td>Shipping</td><td>${Number(order.shipping_fee).toFixed(2)}</td></tr>
      ${order.gift_wrap ? `<tr><td>Gift Wrap</td><td>50.00</td></tr>` : ""}
      <tr class="total-row"><td>Total</td><td>${Number(order.total).toFixed(2)}</td></tr>
    </table>
  </div>

  ${order.gift_message ? `<div class="section"><h3>Gift Message</h3><p style="font-style:italic">"${order.gift_message}"</p></div>` : ""}
  ${order.notes ? `<div class="section"><h3>Order Notes</h3><p>${order.notes}</p></div>` : ""}

  <div class="footer">
    <p>Thank you for your order! | ${siteName}</p>
    <p>This is a computer-generated invoice. No signature required.</p>
  </div>
</body>
</html>`;

    return new Response(JSON.stringify({ 
      success: true, 
      invoice_html: invoiceHtml,
      order_number: order.order_number,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Generate invoice error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
