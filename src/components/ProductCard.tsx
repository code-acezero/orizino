import React from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { motion } from "framer-motion";

export interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  thumbnail?: string;
  avgRating?: number;
  reviewCount?: number;
  slug: string;
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  name,
  price,
  compareAtPrice,
  thumbnail,
  avgRating = 0,
  reviewCount = 0,
  slug,
  className = "",
}) => {
  const discount = compareAtPrice
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="group glass rounded-3xl overflow-hidden"
    >
      <Link to={`/product/${slug}`} className="block">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-secondary/20">
          <img
            src={thumbnail || "/placeholder.svg"}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          {discount > 0 && (
            <span className="absolute top-3 left-3 btn-pill bg-destructive text-destructive-foreground text-xs py-1 px-3">
              -{discount}%
            </span>
          )}
          {/* Quick actions */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="glass rounded-full p-2 text-foreground hover:text-primary"
            >
              <Heart className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="glass rounded-full p-2 text-foreground hover:text-primary"
            >
              <ShoppingCart className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-medium text-foreground text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {name}
          </h3>
          <div className="flex items-center gap-1 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${
                  i < Math.round(avgRating)
                    ? "fill-primary text-primary"
                    : "text-muted-foreground/30"
                }`}
              />
            ))}
            <span className="text-xs text-muted-foreground ml-1">({reviewCount})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">${price.toFixed(2)}</span>
            {compareAtPrice && (
              <span className="text-sm text-muted-foreground line-through">
                ${compareAtPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
