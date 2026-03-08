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
import SaleCountdown from "@/components/SaleCountdown";
import SalePopup from "@/components/SalePopup";
import { Sparkles } from "lucide-react";

interface SaleConfig {
  id: string;
  enabled: boolean;
  title: string;
  subtitle: string;
  icon: string;
  custom_icon_url?: string;
  banner_image?: string;
  color: string;
  button_text: string;
  button_link: string;
  position: string;
  starts_at: string;
  ends_at: string;
  show_countdown: boolean;
  show_products: boolean;
  product_source: string;
  product_count: number;
  sort_order: number;
  trigger_popup: boolean;
}

interface LayoutConfig {
  section_spacing: string;
  container_max_width: string;
  section_animation: string;
  animation_delay: number;
  show_section_dividers: boolean;
  divider_style: string;
  featured_bg: string;
  arrivals_bg: string;
  categories_bg: string;
  featured_columns: number;
  arrivals_columns: number;
  card_style: string;
  section_title_size: string;
  section_title_align: string;
  page_bg: string;
  page_bg_pattern: string;
}

const defaultLayout: LayoutConfig = {
  section_spacing: "16",
  container_max_width: "1440px",
  section_animation: "fade-up",
  animation_delay: 0.05,
  show_section_dividers: false,
  divider_style: "line",
  featured_bg: "none",
  arrivals_bg: "none",
  categories_bg: "none",
  featured_columns: 4,
  arrivals_columns: 4,
  card_style: "default",
  section_title_size: "3xl",
  section_title_align: "left",
  page_bg: "none",
  page_bg_pattern: "none",
};

const isSaleActive = (sale: SaleConfig) => {
  if (!sale.enabled) return false;
  const now = new Date();
  if (sale.starts_at && new Date(sale.starts_at) > now) return false;
  if (sale.ends_at && new Date(sale.ends_at) < now) return false;
  return true;
};

const getSectionBgClass = (bg: string) => {
  switch (bg) {
    case "subtle": return "bg-secondary/30 rounded-3xl p-6 md:p-8";
    case "glass": return "glass rounded-3xl p-6 md:p-8";
    case "primary-tint": return "bg-primary/5 rounded-3xl p-6 md:p-8";
    case "gradient": return "bg-gradient-to-br from-primary/5 to-accent/5 rounded-3xl p-6 md:p-8";
    case "dark": return "bg-foreground/5 rounded-3xl p-6 md:p-8";
    default: return "";
  }
};

const getPatternStyle = (pattern: string): React.CSSProperties => {
  switch (pattern) {
    case "dots": return { backgroundImage: "radial-gradient(circle, hsl(var(--primary) / 0.07) 1px, transparent 1px)", backgroundSize: "20px 20px" };
    case "grid": return { backgroundImage: "linear-gradient(hsl(var(--primary) / 0.04) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.04) 1px, transparent 1px)", backgroundSize: "40px 40px" };
    case "diagonal": return { backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, hsl(var(--primary) / 0.03) 10px, hsl(var(--primary) / 0.03) 11px)", backgroundSize: "15px 15px" };
    default: return {};
  }
};

const getDivider = (style: string) => {
  switch (style) {
    case "dashed": return <div className="border-t border-dashed border-border" />;
    case "gradient": return <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />;
    case "dots": return <div className="flex justify-center gap-1">{[...Array(5)].map((_, i) => <span key={i} className="w-1.5 h-1.5 rounded-full bg-border" />)}</div>;
    default: return <div className="border-t border-border" />;
  }
};

const getAnimationVariants = (animation: string) => {
  switch (animation) {
    case "fade-in": return { initial: { opacity: 0 }, whileInView: { opacity: 1 } };
    case "scale-up": return { initial: { opacity: 0, scale: 0.95 }, whileInView: { opacity: 1, scale: 1 } };
    case "slide-left": return { initial: { opacity: 0, x: -30 }, whileInView: { opacity: 1, x: 0 } };
    case "slide-right": return { initial: { opacity: 0, x: 30 }, whileInView: { opacity: 1, x: 0 } };
    case "none": return { initial: {}, whileInView: {} };
    default: return { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 } };
  }
};

