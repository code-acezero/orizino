import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Phone, MapPin, Save, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ProfilePage: React.FC = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState({ street: "", city: "", state: "", zip: "", country: "" });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setFullName(data.full_name || "");
          setPhone(data.phone || "");
          const addr = (data.address as Record<string, string>) || {};
          setAddress({ street: addr.street || "", city: addr.city || "", state: addr.state || "", zip: addr.zip || "", country: addr.country || "" });
        }
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone, address })
      .eq("id", user.id);
    setLoading(false);
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated!" });
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-10 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold font-display text-foreground mb-8">My Profile</h1>

          <div className="glass-strong rounded-3xl p-8 space-y-6">
            {/* Email (read-only) */}
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Email</label>
              <div className="px-4 py-3 rounded-2xl bg-secondary/30 border border-border text-muted-foreground text-sm">
                {user?.email}
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Phone</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="text-sm text-muted-foreground mb-1 block flex items-center gap-1">
                <MapPin className="w-4 h-4" /> Address
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input placeholder="Street" value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  className="md:col-span-2 px-4 py-3 rounded-2xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                <input placeholder="City" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  className="px-4 py-3 rounded-2xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                <input placeholder="State" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })}
                  className="px-4 py-3 rounded-2xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                <input placeholder="ZIP Code" value={address.zip} onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                  className="px-4 py-3 rounded-2xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                <input placeholder="Country" value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })}
                  className="px-4 py-3 rounded-2xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSave} disabled={loading}
                className="flex-1 btn-pill bg-gradient-primary text-primary-foreground font-semibold py-3 flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> Save Changes</>}
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={signOut}
                className="btn-pill glass text-destructive font-semibold py-3 px-6 flex items-center gap-2">
                <LogOut className="w-4 h-4" /> Sign Out
              </motion.button>
            </div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;
