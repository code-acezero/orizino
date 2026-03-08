import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ShoppingBag, Shield, Truck, Sparkles } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const features = [
  { icon: Truck, title: "Free Shipping", desc: "On orders over $50" },
  { icon: Shield, title: "Secure Payment", desc: "100% protected" },
  { icon: ShoppingBag, title: "Easy Returns", desc: "30-day return policy" },
  { icon: Sparkles, title: "Premium Quality", desc: "Curated products" },
];

const LandingPage: React.FC = () => {
  useSeoMeta("landing", "Welcome | Ace Marketplace");
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
        </div>

        <div className="relative container mx-auto px-4 py-20">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="inline-block btn-pill glass text-primary text-sm mb-6 border border-primary/30">
                ✨ Welcome to the Future of Shopping
              </span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl md:text-7xl lg:text-8xl font-bold font-display leading-tight mb-6"
            >
              <span className="text-foreground">Shop </span>
              <span className="text-gradient">Smarter.</span>
              <br />
              <span className="text-foreground">Live </span>
              <span className="text-gradient">Better.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl"
            >
              Discover a curated marketplace where quality meets affordability. From fashion to electronics — everything you need, all in one place.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-wrap gap-4"
            >
              <Link to="/home">
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 btn-pill bg-gradient-primary text-primary-foreground font-semibold text-lg px-8 py-3.5 glow-primary"
                >
                  Start Shopping
                  <ArrowRight className="w-5 h-5" />
                </motion.span>
              </Link>
              <Link to="/home">
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 btn-pill glass text-foreground font-semibold text-lg px-8 py-3.5"
                >
                  Explore Categories
                </motion.span>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Floating glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-30" style={{ background: "var(--gradient-glow)" }} />
      </section>

      {/* Features Strip */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-3xl p-6 text-center group hover:border-primary/30 transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-strong rounded-3xl p-12 md:p-16 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 opacity-20" style={{ background: "var(--gradient-glow)" }} />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold font-display text-foreground mb-4">
                Ready to Experience <span className="text-gradient">Zero</span>?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                Join thousands of satisfied shoppers. Create your account and start exploring today.
              </p>
              <Link to="/auth">
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 btn-pill bg-gradient-primary text-primary-foreground font-semibold text-lg px-10 py-4 glow-primary"
                >
                  Create Account
                  <ArrowRight className="w-5 h-5" />
                </motion.span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
