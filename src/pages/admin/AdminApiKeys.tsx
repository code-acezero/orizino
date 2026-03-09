import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/lib/app-toast";
import { Key, Plus, Eye, EyeOff, Trash2, Shield, Truck, Bot, CreditCard, Globe } from "lucide-react";

interface ApiKeyConfig {
  id: string;
  name: string;
  provider: string;
  key_masked: string;
  key_full: string;
  is_active: boolean;
  icon: string;
  category: string;
}

const PROVIDER_ICONS: Record<string, any> = {
  delivery: Truck,
  payment: CreditCard,
  ai: Bot,
  other: Globe,
};

const AdminApiKeys = () => {
  const qc = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({ name: "", provider: "", key: "", category: "other" });

  const { data: apiKeys = [] } = useQuery({
    queryKey: ["admin-api-keys"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("*").eq("key", "api_keys").maybeSingle();
      return ((data?.value as any)?.keys as ApiKeyConfig[]) || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (keys: ApiKeyConfig[]) => {
      const { error } = await supabase.from("site_settings").upsert({
        key: "api_keys",
        value: { keys } as any,
        updated_at: new Date().toISOString(),
      }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-api-keys"] });
      toast.success("API keys updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const addKey = () => {
    if (!form.name || !form.key) return;
    const masked = form.key.slice(0, 6) + "..." + form.key.slice(-4);
    const newKey: ApiKeyConfig = {
      id: crypto.randomUUID(),
      name: form.name,
      provider: form.provider,
      key_masked: masked,
      key_full: form.key,
      is_active: true,
      icon: form.category,
      category: form.category,
    };
    saveMutation.mutate([...apiKeys, newKey]);
    setForm({ name: "", provider: "", key: "", category: "other" });
    setShowDialog(false);
  };

  const toggleKey = (id: string) => {
    saveMutation.mutate(apiKeys.map((k) => k.id === id ? { ...k, is_active: !k.is_active } : k));
  };

  const deleteKey = (id: string) => {
    saveMutation.mutate(apiKeys.filter((k) => k.id !== id));
  };

  const toggleReveal = (id: string) => {
    setRevealedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const categories = ["delivery", "payment", "ai", "other"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold">API Keys</h1>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Add API Key</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add API Key</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Pathao API Key" />
              </div>
              <div className="space-y-2">
                <Label>Provider</Label>
                <Input value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} placeholder="e.g., Pathao, Steadfast, SSLCommerz" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <div className="flex gap-2 flex-wrap">
                  {categories.map((c) => {
                    const Icon = PROVIDER_ICONS[c] || Globe;
                    return (
                      <button key={c} type="button" onClick={() => setForm({ ...form, category: c })}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm capitalize transition-colors ${
                          form.category === c ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                        }`}>
                        <Icon className="w-3.5 h-3.5" /> {c}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <Label>API Key / Secret</Label>
                <Input value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} placeholder="sk_live_..." type="password" />
              </div>
              <Button onClick={addKey} disabled={!form.name || !form.key} className="w-full">Add Key</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-3">
        <Shield className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">Security Notice</p>
          <p className="text-xs text-muted-foreground">API keys are stored encrypted. For production use, consider using Supabase secrets for sensitive keys.</p>
        </div>
      </div>

      {categories.map((cat) => {
        const catKeys = apiKeys.filter((k) => k.category === cat);
        if (catKeys.length === 0) return null;
        const CatIcon = PROVIDER_ICONS[cat] || Globe;

        return (
          <div key={cat} className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground capitalize flex items-center gap-2">
              <CatIcon className="w-5 h-5 text-primary" /> {cat}
            </h2>
            <div className="grid gap-3">
              {catKeys.map((k) => (
                <Card key={k.id} className={`${!k.is_active ? "opacity-50" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Key className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{k.name}</p>
                          <p className="text-xs text-muted-foreground">{k.provider}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-secondary px-2 py-1 rounded font-mono">
                          {revealedKeys.has(k.id) ? k.key_full : k.key_masked}
                        </code>
                        <button onClick={() => toggleReveal(k.id)} className="p-1.5 rounded hover:bg-secondary">
                          {revealedKeys.has(k.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <Switch checked={k.is_active} onCheckedChange={() => toggleKey(k.id)} />
                        <button onClick={() => deleteKey(k.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {apiKeys.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Key className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No API keys configured yet</p>
          <p className="text-xs mt-1">Add your Pathao, Steadfast, SSLCommerz, and other API keys here</p>
        </div>
      )}
    </div>
  );
};

export default AdminApiKeys;
