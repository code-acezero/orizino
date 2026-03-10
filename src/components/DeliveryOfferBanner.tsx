import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Truck, Clock, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const DeliveryOfferBanner: React.FC = () => {
  const { data: offers = [] } = useQuery({
    queryKey: ["active-delivery-offers-banner"],
    queryFn: async () => {
      const { data } = await supabase
        .from("delivery_offers")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(3);
      return data || [];
    },
    staleTime: 60_000,
  });

  if (offers.length === 0) return null;

  // Show the best offer
  const offer = offers[0] as any;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong rounded-2xl p-4 md:p-5 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5" />
      <div className="relative flex flex-col sm:flex-row items-center gap-3 sm:gap-5">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Truck className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="font-display font-bold text-foreground">{offer.title}</p>
          {offer.description && (
            <p className="text-sm text-muted-foreground mt-0.5">{offer.description}</p>
          )}
          <div className="flex items-center gap-3 justify-center sm:justify-start mt-1 flex-wrap">
            {offer.min_order_amount > 0 && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                Min order: ৳{offer.min_order_amount}
              </span>
            )}
            {offer.target_areas?.length > 0 && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {offer.target_areas.join(", ")}
              </span>
            )}
          </div>
        </div>
        {offer.expires_at && <CountdownTimer endsAt={offer.expires_at} />}
      </div>
    </motion.div>
  );
};

const CountdownTimer: React.FC<{ endsAt: string }> = ({ endsAt }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Expired"); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  if (timeLeft === "Expired") return null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-primary font-medium shrink-0">
      <Clock className="w-3.5 h-3.5" />
      <span>{timeLeft}</span>
    </div>
  );
};

export default DeliveryOfferBanner;
