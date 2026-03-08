import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/xml; charset=utf-8",
};

const SITE_URL = Deno.env.get("SITE_URL") || "https://acezero-shop.lovable.app";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch active products and categories in parallel
    const [productsRes, categoriesRes] = await Promise.all([
      supabase
        .from("products")
        .select("slug, updated_at")
        .eq("is_active", true)
        .order("updated_at", { ascending: false }),
      supabase
        .from("categories")
        .select("slug, updated_at")
        .eq("is_active", true)
        .order("updated_at", { ascending: false }),
    ]);

    const products = productsRes.data || [];
    const categories = categoriesRes.data || [];

    // Static pages
    const staticPages = [
      { loc: "/", priority: "1.0", changefreq: "daily" },
      { loc: "/home", priority: "1.0", changefreq: "daily" },
      { loc: "/shop", priority: "0.9", changefreq: "daily" },
      { loc: "/auth", priority: "0.3", changefreq: "monthly" },
    ];

    let urls = "";

    // Static pages
    for (const page of staticPages) {
      urls += `
  <url>
    <loc>${SITE_URL}${page.loc}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
    }

    // Category pages
    for (const cat of categories) {
      const lastmod = cat.updated_at ? new Date(cat.updated_at).toISOString().split("T")[0] : "";
      urls += `
  <url>
    <loc>${SITE_URL}/categories/${cat.slug}</loc>${lastmod ? `
    <lastmod>${lastmod}</lastmod>` : ""}
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }

    // Product pages
    for (const product of products) {
      const lastmod = product.updated_at ? new Date(product.updated_at).toISOString().split("T")[0] : "";
      urls += `
  <url>
    <loc>${SITE_URL}/product/${product.slug}</loc>${lastmod ? `
    <lastmod>${lastmod}</lastmod>` : ""}
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;

    return new Response(sitemap, {
      headers: { ...corsHeaders, "Cache-Control": "public, max-age=3600" },
    });
  } catch (error) {
    return new Response(`<!-- Error generating sitemap: ${error.message} -->`, {
      status: 500,
      headers: corsHeaders,
    });
  }
});
