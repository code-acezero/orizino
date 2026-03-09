import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { messages, context } = await req.json();

    // Load AI agent config from site_settings
    const { data: configRow } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "ai_agent_config")
      .maybeSingle();

    const config = (configRow?.value as any) || {};
    const agentName = config.name || "Ace Assistant";
    const personality = config.personality || "friendly and helpful";
    const customInstructions = config.custom_instructions || "";

    // Load some product data for context
    const { data: products } = await supabase
      .from("products")
      .select("name, price, slug, short_description, stock_quantity, avg_rating")
      .eq("is_active", true)
      .order("avg_rating", { ascending: false })
      .limit(20);

    const { data: categories } = await supabase
      .from("categories")
      .select("name, slug")
      .eq("is_active", true);

    const productContext = products?.map((p: any) =>
      `- ${p.name} (৳${p.price}, ${p.stock_quantity > 0 ? "in stock" : "out of stock"}, rating: ${p.avg_rating}/5, link: /product/${p.slug})`
    ).join("\n") || "No products available";

    const categoryContext = categories?.map((c: any) => `- ${c.name} (/categories/${c.slug})`).join("\n") || "";

    const systemPrompt = `You are "${agentName}", an AI shopping assistant for Ace Marketplace, a Bangladeshi e-commerce store.

Personality: ${personality}

Your capabilities:
- Help customers find products, compare items, check availability
- Answer questions about orders, shipping, returns
- Provide product recommendations based on preferences
- Share product links in format: [Product Name](/product/slug)
- If a customer needs human help, suggest they click the headphone icon for live support

Available products:
${productContext}

Categories:
${categoryContext}

Delivery partners: Pathao, Steadfast (available in Bangladesh)
Payment methods: bKash, Nagad, Upay, Credit/Debit Card (SSLCommerz), Bank Transfer, Cash on Delivery

${customInstructions}

Rules:
- Be concise but helpful
- Use markdown formatting for clarity
- Always provide product links when mentioning products
- If you don't know something, say so honestly
- Never make up product information`;

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
          ...messages.map((m: any) => ({ role: m.role, content: m.content })),
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
