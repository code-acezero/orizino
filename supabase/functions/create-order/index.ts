import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type BuyNowItem = {
  productId: string;
  variantId?: string | null;
  quantity: number;
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
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      shipping_address,
      notes,
      payment_method,
      coupon_code,
      gift_wrap,
      gift_message,
      shipping_method_id,
      buy_now_item,
      preferred_courier,
      hub_pickup,
      pickup_hub_id,
      shipping_fee_override,
    } = body as {
      shipping_address: Record<string, string>;
      notes?: string;
      payment_method?: string;
      coupon_code?: string;
      coupon_discount?: number;
      gift_wrap?: boolean;
      gift_message?: string;
      shipping_method_id?: string;
      buy_now_item?: BuyNowItem | null;
      preferred_courier?: string | null;
      hub_pickup?: boolean;
      pickup_hub_id?: string | null;
      shipping_fee_override?: number | null;
    };

    if (!shipping_address?.full_name || !shipping_address?.phone || !shipping_address?.street || !shipping_address?.city) {
      return new Response(JSON.stringify({ success: false, error: "Missing required shipping fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const buildVariantLabel = (variant: { size?: string | null; color?: string | null } | null) =>
      [variant?.size, variant?.color].filter(Boolean).join(" / ");

    let subtotal = 0;
    let clearCartAfterOrder = false;
    const orderItems: Array<{
      product_id: string;
      product_name: string;
      product_image: string | null;
      unit_price: number;
      quantity: number;
      total_price: number;
    }> = [];

    if (buy_now_item?.productId) {
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("id, name, price, thumbnail, is_active")
        .eq("id", buy_now_item.productId)
        .eq("is_active", true)
        .maybeSingle();

      if (productError || !product) {
        return new Response(JSON.stringify({ success: false, error: "Selected product is unavailable" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: productVariants, error: variantsError } = await supabase
        .from("product_variants")
        .select("id, product_id, size, color, price_override, stock_quantity, image_url")
        .eq("product_id", buy_now_item.productId)
        .eq("is_active", true);

      if (variantsError) {
        return new Response(JSON.stringify({ success: false, error: "Unable to validate selected variant" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const hasVariants = (productVariants?.length ?? 0) > 0;
      const selectedVariant = buy_now_item.variantId
        ? (productVariants || []).find((variant) => variant.id === buy_now_item.variantId) || null
        : null;

      if (hasVariants && !selectedVariant) {
        return new Response(JSON.stringify({ success: false, error: "Please select all required product options before ordering" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const quantity = Math.max(1, Number(buy_now_item.quantity) || 1);
      const unitPrice = Number(selectedVariant?.price_override ?? product.price ?? 0);
      const variantLabel = buildVariantLabel(selectedVariant);
      const lineTotal = unitPrice * quantity;

      subtotal += lineTotal;
      orderItems.push({
        product_id: product.id,
        product_name: variantLabel ? `${product.name} (${variantLabel})` : product.name,
        product_image: selectedVariant?.image_url ?? product.thumbnail ?? null,
        unit_price: unitPrice,
        quantity,
        total_price: lineTotal,
      });
    } else {
      const { data: cartItems, error: cartError } = await supabase
        .from("cart_items")
        .select("product_id, variant_id, quantity, products(id, name, price, thumbnail), product_variants(id, product_id, size, color, price_override, image_url)")
        .eq("user_id", user.id);

      if (cartError || !cartItems?.length) {
        return new Response(JSON.stringify({ success: false, error: "Cart is empty" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const productIds = Array.from(new Set(cartItems.map((item) => item.product_id).filter(Boolean)));
      const { data: activeVariants } = productIds.length
        ? await supabase
            .from("product_variants")
            .select("id, product_id")
            .in("product_id", productIds)
            .eq("is_active", true)
        : { data: [] };

      const productsWithVariants = new Set((activeVariants || []).map((variant) => variant.product_id));

      for (const item of cartItems) {
        const product = item.products as { id: string; name: string; price: number; thumbnail: string | null } | null;
        const variant = item.product_variants as {
          id: string;
          product_id: string;
          size: string | null;
          color: string | null;
          price_override: number | null;
          image_url: string | null;
        } | null;

        if (!product) continue;

        if (productsWithVariants.has(product.id) && !item.variant_id) {
          return new Response(JSON.stringify({ success: false, error: `Please reselect the required options for ${product.name} in your cart` }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (item.variant_id && !variant) {
          return new Response(JSON.stringify({ success: false, error: `A selected variant for ${product.name} is no longer available` }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const unitPrice = Number(variant?.price_override ?? product.price ?? 0);
        const variantLabel = buildVariantLabel(variant);
        const lineTotal = unitPrice * item.quantity;

        subtotal += lineTotal;
        orderItems.push({
          product_id: product.id,
          product_name: variantLabel ? `${product.name} (${variantLabel})` : product.name,
          product_image: variant?.image_url ?? product.thumbnail ?? null,
          unit_price: unitPrice,
          quantity: item.quantity,
          total_price: lineTotal,
        });
      }

      clearCartAfterOrder = true;
    }

    if (!orderItems.length) {
      return new Response(JSON.stringify({ success: false, error: "No valid order items found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

          await supabase.from("coupons").update({ used_count: coupon.used_count + 1 }).eq("id", coupon.id);
        }
      }
    }

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
      const { data: methods } = await supabase
        .from("shipping_methods")
        .select("*")
        .eq("is_active", true)
        .order("sort_order")
        .limit(1);

      if (methods?.length) {
        const method = methods[0];
        shippingFee = method.min_order_free && subtotal >= Number(method.min_order_free) ? 0 : Number(method.price);
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
      return new Response(JSON.stringify({ success: false, error: "Failed to create order" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const itemsWithOrderId = orderItems.map((item) => ({ ...item, order_id: order.id }));
    const { error: itemsError } = await supabase.from("order_items").insert(itemsWithOrderId);
    if (itemsError) {
      console.error("Order items insert error:", itemsError);
    }

    if (clearCartAfterOrder) {
      await supabase.from("cart_items").delete().eq("user_id", user.id);
    }

    // Award loyalty points (1 point per BDT spent on subtotal). Best-effort.
    try {
      const points = Math.floor(Number(subtotal) || 0);
      if (points > 0) {
        await supabase.rpc("award_loyalty_points", {
          _user_id: user.id,
          _points: points,
          _source: "order",
          _reference_id: order.id,
          _description: `Order ${order.order_number}`,
          _spend_amount: Number(subtotal) || 0,
        });
      }
      await supabase.rpc("set_loyalty_orders" as any, { _user_id: user.id }).catch(() => {});
    } catch (e) {
      console.error("loyalty award failed (non-fatal)", e);
    }

    return new Response(JSON.stringify({ success: true, order_number: order.order_number }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Create order error:", err);
    return new Response(JSON.stringify({ success: false, error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
