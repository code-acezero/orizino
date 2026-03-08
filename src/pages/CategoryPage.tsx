import React, { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";

const sortOptions = [
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Top Rated", value: "rating" },
];

function getYouTubeId(url: string) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([^&?/]+)/);
  return m?.[1] || null;
}

const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [sort, setSort] = useState("newest");
  const [selectedSub, setSelectedSub] = useState<string | null>(null);

  // Fetch category
  const { data: category, isLoading: catLoading } = useQuery({
    queryKey: ["category", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("slug", slug!)
        .eq("is_active", true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Fetch subcategories
  const { data: subcategories = [] } = useQuery({
    queryKey: ["subcategories", category?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name, slug, icon, icon_url, accent_color")
        .eq("parent_id", category!.id)
        .eq("is_active", true)
        .order("sort_order");
      return data || [];
    },
    enabled: !!category?.id,
  });

  // Fetch products for this category (or subcategory)
  const activeCatId = selectedSub || category?.id;
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["category-products", activeCatId, sort],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("id, name, price, compare_at_price, thumbnail, avg_rating, review_count, slug")
        .eq("is_active", true);

      if (selectedSub) {
        query = query.eq("category_id", selectedSub);
      } else if (category?.id) {
        // Get products from this category AND its subcategories
        const catIds = [category.id, ...subcategories.map((s) => s.id)];
        query = query.in("category_id", catIds);
      }

      switch (sort) {
        case "price_asc": query = query.order("price", { ascending: true }); break;
        case "price_desc": query = query.order("price", { ascending: false }); break;
        case "rating": query = query.order("avg_rating", { ascending: false, nullsFirst: false }); break;
        default: query = query.order("created_at", { ascending: false });
      }

      const { data } = await query.limit(50);
      return data || [];
    },
    enabled: !!activeCatId,
  });

  const accentColor = category?.accent_color || "#6366f1";
  const bannerType = category?.banner_type || "image";
  const bannerUrl = category?.banner_url;
  const youtubeUrl = category?.youtube_url;
  const ytId = youtubeUrl ? getYouTubeId(youtubeUrl) : null;

  if (catLoading) {
    return (
      <div className="min-h-screen pb-20 lg:pb-0">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen pb-20 lg:pb-0">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground">Category not found</h1>
          <Link to="/home" className="text-primary mt-4 inline-block hover:underline">Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <Navbar />

      {/* Banner Section with fading shadow */}
      <div className="relative w-full overflow-hidden" style={{ minHeight: "260px", maxHeight: "400px" }}>
        {/* Banner content */}
        {bannerType === "youtube" && ytId ? (
          <iframe
            src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&showinfo=0`}
            className="absolute inset-0 w-full h-full"
            style={{ minHeight: "400px" }}
            allow="autoplay; encrypted-media"
            allowFullScreen
            frameBorder="0"
          />
        ) : bannerUrl ? (
          <img
            src={bannerUrl}
            alt={category.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(135deg, ${accentColor}33, ${accentColor}11)` }}
          />
        )}

        {/* Fading shadow overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, ${accentColor}44 0%, hsl(var(--background)) 100%)`,
          }}
        />

        {/* Category info overlay */}
        <div className="relative z-10 container mx-auto px-4 flex flex-col justify-end h-full pb-8 pt-20">
          <div className="flex items-center gap-4">
            {category.icon_url && (
              <img src={category.icon_url} alt="" className="w-14 h-14 rounded-2xl object-contain bg-background/50 p-2" />
            )}
            <div>
              <h1 className="text-3xl md:text-5xl font-bold font-display text-foreground drop-shadow-lg">
                {category.name}
              </h1>
              {category.description && (
                <p className="text-muted-foreground mt-1 max-w-lg">{category.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Subcategory chips */}
        {subcategories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedSub(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                !selectedSub
                  ? "text-primary-foreground border-transparent"
                  : "text-foreground border-border hover:border-primary/50"
              }`}
              style={!selectedSub ? { background: accentColor } : undefined}
            >
              All
            </button>
            {subcategories.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setSelectedSub(sub.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all border flex items-center gap-2 ${
                  selectedSub === sub.id
                    ? "text-primary-foreground border-transparent"
                    : "text-foreground border-border hover:border-primary/50"
                }`}
                style={selectedSub === sub.id ? { background: accentColor } : undefined}
              >
                {sub.icon_url ? (
                  <img src={sub.icon_url} alt="" className="w-4 h-4 object-contain" />
                ) : sub.icon ? (
                  <span>{sub.icon}</span>
                ) : null}
                {sub.name}
              </button>
            ))}
          </div>
        )}

        {/* Sort bar */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {products.length} product{products.length !== 1 ? "s" : ""}
          </p>
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="appearance-none bg-secondary/50 text-foreground text-sm px-4 py-2 pr-8 rounded-full border border-border focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Products grid */}
        {productsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-3xl bg-secondary/30 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">No products in this category yet.</p>
            <Link to="/shop" className="text-primary mt-2 inline-block hover:underline">Browse all products</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03 }}
              >
                <ProductCard
                  id={product.id}
                  name={product.name}
                  price={Number(product.price)}
                  compareAtPrice={product.compare_at_price ? Number(product.compare_at_price) : undefined}
                  thumbnail={product.thumbnail ?? undefined}
                  avgRating={product.avg_rating ? Number(product.avg_rating) : undefined}
                  reviewCount={product.review_count ?? undefined}
                  slug={product.slug}
                />
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default CategoryPage;
