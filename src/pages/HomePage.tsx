import React from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import ParallaxSlider from "@/components/ParallaxSlider";
import CategoryGrid from "@/components/CategoryGrid";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import HomePopup from "@/components/HomePopup";
import { Zap } from "lucide-react";

const HomePage: React.FC = () => {
  const { data: featuredProducts = [], isLoading } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, compare_at_price, thumbnail, avg_rating, review_count, slug")
        .eq("is_active", true)
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch home category sections config
  const { data: catSectionsConfig } = useQuery({
    queryKey: ["home-category-sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "home_category_sections")
        .maybeSingle();
      if (error) throw error;
      if (!data?.value) return [];
      const val = data.value as any;
      const sections = val?.value ?? val;
      return Array.isArray(sections) ? sections.sort((a: any, b: any) => a.sort_order - b.sort_order) : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch categories info for sections
  const sectionCatIds = (catSectionsConfig || []).map((s: any) => s.category_id).filter(Boolean);
  const { data: sectionCategories = [] } = useQuery({
    queryKey: ["home-section-categories", sectionCatIds],
    queryFn: async () => {
      if (sectionCatIds.length === 0) return [];
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, accent_color")
        .in("id", sectionCatIds);
      if (error) throw error;
      return data;
    },
    enabled: sectionCatIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch products for each section category
  const { data: sectionProducts = {} } = useQuery({
    queryKey: ["home-section-products", sectionCatIds],
    queryFn: async () => {
      if (sectionCatIds.length === 0) return {};
      const result: Record<string, any[]> = {};
      for (const section of catSectionsConfig || []) {
        const limit = section.product_count || 8;
        const { data } = await supabase
          .from("products")
          .select("id, name, price, compare_at_price, thumbnail, avg_rating, review_count, slug")
          .eq("is_active", true)
          .eq("category_id", section.category_id)
          .order("created_at", { ascending: false })
          .limit(limit);
        result[section.category_id] = data || [];
      }
      return result;
    },
    enabled: sectionCatIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <Navbar />
      <HomePopup />

      <main className="container mx-auto px-4 pt-6 space-y-16">
        <ParallaxSlider />
        <CategoryGrid />

        {/* Category Product Sections */}
        {(catSectionsConfig || []).map((section: any) => {
          const cat = sectionCategories.find((c) => c.id === section.category_id);
          const products = (sectionProducts as Record<string, any[]>)[section.category_id] || [];
          if (!cat || products.length === 0) return null;

          return (
            <section key={section.category_id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex items-center justify-between mb-8"
              >
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold font-display text-foreground">
                    {cat.name}
                  </h2>
                  <p className="text-muted-foreground mt-1">Explore our {cat.name.toLowerCase()} collection</p>
                </div>
                <a href={`/categories/${cat.slug}`} className="btn-pill glass text-sm text-foreground hover:text-primary transition-colors">
                  View All
                </a>
              </motion.div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product: any, i: number) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
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
            </section>
          );
        })}

        {/* Featured Products */}
        {(isLoading || featuredProducts.length > 0) && (
          <section>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center justify-between mb-8"
            >
              <div>
                <h2 className="text-3xl md:text-4xl font-bold font-display text-foreground">
                  Featured Products
                </h2>
                <p className="text-muted-foreground mt-1">Handpicked just for you</p>
              </div>
              <a href="/shop" className="btn-pill glass text-sm text-foreground hover:text-primary transition-colors">
                View All
              </a>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="aspect-[3/4] rounded-3xl bg-secondary/30 animate-pulse" />
                  ))
                : featuredProducts.map((product, i) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
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
          </section>
        )}

        {/* Flash Sale Banner */}
        <motion.section
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="glass-strong rounded-3xl p-8 md:p-12 relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-20" style={{ background: "var(--gradient-accent)" }} />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center animate-pulse_glow">
                <Zap className="w-7 h-7 text-accent" />
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-bold font-display text-foreground">
                  Flash Sale Live!
                </h3>
                <p className="text-muted-foreground">
                  Up to 70% off on selected items. Limited time only.
                </p>
              </div>
            </div>
            <a href="/shop" className="btn-pill bg-gradient-accent text-accent-foreground font-semibold px-8 py-3 whitespace-nowrap">
              Shop Flash Sale
            </a>
          </div>
        </motion.section>
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;
