import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/lib/app-toast";
import { Bot, Sparkles, MessageCircle, Upload, X, Image as ImageIcon } from "lucide-react";

const DEFAULT_CONFIG = {
  name: "AI Assistant",
  welcome_message: "Hi! I'm here to help you find products, track orders, and more. How can I assist you?",
  personality: "friendly, helpful, and knowledgeable about products",
  custom_instructions: "",
  is_enabled: true,
  show_on_all_pages: true,
  primary_color: "",
  avatar_emoji: "🤖",
  avatar_url: "",
  avatar_type: "emoji" as "emoji" | "image",
};

const AdminAISettings = () => {
  const qc = useQueryClient();
  const [form, setForm] = useState(DEFAULT_CONFIG);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `ai-agent/avatar-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      setForm((prev) => ({ ...prev, avatar_url: urlData.publicUrl, avatar_type: "image" as const }));
      toast.success("Avatar uploaded");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const { data: config } = useQuery({
    queryKey: ["admin-ai-config"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("value").eq("key", "ai_agent_config").maybeSingle();
      return (data?.value as any) || {};
    },
  });

  useEffect(() => {
    if (config) setForm({ ...DEFAULT_CONFIG, ...config });
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("site_settings").upsert({
        key: "ai_agent_config",
        value: form as any,
        updated_at: new Date().toISOString(),
      }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-ai-config"] });
      qc.invalidateQueries({ queryKey: ["ai-agent-config"] });
      toast.success("AI agent settings saved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold">AI Agent Settings</h1>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bot className="w-5 h-5" /> Identity</CardTitle>
            <CardDescription>Configure your AI agent's name and personality</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Agent Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="AI Assistant" />
            </div>

            {/* Avatar Type Selector */}
            <div className="space-y-3">
              <Label>Avatar</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, avatar_type: "emoji" })}
                  className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                    form.avatar_type === "emoji" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                  }`}
                >
                  Emoji
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, avatar_type: "image" })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                    form.avatar_type === "image" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" /> Image
                </button>
              </div>

              {form.avatar_type === "emoji" ? (
                <Input value={form.avatar_emoji} onChange={(e) => setForm({ ...form, avatar_emoji: e.target.value })} placeholder="🤖" maxLength={4} className="w-20 text-center text-xl" />
              ) : (
                <div className="space-y-2">
                  {form.avatar_url ? (
                    <div className="relative inline-block">
                      <img src={form.avatar_url} alt="Agent avatar" className="w-16 h-16 rounded-xl object-cover border border-border" />
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, avatar_url: "", avatar_type: "emoji" })}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : null}
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {uploading ? "Uploading..." : form.avatar_url ? "Change Image" : "Upload Avatar"}
                  </Button>
                  <p className="text-xs text-muted-foreground">Recommended: 128×128px, under 2MB</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Personality</Label>
              <Input value={form.personality} onChange={(e) => setForm({ ...form, personality: e.target.value })} placeholder="friendly, helpful..." />
            </div>
          </CardContent>
        </Card>

        {/* Behavior */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5" /> Behavior</CardTitle>
            <CardDescription>Control how and where the agent appears</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Enable AI Agent</p>
                <p className="text-xs text-muted-foreground">Show the chat widget on the site</p>
              </div>
              <Switch checked={form.is_enabled} onCheckedChange={(v) => setForm({ ...form, is_enabled: v })} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Show on All Pages</p>
                <p className="text-xs text-muted-foreground">Display floating widget site-wide</p>
              </div>
              <Switch checked={form.show_on_all_pages} onCheckedChange={(v) => setForm({ ...form, show_on_all_pages: v })} />
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MessageCircle className="w-5 h-5" /> Messages & Instructions</CardTitle>
            <CardDescription>Customize the agent's greeting and behavior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Welcome Message</Label>
              <Textarea
                value={form.welcome_message}
                onChange={(e) => setForm({ ...form, welcome_message: e.target.value })}
                placeholder="Hi! How can I help you today?"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Custom Instructions</Label>
              <Textarea
                value={form.custom_instructions}
                onChange={(e) => setForm({ ...form, custom_instructions: e.target.value })}
                placeholder="Additional instructions for the AI agent... (e.g., specific policies, brand voice guidelines, topics to avoid)"
                rows={5}
              />
              <p className="text-xs text-muted-foreground">
                These instructions are added to the AI's system prompt. Use them to customize behavior, add policies, or restrict topics.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAISettings;
