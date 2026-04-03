import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Optional auth check - allow unauthenticated but strip sensitive data
    let isAuthenticated = false;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const authClient = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data: { user }, error } = await authClient.auth.getUser();
        if (user && !error) {
          isAuthenticated = true;
        }
      } catch {
        // Invalid token - treat as unauthenticated
      }
    }

    const { messages, context } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ reply: "Please send a message." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load AI agent config from site_settings
    const { data: configRow } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "ai_agent_config")
      .maybeSingle();

    const config = (configRow?.value as any) || {};
    const agentName = config.name || "Assistant";
    const personality = config.personality || "friendly and helpful";
    const customInstructions = config.custom_instructions || "";

    // Load site info
    const { data: siteSettingsRows } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["site_name", "site_description"]);
    const siteMap: Record<string, string> = {};
    siteSettingsRows?.forEach((r: any) => {
      const v = r.value;
      siteMap[r.key] = typeof v === "object" && v !== null ? (v as any).value ?? JSON.stringify(v) : String(v ?? "");
    });
    const siteName = siteMap.site_name || "Our Store";

    // Load ALL product data for comprehensive context
    const { data: products } = await supabase
      .from("products")
      .select("name, price, slug, short_description, description, stock_quantity, avg_rating, review_count, thumbnail, images, specifications, compare_at_price, tags, sku")
      .eq("is_active", true)
      .order("avg_rating", { ascending: false })
      .limit(50);

    const { data: categories } = await supabase
      .from("categories")
      .select("name, slug, description")
      .eq("is_active", true);

    // Load shipping methods
    const { data: shippingMethods } = await supabase
      .from("shipping_methods")
      .select("name, price, estimated_days, min_order_free")
      .eq("is_active", true);

    // Only load coupons for authenticated users
    let coupons: any[] | null = null;
    if (isAuthenticated) {
      const { data } = await supabase
        .from("coupons")
        .select("code, description, discount_type, discount_value, min_order_amount, max_discount_amount")
        .eq("is_active", true);
      coupons = data;
    }

    // Load CMS pages for FAQ/policies
    const { data: cmsPages } = await supabase
      .from("cms_pages")
      .select("title, slug, content")
      .eq("is_published", true);

    const productContext = products?.map((p: any) => {
      let entry = `- **${p.name}** (৳${p.price}${p.compare_at_price ? `, was ৳${p.compare_at_price}` : ""}, ${p.stock_quantity > 0 ? `${p.stock_quantity} in stock` : "OUT OF STOCK"}, rating: ${p.avg_rating}/5 from ${p.review_count || 0} reviews, link: /product/${p.slug})`;
      if (p.short_description) entry += `\n  Description: ${p.short_description}`;
      if (p.thumbnail) entry += `\n  Image: ${p.thumbnail}`;
      if (p.images && p.images.length > 0) entry += `\n  Gallery: ${p.images.slice(0, 3).join(", ")}`;
      if (p.specifications && typeof p.specifications === "object" && Object.keys(p.specifications).length > 0) {
        entry += `\n  Specs: ${JSON.stringify(p.specifications)}`;
      }
      if (p.tags && p.tags.length > 0) entry += `\n  Tags: ${p.tags.join(", ")}`;
      if (p.sku) entry += `\n  SKU: ${p.sku}`;
      return entry;
    }).join("\n\n") || "No products available";

    const categoryContext = categories?.map((c: any) => `- ${c.name} (/categories/${c.slug})${c.description ? `: ${c.description}` : ""}`).join("\n") || "";

    const shippingContext = shippingMethods?.map((s: any) => `- ${s.name}: ৳${s.price}${s.min_order_free ? ` (free over ৳${s.min_order_free})` : ""}, ${s.estimated_days || "standard"} delivery`).join("\n") || "";

    const couponContext = isAuthenticated && coupons?.length
      ? coupons.map((c: any) => `- ${c.code}: ${c.discount_type === "percentage" ? `${c.discount_value}% off` : `৳${c.discount_value} off`}${c.min_order_amount ? ` (min ৳${c.min_order_amount})` : ""}${c.description ? ` - ${c.description}` : ""}`).join("\n")
      : "";

    const cmsContext = cmsPages?.map((p: any) => `- ${p.title} (/page/${p.slug}): ${p.content?.substring(0, 200)}...`).join("\n") || "";

    const systemPrompt = `You are "${agentName}", an AI shopping assistant for ${siteName}.

Personality: ${personality}

Your capabilities:
- Help customers find products, compare items, check availability and prices
- Provide detailed product information including images, specs, and ratings
- Answer questions about orders, shipping, returns, and policies
- Provide product recommendations based on preferences and budget
- Share product links in markdown format: [Product Name](/product/slug)
- Share product images using markdown: ![Product Name](image_url)
- When asked about a specific product, provide ALL available info: price, specs, images, stock, rating
- If a customer needs human help, suggest they click the headphone icon for live support

Complete product catalog:
${productContext}

Categories:
${categoryContext}

Shipping options:
${shippingContext}

${couponContext ? `Active promotions:\n${couponContext}` : ""}

${cmsContext ? `Store pages (FAQ, policies, etc.):\n${cmsContext}` : ""}

Payment methods: bKash, Nagad, Upay, Credit/Debit Card (SSLCommerz), Bank Transfer, Cash on Delivery

${customInstructions}

Rules:
- Be concise but thorough when describing products
- Use markdown formatting for clarity (bold, links, images)
- Always provide product links when mentioning products
- When showing product details, include image, price, specs and stock status
- If asked for product images, use the thumbnail or gallery image URLs
- If you don't know something, say so honestly
- Never make up product information not in your data
- Recommend alternatives if a product is out of stock`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-20).map((m: any) => ({ role: m.role, content: String(m.content).slice(0, 2000) })),
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ reply: "I'm a bit busy right now. Please try again in a moment!" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ reply: "AI service temporarily unavailable. Please try again later." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "I'm not sure how to respond to that.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(JSON.stringify({ reply: "Sorry, something went wrong. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
