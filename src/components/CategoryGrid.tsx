import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Shirt,
  Headphones,
  Home,
  Watch,
  ShoppingBasket,
  Sparkles,
} from "lucide-react";

const categories = [
  { name: "Fashion", slug: "fashion", icon: Shirt, color: "160 84% 45%" },
  { name: "Electronics", slug: "electronics", icon: Headphones, color: "200 90% 50%" },
  { name: "Home Appliance", slug: "home-appliance", icon: Home, color: "25 95% 55%" },
  { name: "Accessories", slug: "accessories", icon: Watch, color: "280 70% 55%" },
  { name: "Groceries", slug: "groceries", icon: ShoppingBasket, color: "140 60% 45%" },
  { name: "Others", slug: "others", icon: Sparkles, color: "340 82% 55%" },
];

const CategoryGrid: React.FC = () => {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-3 text-foreground">
            Shop by Category
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Browse through our wide range of categories
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                to={`/categories/${cat.slug}`}
                className="group glass rounded-3xl p-6 flex flex-col items-center gap-4 hover:border-primary/30 transition-all duration-300"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, hsl(${cat.color} / 0.2), hsl(${cat.color} / 0.05))`,
                  }}
                >
                  <cat.icon
                    className="w-7 h-7"
                    style={{ color: `hsl(${cat.color})` }}
                  />
                </motion.div>
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {cat.name}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;
