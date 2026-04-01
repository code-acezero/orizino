import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/lib/app-toast";
import { Send, Bot, Bell, ShoppingCart, Headphones, CheckCircle2, XCircle, Loader2, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

interface TelegramConfig {
  enabled: boolean;
  chat_id: string;
  notify_orders: boolean;
  notify_support: boolean;
  notify_stock: boolean;
  notify_reviews: boolean;
  welcome_message: string;
}

const DEFAULT_CONFIG: TelegramConfig = {
  enabled: false,
  chat_id: "",
  notify_orders: true,
  notify_support: true,
  notify_stock: true,
  notify_reviews: false,
  welcome_message: "Welcome to our support! How can we help you?",
};

const AdminTelegram: React.FC = () => {
  const qc = useQueryClient();
  const [config, setConfig] = useState<TelegramConfig>(DEFAULT_CONFIG);
  const [testMessage, setTestMessage] = useState("🔔 Test notification from your store!");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  const { data: savedConfig } = useQuery({
    queryKey: ["admin-telegram-config"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("*").eq("key", "telegram_config").maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (savedConfig?.value) {
      const val = (savedConfig.value as any)?.value ?? savedConfig.value;
      if (val && typeof val === "object") setConfig((prev) => ({ ...prev, ...val }));
    }
  }, [savedConfig]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const jsonVal = { value: config } as any;
      if (savedConfig) {
        await supabase.from("site_settings").update({ value: jsonVal }).eq("id", savedConfig.id);
      } else {
        await supabase.from("site_settings").insert({ key: "telegram_config", value: jsonVal });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-telegram-config"] });
      toast.success("Telegram configuration saved");
    },
    onError: (e) => toast.error(e.message),
  });

  const sendTestMessage = async () => {
    if (!config.chat_id) {
      toast.error("Please enter a Chat ID first");
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const { error } = await supabase.functions.invoke("telegram-notify", {
        body: { chat_id: config.chat_id, message: testMessage },
      });
      if (error) throw error;
      setTestResult("success");
      toast.success("Test message sent!");
    } catch (e: any) {
      setTestResult("error");
      toast.error(e.message || "Failed to send test message");
    } finally {
      setTesting(false);
    }
  };

  const notificationToggles = [
    { key: "notify_orders" as const, label: "New Orders", description: "Get notified when a new order is placed", icon: ShoppingCart },
    { key: "notify_support" as const, label: "Support Requests", description: "Get notified when a customer needs help", icon: Headphones },
    { key: "notify_stock" as const, label: "Low Stock Alerts", description: "Get notified when products are running low", icon: Bell },
    { key: "notify_reviews" as const, label: "New Reviews", description: "Get notified when customers leave reviews", icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <Send className="w-8 h-8 text-[#0088cc]" />
            Telegram Integration
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Connect your store to Telegram for real-time alerts and 2-way communication
          </p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      <Tabs defaultValue="setup">
        <TabsList>
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="test">Test</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" /> Connection
              </CardTitle>
              <CardDescription>Connect your Telegram bot to receive store notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Telegram Integration</Label>
                  <p className="text-xs text-muted-foreground">Turn on 2-way sync between your store and Telegram</p>
                </div>
                <Switch checked={config.enabled} onCheckedChange={(v) => setConfig({ ...config, enabled: v })} />
              </div>

              <div className="space-y-2">
                <Label>Chat ID / Channel ID</Label>
                <Input
                  value={config.chat_id}
                  onChange={(e) => setConfig({ ...config, chat_id: e.target.value })}
                  placeholder="e.g. -1001234567890 or @yourchannel"
                  className="rounded-xl"
                />
                <p className="text-xs text-muted-foreground">
                  The Telegram chat, group, or channel ID where notifications will be sent.
                  Use <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="text-primary hover:underline">@userinfobot</a> to find your chat ID.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Welcome Message</Label>
                <Input
                  value={config.welcome_message}
                  onChange={(e) => setConfig({ ...config, welcome_message: e.target.value })}
                  placeholder="Welcome message for support chats"
                  className="rounded-xl"
                />
              </div>

              <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
                <h4 className="text-sm font-medium mb-2">Setup Instructions</h4>
                <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                  <li>The Telegram bot is already connected via Lovable Connectors</li>
                  <li>Add the bot to your Telegram group or channel</li>
                  <li>Make the bot an admin (so it can send messages)</li>
                  <li>Enter the chat/channel ID above and save</li>
                  <li>Send a test message to verify the connection</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notification Events</CardTitle>
              <CardDescription>Choose which events send alerts to your Telegram</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {notificationToggles.map((toggle) => (
                <div key={toggle.key} className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:border-primary/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-secondary/60 flex items-center justify-center">
                      <toggle.icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{toggle.label}</p>
                      <p className="text-xs text-muted-foreground">{toggle.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={config[toggle.key]}
                    onCheckedChange={(v) => setConfig({ ...config, [toggle.key]: v })}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Test Connection</CardTitle>
              <CardDescription>Send a test message to verify your Telegram setup</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Test Message</Label>
                <Input
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={sendTestMessage} disabled={testing || !config.chat_id}>
                  {testing ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                  ) : (
                    <><Send className="w-4 h-4 mr-2" /> Send Test Message</>
                  )}
                </Button>
                {testResult === "success" && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1.5 text-primary text-sm">
                    <CheckCircle2 className="w-4 h-4" /> Sent successfully!
                  </motion.div>
                )}
                {testResult === "error" && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1.5 text-destructive text-sm">
                    <XCircle className="w-4 h-4" /> Failed to send
                  </motion.div>
                )}
              </div>

              {!config.chat_id && (
                <p className="text-xs text-amber-400">⚠️ Enter a Chat ID in the Setup tab first</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminTelegram;