const titleSizeMap: Record<string, string> = { "2xl": "text-2xl md:text-3xl", "3xl": "text-3xl md:text-4xl", "4xl": "text-4xl md:text-5xl", "5xl": "text-5xl md:text-6xl" };
const colsMap: Record<number, string> = { 3: "lg:grid-cols-3", 4: "lg:grid-cols-4", 5: "lg:grid-cols-5" };
const cardStyleMap: Record<string, string> = { default: "", minimal: "border-0 shadow-none", bordered: "border-2 border-border", elevated: "shadow-xl" };

const spacingMap: Record<string, string> = {
  "8": "gap-8", "12": "gap-12", "16": "gap-16", "20": "gap-20", "24": "gap-24",
};

const defaultSectionOrder = ["slider", "categories", "category-sections", "featured", "arrivals"];

const HomePage: React.FC = () => {
  const { data: featuredProducts = [], isLoading } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id, name, price, compare_at_price, thumbnail, avg_rating, review_count, slug").eq("is_active", true).eq("is_featured", true).order("created_at", { ascending: false }).limit(8);
      if (error) throw error;
      return data;
    },
    staleTime: 60 * 1000,
  });

  const { data: catSectionsConfig } = useQuery({
    queryKey: ["home-category-sections"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("value").eq("key", "home_category_sections").maybeSingle();
      if (error) throw error;
      if (!data?.value) return [];
      const val = data.value as any;
      const sections = val?.value ?? val;
      return Array.isArray(sections) ? sections.sort((a: any, b: any) => a.sort_order - b.sort_order) : [];
    },
    staleTime: 30 * 1000,
  });

  const { data: salesConfig = [] } = useQuery({
    queryKey: ["home-sales-config"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("value").eq("key", "home_sales_config").maybeSingle();
      if (error) throw error;
      if (!data?.value) return [];
      const val = data.value as any;
      const sales = val?.value ?? val;
      return Array.isArray(sales) ? sales.filter(isSaleActive).sort((a: any, b: any) => a.sort_order - b.sort_order) : [];
    },
    staleTime: 30 * 1000,
  });

  const { data: newArrivalsConfig } = useQuery({
    queryKey: ["home-new-arrivals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("value").eq("key", "home_new_arrivals").maybeSingle();
      if (error) throw error;
      if (!data?.value) return { enabled: true, title: "New Arrivals", subtitle: "Fresh drops just landed", product_count: 8 };
      const val = data.value as any;
      return val?.value ?? val;
    },
    staleTime: 30 * 1000,
  });

  const { data: layoutConfigRaw } = useQuery({
    queryKey: ["home-layout-config"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("value").eq("key", "home_layout_config").maybeSingle();
      if (error) throw error;
      if (!data?.value) return defaultLayout;
      const val = data.value as any;
      const config = val?.value ?? val;
      return { ...defaultLayout, ...config };
    },
    staleTime: 30 * 1000,
  });

  const { data: sectionOrderConfig } = useQuery({
    queryKey: ["home-section-order"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("value").eq("key", "home_section_order").maybeSingle();
      if (error) throw error;
      if (!data?.value) return defaultSectionOrder;
      const val = data.value as any;
      const order = val?.value ?? val;
      if (Array.isArray(order)) {
        const ids = order.map((o: any) => o.id || o).filter(Boolean);
        // Add any missing default sections
        const missing = defaultSectionOrder.filter((d) => !ids.includes(d));
        return [...ids, ...missing];
      }
      return defaultSectionOrder;
    },
    staleTime: 30 * 1000,
  });

  const sectionOrder = sectionOrderConfig || defaultSectionOrder;

  const layout = layoutConfigRaw || defaultLayout;
  const anim = getAnimationVariants(layout.section_animation);
  const titleSize = titleSizeMap[layout.section_title_size] || titleSizeMap["3xl"];
  const titleAlign = layout.section_title_align === "center" ? "text-center justify-center" : "justify-between";
  const cardExtra = cardStyleMap[layout.card_style] || "";

  const newArrivalsCount = newArrivalsConfig?.product_count || 8;
  const { data: newArrivals = [] } = useQuery({
    queryKey: ["new-arrival-products", newArrivalsCount],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id, name, price, compare_at_price, thumbnail, avg_rating, review_count, slug").eq("is_active", true).order("created_at", { ascending: false }).limit(newArrivalsCount);
      if (error) throw error;
      return data;
    },
    staleTime: 60 * 1000,
  });

  const sectionCatIds = (catSectionsConfig || []).map((s: any) => s.category_id).filter(Boolean);
  const { data: sectionCategories = [] } = useQuery({
    queryKey: ["home-section-categories", sectionCatIds],
    queryFn: async () => {
      if (sectionCatIds.length === 0) return [];
      const { data, error } = await supabase.from("categories").select("id, name, slug, accent_color").in("id", sectionCatIds);
      if (error) throw error;
      return data;
    },
    enabled: sectionCatIds.length > 0,
    staleTime: 60 * 1000,
  });

  const { data: sectionProducts = {} } = useQuery({
    queryKey: ["home-section-products", sectionCatIds],
    queryFn: async () => {
      if (sectionCatIds.length === 0) return {};
      const result: Record<string, any[]> = {};
      for (const section of catSectionsConfig || []) {
        const limit = section.product_count || 8;
        const { data } = await supabase.from("products").select("id, name, price, compare_at_price, thumbnail, avg_rating, review_count, slug").eq("is_active", true).eq("category_id", section.category_id).order("created_at", { ascending: false }).limit(limit);
        result[section.category_id] = data || [];
      }
      return result;
    },
    enabled: sectionCatIds.length > 0,
    staleTime: 60 * 1000,
  });

  const saleProductSources = salesConfig.filter((s: SaleConfig) => s.show_products && s.product_source).map((s: SaleConfig) => ({ id: s.id, source: s.product_source, count: s.product_count || 4 }));

  const { data: saleProducts = {} } = useQuery({
    queryKey: ["sale-products", saleProductSources],
    queryFn: async () => {
      const result: Record<string, any[]> = {};
      for (const sp of saleProductSources) {
        let query = supabase.from("products").select("id, name, price, compare_at_price, thumbnail, avg_rating, review_count, slug").eq("is_active", true);
        if (sp.source === "featured") query = query.eq("is_featured", true);
        else if (sp.source !== "latest") query = query.eq("category_id", sp.source);
        const { data } = await query.order("created_at", { ascending: false }).limit(sp.count);
        result[sp.id] = data || [];
      }
      return result;
    },
    enabled: saleProductSources.length > 0,
    staleTime: 60 * 1000,
  });

  const renderSaleBanner = (sale: SaleConfig) => {
    const bgColor = sale.color?.startsWith("var") ? `hsl(var(--primary))` : `hsl(${sale.color})`;
    const gradBg = sale.color?.startsWith("var")
      ? `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.6))`
      : `linear-gradient(135deg, hsl(${sale.color}), hsl(${sale.color} / 0.6))`;
    const products = (saleProducts as Record<string, any[]>)[sale.id] || [];

    return (
      <motion.section key={sale.id} {...anim} viewport={{ once: true }}>
        <div
          className="glass-strong rounded-3xl p-8 md:p-12 relative overflow-hidden"
          style={sale.banner_image ? { backgroundImage: `url(${sale.banner_image})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
        >
          <div className="absolute inset-0 opacity-20" style={{ background: gradBg }} />
          {sale.banner_image && <div className="absolute inset-0 bg-background/50" />}
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ background: `${bgColor}20` }}>
                {sale.custom_icon_url ? <img src={sale.custom_icon_url} className="w-10 h-10 object-contain" alt="" /> : sale.icon}
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-bold font-display text-foreground">{sale.title}</h3>
                <p className="text-muted-foreground">{sale.subtitle}</p>
                {sale.show_countdown && sale.ends_at && <SaleCountdown endsAt={sale.ends_at} color={sale.color} />}
                {!sale.show_countdown && sale.ends_at && (
                  <p className="text-xs text-muted-foreground/70 mt-1">Ends {new Date(sale.ends_at).toLocaleDateString()}</p>
                )}
              </div>
            </div>
            <a href={sale.button_link || "/shop"} className="btn-pill text-white font-semibold px-8 py-3 whitespace-nowrap" style={{ background: bgColor }}>
              {sale.button_text || "Shop Now"}
            </a>
          </div>
        </div>
        {sale.show_products && products.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {products.map((product: any, i: number) => (
              <motion.div key={product.id} {...anim} viewport={{ once: true }} transition={{ delay: i * layout.animation_delay }}>
                <ProductCard id={product.id} name={product.name} price={Number(product.price)} compareAtPrice={product.compare_at_price ? Number(product.compare_at_price) : undefined} thumbnail={product.thumbnail ?? undefined} avgRating={product.avg_rating ? Number(product.avg_rating) : undefined} reviewCount={product.review_count ?? undefined} slug={product.slug} className={cardExtra} />
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>
    );
  };

  const salesByPos = (pos: string) => salesConfig.filter((s: SaleConfig) => s.position === pos);
  const popupSales = salesConfig.filter((s: SaleConfig) => s.trigger_popup);
  const showNewArrivals = newArrivalsConfig?.enabled !== false && newArrivals.length > 0;

  const divider = layout.show_section_dividers ? getDivider(layout.divider_style) : null;
  const spacingClass = spacingMap[layout.section_spacing] || "gap-16";

  // Map section IDs to their sale position suffixes
  const sectionSaleMap: Record<string, string> = {
    slider: "after-slider",
    categories: "after-categories",
    featured: "after-featured",
    arrivals: "after-arrivals",
  };

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case "slider":
        return <ParallaxSlider key="slider" />;

      case "categories":
        return (
          <div key="categories" className={getSectionBgClass(layout.categories_bg)}>
            <CategoryGrid />
          </div>
        );

      case "category-sections":
        return (catSectionsConfig || []).map((section: any) => {
          const cat = sectionCategories.find((c) => c.id === section.category_id);
          const products = (sectionProducts as Record<string, any[]>)[section.category_id] || [];
          if (!cat || products.length === 0) return null;
          return (
            <section key={section.category_id}>
              <motion.div {...anim} viewport={{ once: true }} className={`flex items-center ${titleAlign} mb-8`}>
                <div className={layout.section_title_align === "center" ? "text-center" : ""}>
                  <h2 className={`${titleSize} font-bold font-display text-foreground`}>{cat.name}</h2>
                  <p className="text-muted-foreground mt-1">Explore our {cat.name.toLowerCase()} collection</p>
                </div>
                {layout.section_title_align !== "center" && (
                  <a href={`/categories/${cat.slug}`} className="btn-pill glass text-sm text-foreground hover:text-primary transition-colors">View All</a>
                )}
              </motion.div>
              <div className={`grid grid-cols-2 md:grid-cols-3 ${colsMap[layout.featured_columns] || "lg:grid-cols-4"} gap-4`}>
                {products.map((product: any, i: number) => (
                  <motion.div key={product.id} {...anim} viewport={{ once: true }} transition={{ delay: i * layout.animation_delay }}>
                    <ProductCard id={product.id} name={product.name} price={Number(product.price)} compareAtPrice={product.compare_at_price ? Number(product.compare_at_price) : undefined} thumbnail={product.thumbnail ?? undefined} avgRating={product.avg_rating ? Number(product.avg_rating) : undefined} reviewCount={product.review_count ?? undefined} slug={product.slug} className={cardExtra} />
                  </motion.div>
                ))}
              </div>
              {layout.section_title_align === "center" && (
                <div className="text-center mt-6">
                  <a href={`/categories/${cat.slug}`} className="btn-pill glass text-sm text-foreground hover:text-primary transition-colors">View All</a>
                </div>
              )}
            </section>
          );
        });

      case "featured":
        if (!isLoading && featuredProducts.length === 0) return null;
        return (
          <section key="featured" className={getSectionBgClass(layout.featured_bg)}>
            <motion.div {...anim} viewport={{ once: true }} className={`flex items-center ${titleAlign} mb-8`}>
              <div className={layout.section_title_align === "center" ? "text-center" : ""}>
                <h2 className={`${titleSize} font-bold font-display text-foreground`}>Featured Products</h2>
                <p className="text-muted-foreground mt-1">Handpicked just for you</p>
              </div>
              {layout.section_title_align !== "center" && (
                <a href="/shop" className="btn-pill glass text-sm text-foreground hover:text-primary transition-colors">View All</a>
              )}
            </motion.div>
            <div className={`grid grid-cols-2 md:grid-cols-3 ${colsMap[layout.featured_columns] || "lg:grid-cols-4"} gap-4`}>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[3/4] rounded-3xl bg-secondary/30 animate-pulse" />)
                : featuredProducts.map((product, i) => (
                    <motion.div key={product.id} {...anim} viewport={{ once: true }} transition={{ delay: i * layout.animation_delay }}>
                      <ProductCard id={product.id} name={product.name} price={Number(product.price)} compareAtPrice={product.compare_at_price ? Number(product.compare_at_price) : undefined} thumbnail={product.thumbnail ?? undefined} avgRating={product.avg_rating ? Number(product.avg_rating) : undefined} reviewCount={product.review_count ?? undefined} slug={product.slug} className={cardExtra} />
                    </motion.div>
                  ))}
            </div>
            {layout.section_title_align === "center" && (
              <div className="text-center mt-6">
                <a href="/shop" className="btn-pill glass text-sm text-foreground hover:text-primary transition-colors">View All</a>
              </div>
            )}
          </section>
        );

      case "arrivals":
        if (!showNewArrivals) return null;
        return (
          <section key="arrivals" className={getSectionBgClass(layout.arrivals_bg)}>
            <motion.div {...anim} viewport={{ once: true }} className={`flex items-center ${titleAlign} mb-8`}>
              <div className={`flex items-center gap-3 ${layout.section_title_align === "center" ? "justify-center" : ""}`}>
                <Sparkles className="w-7 h-7 text-primary" />
                <div className={layout.section_title_align === "center" ? "text-center" : ""}>
                  <h2 className={`${titleSize} font-bold font-display text-foreground`}>{newArrivalsConfig?.title || "New Arrivals"}</h2>
                  <p className="text-muted-foreground mt-1">{newArrivalsConfig?.subtitle || "Fresh drops just landed"}</p>
                </div>
              </div>
              {layout.section_title_align !== "center" && (
                <a href="/shop" className="btn-pill glass text-sm text-foreground hover:text-primary transition-colors">View All</a>
              )}
            </motion.div>
            <div className={`grid grid-cols-2 md:grid-cols-3 ${colsMap[layout.arrivals_columns] || "lg:grid-cols-4"} gap-4`}>
              {newArrivals.map((product, i) => (
                <motion.div key={product.id} {...anim} viewport={{ once: true }} transition={{ delay: i * layout.animation_delay }}>
                  <ProductCard id={product.id} name={product.name} price={Number(product.price)} compareAtPrice={product.compare_at_price ? Number(product.compare_at_price) : undefined} thumbnail={product.thumbnail ?? undefined} avgRating={product.avg_rating ? Number(product.avg_rating) : undefined} reviewCount={product.review_count ?? undefined} slug={product.slug} className={cardExtra} />
                </motion.div>
              ))}
            </div>
            {layout.section_title_align === "center" && (
              <div className="text-center mt-6">
                <a href="/shop" className="btn-pill glass text-sm text-foreground hover:text-primary transition-colors">View All</a>
              </div>
            )}
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen pb-20 lg:pb-0" style={getPatternStyle(layout.page_bg_pattern)}>
      <Navbar />
      <HomePopup />
      {popupSales.map((sale: SaleConfig) => <SalePopup key={sale.id} sale={sale} />)}

      <main className={`mx-auto px-4 pt-6 flex flex-col ${spacingClass}`} style={{ maxWidth: layout.container_max_width }}>
        {sectionOrder.map((section, idx) => {
          // Check visibility (default to visible if not specified)
          const isVisible = (section as any).visible !== false;
          if (!isVisible) return null;
          
          return (
            <React.Fragment key={section.id}>
              {renderSection(section.id)}
              {sectionSaleMap[section.id] && salesByPos(sectionSaleMap[section.id]).map(renderSaleBanner)}
              {idx < sectionOrder.length - 1 && divider}
            </React.Fragment>
          );
        })}
        {salesByPos("bottom").map(renderSaleBanner)}
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;
