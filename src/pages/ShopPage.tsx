import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { useSeoMeta } from "@/hooks/use-seo-meta";
import Breadcrumbs from "@/components/Breadcrumbs";

import catElectronics from "@/assets/icons/cat-electronics.png";
import catFashion from "@/assets/icons/cat-fashion.png";
import catHome from "@/assets/icons/cat-home.png";
import catAccessories from "@/assets/icons/cat-accessories.png";
import catGroceries from "@/assets/icons/cat-groceries.png";
import catSports from "@/assets/icons/cat-sports.png";

const fallbackIcons: Record<string, string> = {
  electronics: catElectronics,
  fashion: catFashion,
  "home-living": catHome,
  accessories: catAccessories,
  groceries: catGroceries,
  "sports-outdoors": catSports,
};

const sortOptions = [
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Top Rated", value: "rating" },
  { label: "Most Popular", value: "popular" },
];

const ShopPage: React.FC = () => {
  useSeoMeta("shop", "Shop | Ace Marketplace");
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("cat") || "");
  const [expandedParent, setExpandedParent] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [showFilters, setShowFilters] = useState(false);

  const { data: siteSettings } = useQuery({
    queryKey: ["site-settings-name"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("key, value").in("key", ["site_name"]);
      const map: Record<string, any> = {};
      data?.forEach((s) => (map[s.key] = s.value));
      return map;
    },
    staleTime: 10 * 60 * 1000,
  });

  const siteName = (siteSettings?.site_name as string) || "Zero";

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name, slug, icon, icon_url, parent_id, accent_color")
        .eq("is_active", true)
        .order("sort_order");
      return data || [];
    },
  });

  const parentCategories = categories?.filter((c) => !c.parent_id) || [];
  const getChildren = (parentId: string) => categories?.filter((c) => c.parent_id === parentId) || [];

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", selectedCategory, sort],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*")
        .eq("is_active", true);

      if (selectedCategory) {
        query = query.eq("category_id", selectedCategory);
      }

      switch (sort) {
        case "price_asc": query = query.order("price", { ascending: true }); break;
        case "price_desc": query = query.order("price", { ascending: false }); break;
        case "rating": query = query.order("avg_rating", { ascending: false }); break;
        case "popular": query = query.order("review_count", { ascending: false }); break;
        default: query = query.order("created_at", { ascending: false });
      }

      const { data } = await query;
      return data || [];
    },
  });

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => {
      const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
      return matchesSearch && matchesPrice;
    });
  }, [products, searchQuery, priceRange]);

  const getCategoryIcon = (cat: { icon_url: string | null; icon: string | null; slug: string }) => {
    if (cat.icon_url) return cat.icon_url;
    return fallbackIcons[cat.slug] || null;
  };

  const handleParentClick = (catId: string) => {
    if (expandedParent === catId) {
      setExpandedParent(null);
    } else {
      setExpandedParent(catId);
    }
    // Also select this parent category
    setSelectedCategory(catId);
  };

  const handleSubClick = (subId: string) => {
    setSelectedCategory(subId);
  };

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: "Home", href: "/home" }, { label: "Shop" }]} className="mb-4" />
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold font-display text-foreground">
              <span className="text-gradient">{siteName}</span> Mall
            </h1>
            <p className="text-muted-foreground mt-1">{filteredProducts.length} products found</p>
          </div>

          {/* Search */}
          <div className="flex gap-3 flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className="p-3 rounded-2xl glass text-muted-foreground hover:text-foreground md:hidden">
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <aside className={`${showFilters ? "block" : "hidden"} md:block w-full md:w-64 shrink-0`}>
            <div className="glass-strong rounded-3xl p-6 space-y-6 sticky top-24">
              {/* Categories — collapsible parent/child */}
              <div>
                <h3 className="font-display font-semibold text-foreground mb-3">Categories</h3>
                <div className="space-y-0.5">
                  <button
                    onClick={() => { setSelectedCategory(""); setExpandedParent(null); }}
                    className={`flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${!selectedCategory ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`}
                  >
                    All Categories
                  </button>

                  {parentCategories.map((cat) => {
                    const children = getChildren(cat.id);
                    const isExpanded = expandedParent === cat.id;
                    const isSelected = selectedCategory === cat.id;
                    const iconSrc = getCategoryIcon(cat);

                    return (
                      <div key={cat.id}>
                        <button
                          onClick={() => handleParentClick(cat.id)}
                          className={`flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all group ${
                            isSelected ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                          }`}
                        >
                          {iconSrc ? (
                            <img src={iconSrc} alt="" className="w-6 h-6 rounded-lg object-contain" />
                          ) : cat.icon ? (
                            <span className="text-base">{cat.icon}</span>
                          ) : (
                            <span className="w-6 h-6 rounded-lg bg-secondary/50" />
                          )}
                          <span className="flex-1">{cat.name}</span>
                          {children.length > 0 && (
                            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                          )}
                        </button>

                        {/* Subcategories */}
                        <AnimatePresence>
                          {isExpanded && children.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="pl-4 mt-0.5 space-y-0.5 border-l-2 border-border/50 ml-5">
                                {children.map((sub) => (
                                  <button
                                    key={sub.id}
                                    onClick={() => handleSubClick(sub.id)}
                                    className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-xl text-xs transition-colors ${
                                      selectedCategory === sub.id ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                    }`}
                                  >
                                    {sub.icon_url ? (
                                      <img src={sub.icon_url} alt="" className="w-4 h-4 rounded object-contain" />
                                    ) : sub.icon ? (
                                      <span className="text-xs">{sub.icon}</span>
                                    ) : null}
                                    {sub.name}
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="font-display font-semibold text-foreground mb-3">Price Range</h3>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange[0] || ""}
                    onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <span className="text-muted-foreground self-center">—</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange[1] === 10000 ? "" : priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value) || 10000])}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              {/* Sort */}
              <div>
                <h3 className="font-display font-semibold text-foreground mb-3">Sort By</h3>
                <div className="space-y-1">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSort(opt.value)}
                      className={`block w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${sort === opt.value ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Desktop sort bar */}
            <div className="hidden md:flex items-center justify-end gap-2 mb-6">
              <span className="text-sm text-muted-foreground">Sort:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="px-4 py-2 rounded-xl bg-secondary/50 border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="glass rounded-3xl overflow-hidden animate-pulse">
                    <div className="aspect-square bg-secondary/30" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-secondary/30 rounded-full w-3/4" />
                      <div className="h-3 bg-secondary/30 rounded-full w-1/2" />
                      <div className="h-4 bg-secondary/30 rounded-full w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-lg">No products found</p>
                <p className="text-muted-foreground/60 text-sm mt-1">Try adjusting your filters or search query</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filteredProducts.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <ProductCard
                      id={product.id}
                      name={product.name}
                      price={product.price}
                      compareAtPrice={product.compare_at_price ?? undefined}
                      thumbnail={product.thumbnail ?? undefined}
                      avgRating={product.avg_rating ?? 0}
                      reviewCount={product.review_count ?? 0}
                      slug={product.slug}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ShopPage;
