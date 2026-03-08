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

    // Verify caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { shipping_address, notes } = body;

    // Validate shipping address
    if (!shipping_address?.full_name || !shipping_address?.phone || !shipping_address?.street || !shipping_address?.city) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required shipping fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role to fetch cart and compute totals server-side
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: cartItems, error: cartError } = await supabase
      .from("cart_items")
      .select("quantity, products(id, name, price, thumbnail)")
      .eq("user_id", user.id);

    if (cartError || !cartItems?.length) {
      return new Response(
        JSON.stringify({ success: false, error: "Cart is empty" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Compute totals server-side from actual product prices
    let subtotal = 0;
    const orderItems = [];
    for (const item of cartItems) {
      const product = item.products as any;
      if (!product) continue;
      const lineTotal = product.price * item.quantity;
      subtotal += lineTotal;
      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        product_image: product.thumbnail,
        unit_price: product.price,
        quantity: item.quantity,
        total_price: lineTotal,
      });
    }

    const shippingFee = subtotal >= 50 ? 0 : 5.99;
    const total = subtotal + shippingFee;
    const orderNumber = `ZM-${Date.now().toString(36).toUpperCase()}`;

    // Insert order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        subtotal,
        shipping_fee: shippingFee,
        total,
        shipping_address,
        payment_method: "cod",
        notes: notes || null,
        status: "pending",
      })
      .select("id, order_number")
      .single();

    if (orderError || !order) {
      console.error("Order insert error:", orderError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to create order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert order items
    const itemsWithOrderId = orderItems.map((item) => ({ ...item, order_id: order.id }));
    const { error: itemsError } = await supabase.from("order_items").insert(itemsWithOrderId);
    if (itemsError) {
      console.error("Order items insert error:", itemsError);
    }

    // Clear cart
    await supabase.from("cart_items").delete().eq("user_id", user.id);

    return new Response(
      JSON.stringify({ success: true, order_number: order.order_number }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Create order error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
