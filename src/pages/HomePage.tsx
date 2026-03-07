import React from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import ParallaxSlider from "@/components/ParallaxSlider";
import CategoryGrid from "@/components/CategoryGrid";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import { Zap } from "lucide-react";

// Demo featured products (will be replaced with DB data)
const demoProducts = [
  { id: "1", name: "Premium Wireless Headphones", price: 79.99, compareAtPrice: 129.99, slug: "premium-wireless-headphones", avgRating: 4.5, reviewCount: 128 },
  { id: "2", name: "Minimalist Leather Watch", price: 149.99, slug: "minimalist-leather-watch", avgRating: 4.8, reviewCount: 89 },
  { id: "3", name: "Smart Home Speaker Pro", price: 59.99, compareAtPrice: 89.99, slug: "smart-home-speaker-pro", avgRating: 4.2, reviewCount: 256 },
  { id: "4", name: "Designer Crossbody Bag", price: 95.00, slug: "designer-crossbody-bag", avgRating: 4.6, reviewCount: 67 },
  { id: "5", name: "Organic Coffee Blend Set", price: 34.99, compareAtPrice: 44.99, slug: "organic-coffee-blend", avgRating: 4.9, reviewCount: 312 },
  { id: "6", name: "Ergonomic Desk Lamp", price: 45.00, slug: "ergonomic-desk-lamp", avgRating: 4.3, reviewCount: 45 },
  { id: "7", name: "Running Shoes Ultra Light", price: 119.99, compareAtPrice: 159.99, slug: "running-shoes-ultra", avgRating: 4.7, reviewCount: 198 },
  { id: "8", name: "Wireless Charging Pad", price: 29.99, slug: "wireless-charging-pad", avgRating: 4.1, reviewCount: 412 },
];

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container mx-auto px-4 pt-6 space-y-16">
        {/* Parallax Slider */}
        <ParallaxSlider />

        {/* Categories */}
        <CategoryGrid />

        {/* Featured Products */}
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
            <a
              href="/shop"
              className="btn-pill glass text-sm text-foreground hover:text-primary transition-colors"
            >
              View All
            </a>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {demoProducts.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <ProductCard {...product} />
              </motion.div>
            ))}
          </div>
        </section>

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
            <a
              href="/flash-sale"
              className="btn-pill bg-gradient-accent text-accent-foreground font-semibold px-8 py-3 whitespace-nowrap"
            >
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
