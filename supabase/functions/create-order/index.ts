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
    const {
      shipping_address, notes, payment_method,
      coupon_code, coupon_discount, gift_wrap, gift_message, shipping_method_id
    } = body;

    if (!shipping_address?.full_name || !shipping_address?.phone || !shipping_address?.street || !shipping_address?.city) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required shipping fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    // Compute subtotal server-side
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

    // Validate and apply coupon server-side
    let validatedCouponDiscount = 0;
    if (coupon_code) {
      const { data: coupon } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", coupon_code)
        .eq("is_active", true)
        .maybeSingle();

      if (coupon) {
        const notExpired = !coupon.expires_at || new Date(coupon.expires_at) > new Date();
        const withinLimit = !coupon.usage_limit || coupon.used_count < coupon.usage_limit;
        const meetsMin = !coupon.min_order_amount || subtotal >= Number(coupon.min_order_amount);

        if (notExpired && withinLimit && meetsMin) {
          if (coupon.discount_type === "percentage") {
            validatedCouponDiscount = subtotal * (Number(coupon.discount_value) / 100);
            if (coupon.max_discount_amount) {
              validatedCouponDiscount = Math.min(validatedCouponDiscount, Number(coupon.max_discount_amount));
            }
          } else {
            validatedCouponDiscount = Number(coupon.discount_value);
          }
          // Increment usage
          await supabase.from("coupons").update({ used_count: coupon.used_count + 1 }).eq("id", coupon.id);
        }
      }
    }

    // Calculate shipping fee server-side
    let shippingFee = 0;
    if (shipping_method_id) {
      const { data: method } = await supabase
        .from("shipping_methods")
        .select("*")
        .eq("id", shipping_method_id)
        .maybeSingle();

      if (method) {
        shippingFee = method.min_order_free && subtotal >= Number(method.min_order_free) ? 0 : Number(method.price);
      }
    } else {
      // Fallback: first active method
      const { data: methods } = await supabase
        .from("shipping_methods")
        .select("*")
        .eq("is_active", true)
        .order("sort_order")
        .limit(1);
      
      if (methods?.length) {
        const m = methods[0];
        shippingFee = m.min_order_free && subtotal >= Number(m.min_order_free) ? 0 : Number(m.price);
      }
    }

    const giftWrapFee = gift_wrap ? 50 : 0;
    const total = Math.max(0, subtotal - validatedCouponDiscount + shippingFee + giftWrapFee);
    const orderNumber = `ZM-${Date.now().toString(36).toUpperCase()}`;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        subtotal,
        shipping_fee: shippingFee,
        total,
        shipping_address,
        payment_method: payment_method || "cod",
        notes: notes || null,
        status: "pending",
        coupon_code: coupon_code || null,
        coupon_discount: validatedCouponDiscount,
        shipping_method_id: shipping_method_id || null,
        gift_wrap: gift_wrap || false,
        gift_message: gift_message || null,
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

    const itemsWithOrderId = orderItems.map((item) => ({ ...item, order_id: order.id }));
    const { error: itemsError } = await supabase.from("order_items").insert(itemsWithOrderId);
    if (itemsError) console.error("Order items insert error:", itemsError);

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
