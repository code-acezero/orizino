import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const defaultSettings = {
  site_name: "Zero Marketplace",
  site_description: "Your premium online marketplace",
  logo_url: "",
  currency: "USD",
  shipping_fee: "5.00",
};

const AdminSettings = () => {
  const qc = useQueryClient();
  const [form, setForm] = useState(defaultSettings);

  const { data: settings } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (settings) {
      const map: Record<string, any> = {};
      settings.forEach((s) => { map[s.key] = typeof s.value === "object" && s.value !== null ? (s.value as any).value ?? s.value : s.value; });
      setForm((prev) => ({ ...prev, ...map }));
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      for (const [key, value] of Object.entries(form)) {
        const existing = settings?.find((s) => s.key === key);
        const jsonValue = { value } as any;
        if (existing) {
          await supabase.from("site_settings").update({ value: jsonValue }).eq("id", existing.id);
        } else {
          await supabase.from("site_settings").insert({ key, value: jsonValue });
        }
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-settings"] }); toast.success("Settings saved"); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold">Site Settings</h1>

      <Card className="glass max-w-lg">
        <CardHeader><CardTitle>General</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Site Name</Label><Input value={form.site_name} onChange={(e) => setForm({ ...form, site_name: e.target.value })} /></div>
          <div><Label>Description</Label><Input value={form.site_description} onChange={(e) => setForm({ ...form, site_description: e.target.value })} /></div>
          <div><Label>Logo URL</Label><Input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Currency</Label><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></div>
            <div><Label>Default Shipping Fee</Label><Input type="number" value={form.shipping_fee} onChange={(e) => setForm({ ...form, shipping_fee: e.target.value })} /></div>
          </div>
          <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
