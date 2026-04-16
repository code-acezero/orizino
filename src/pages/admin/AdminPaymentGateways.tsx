import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/lib/app-toast";
import { CreditCard, Smartphone, Building2, QrCode, Power, Loader2 } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";

interface PersonalAccount {
  enabled: boolean;
  account_number: string;
  account_holder: string;
  qr_code_url: string;
  instructions: string;
}

interface PaymentConfig {
  mfs_system_enabled: boolean;
  cod_enabled: boolean;
  gateways_enabled: string[];
  stripe: { enabled: boolean; publishable_key: string };
  sslcommerz: { enabled: boolean; store_id: string; sandbox: boolean };
  bkash_merchant: { enabled: boolean };
  nagad_merchant: { enabled: boolean };
  personal_bkash: PersonalAccount;
  personal_nagad: PersonalAccount;
  personal_upay: PersonalAccount;
  personal_rocket: PersonalAccount;
}

const DEFAULT: PaymentConfig = {
  mfs_system_enabled: true,
  cod_enabled: true,
  gateways_enabled: ["cod"],
  stripe: { enabled: false, publishable_key: "" },
  sslcommerz: { enabled: false, store_id: "", sandbox: true },
  bkash_merchant: { enabled: false },
  nagad_merchant: { enabled: false },
  personal_bkash: { enabled: false, account_number: "", account_holder: "", qr_code_url: "", instructions: "Send money to the number below. After sending, enter your Transaction ID." },
  personal_nagad: { enabled: false, account_number: "", account_holder: "", qr_code_url: "", instructions: "Send money to the number below. After sending, enter your Transaction ID." },
  personal_upay: { enabled: false, account_number: "", account_holder: "", qr_code_url: "", instructions: "Send money to the number below. After sending, enter your Transaction ID." },
  personal_rocket: { enabled: false, account_number: "", account_holder: "", qr_code_url: "", instructions: "Send money to the number below. After sending, enter your Transaction ID." },
};

const methodThemes: Record<string, { bg: string; fg: string; accent: string }> = {
  bKash: { bg: "#E2136E", fg: "#FFFFFF", accent: "#D1145B" },
  Nagad: { bg: "#F26522", fg: "#FFFFFF", accent: "#E85A1D" },
  Upay: { bg: "#0066CC", fg: "#FFFFFF", accent: "#0055AA" },
  Rocket: { bg: "#8E24AA", fg: "#FFFFFF", accent: "#7B1FA2" },
};

const generateQRCodeUrl = (accountNumber: string, label: string): string => {
  const data = encodeURIComponent(accountNumber);
  const bgColor = methodThemes[label]?.bg?.replace("#", "") || "E2136E";
  const fgColor = methodThemes[label]?.fg?.replace("#", "") || "FFFFFF";
  // Use a QR code API with branding colors
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${data}&bgcolor=${bgColor}&color=${fgColor}&margin=20`;
};

const PersonalAccountForm: React.FC<{
  label: string;
  icon: React.ReactNode;
  value: PersonalAccount;
  onChange: (v: PersonalAccount) => void;
}> = ({ label, icon, value, onChange }) => {
  const [generatingQR, setGeneratingQR] = useState(false);

  const handleGenerateQR = async () => {
    if (!value.account_number) {
      toast.error("Enter an account number first");
      return;
    }
    setGeneratingQR(true);

    try {
      const qrUrl = generateQRCodeUrl(value.account_number, label);

      // Fetch the QR code image and upload to Supabase storage
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const fileName = `qr-${label.toLowerCase()}-${Date.now()}.png`;
      const path = `payment-qr/${fileName}`;

      const { data, error } = await supabase.storage.from("banners").upload(path, blob, {
        cacheControl: "3600",
        contentType: "image/png",
        upsert: true,
      });

      if (error) throw error;
      const { data: urlData } = supabase.storage.from("banners").getPublicUrl(data.path);
      onChange({ ...value, qr_code_url: urlData.publicUrl });
      toast.success(`${label} QR code generated!`);
    } catch (err: any) {
      toast.error("Failed to generate QR: " + err.message);
    } finally {
      setGeneratingQR(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-base">{label} Personal Account</CardTitle>
          </div>
          <Switch checked={value.enabled} onCheckedChange={(v) => onChange({ ...value, enabled: v })} />
        </div>
      </CardHeader>
      {value.enabled && (
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Account Number</Label>
              <Input value={value.account_number} onChange={(e) => onChange({ ...value, account_number: e.target.value })} placeholder="01XXXXXXXXX" />
            </div>
            <div className="space-y-2">
              <Label>Account Holder Name</Label>
              <Input value={value.account_holder} onChange={(e) => onChange({ ...value, account_holder: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>QR Code Image</Label>
              <Button type="button" size="sm" variant="outline" onClick={handleGenerateQR}
                disabled={generatingQR || !value.account_number} className="rounded-xl text-xs">
                {generatingQR ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <QrCode className="w-3 h-3 mr-1" />}
                Auto-Generate QR
              </Button>
            </div>
            <ImageUpload bucket="banners" folder="payment-qr" value={value.qr_code_url} onUploaded={(url) => onChange({ ...value, qr_code_url: url })} />
          </div>
          <div className="space-y-2">
            <Label>Payment Instructions</Label>
            <Textarea value={value.instructions} onChange={(e) => onChange({ ...value, instructions: e.target.value })} rows={3} />
          </div>
        </CardContent>
      )}
    </Card>
  );
};

const AdminPaymentGateways = () => {
  const qc = useQueryClient();
  const [form, setForm] = useState<PaymentConfig>(DEFAULT);

  const { data: config } = useQuery({
    queryKey: ["admin-payment-config"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("value").eq("key", "payment_gateways_config").maybeSingle();
      return (data?.value as any) || {};
    },
  });

  useEffect(() => {
    if (config && typeof config === "object") setForm({ ...DEFAULT, ...config });
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("site_settings").upsert({
        key: "payment_gateways_config",
        value: form as any,
        updated_at: new Date().toISOString(),
      }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-payment-config"] });
      qc.invalidateQueries({ queryKey: ["payment-gateways-config"] });
      toast.success("Payment settings saved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold">Payment Gateways</h1>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* System Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Power className="w-5 h-5" /> System Controls</CardTitle>
          <CardDescription>Global payment system settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">MFS Payment System</p>
              <p className="text-xs text-muted-foreground">Enable/disable the entire MFS screenshot-based payment verification system</p>
            </div>
            <Switch checked={form.mfs_system_enabled} onCheckedChange={(v) => setForm({ ...form, mfs_system_enabled: v })} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Cash on Delivery</p>
              <p className="text-xs text-muted-foreground">Allow customers to pay on delivery</p>
            </div>
            <Switch checked={form.cod_enabled} onCheckedChange={(v) => setForm({ ...form, cod_enabled: v })} />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="personal"><Smartphone className="w-4 h-4 mr-1" /> Personal Accounts</TabsTrigger>
          <TabsTrigger value="stripe"><CreditCard className="w-4 h-4 mr-1" /> Stripe</TabsTrigger>
          <TabsTrigger value="merchant"><Building2 className="w-4 h-4 mr-1" /> Merchant APIs</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Payment Accounts</CardTitle>
              <CardDescription>Accept payments to your personal mobile banking accounts. Users will send money, upload a screenshot, and your team verifies the payment before confirming the order.</CardDescription>
            </CardHeader>
          </Card>
          <PersonalAccountForm label="bKash" icon={<Smartphone className="w-5 h-5 text-pink-500" />}
            value={form.personal_bkash} onChange={(v) => setForm({ ...form, personal_bkash: v })} />
          <PersonalAccountForm label="Nagad" icon={<Smartphone className="w-5 h-5 text-orange-500" />}
            value={form.personal_nagad} onChange={(v) => setForm({ ...form, personal_nagad: v })} />
          <PersonalAccountForm label="Upay" icon={<Smartphone className="w-5 h-5 text-blue-500" />}
            value={form.personal_upay} onChange={(v) => setForm({ ...form, personal_upay: v })} />
          <PersonalAccountForm label="Rocket" icon={<Smartphone className="w-5 h-5 text-purple-500" />}
            value={form.personal_rocket} onChange={(v) => setForm({ ...form, personal_rocket: v })} />
        </TabsContent>

        <TabsContent value="stripe" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Stripe</CardTitle>
                  <CardDescription>Accept international card payments via Stripe</CardDescription>
                </div>
                <Switch checked={form.stripe.enabled} onCheckedChange={(v) => setForm({ ...form, stripe: { ...form.stripe, enabled: v } })} />
              </div>
            </CardHeader>
            {form.stripe.enabled && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Publishable Key</Label>
                  <Input value={form.stripe.publishable_key} onChange={(e) => setForm({ ...form, stripe: { ...form.stripe, publishable_key: e.target.value } })} placeholder="pk_live_..." />
                </div>
                <p className="text-xs text-muted-foreground">Secret key must be added as a server-side secret via the API Keys page.</p>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="merchant" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>SSLCommerz</CardTitle>
                  <CardDescription>Accept Bangladeshi card/mobile payments via SSLCommerz</CardDescription>
                </div>
                <Switch checked={form.sslcommerz.enabled} onCheckedChange={(v) => setForm({ ...form, sslcommerz: { ...form.sslcommerz, enabled: v } })} />
              </div>
            </CardHeader>
            {form.sslcommerz.enabled && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Store ID</Label>
                  <Input value={form.sslcommerz.store_id} onChange={(e) => setForm({ ...form, sslcommerz: { ...form.sslcommerz, store_id: e.target.value } })} />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.sslcommerz.sandbox} onCheckedChange={(v) => setForm({ ...form, sslcommerz: { ...form.sslcommerz, sandbox: v } })} />
                  <Label>Sandbox Mode</Label>
                </div>
                <p className="text-xs text-muted-foreground">Store password must be added as a server-side secret.</p>
              </CardContent>
            )}
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>bKash Merchant API</CardTitle>
                  <CardDescription>Accept bKash payments via merchant API (requires bKash merchant approval)</CardDescription>
                </div>
                <Switch checked={form.bkash_merchant.enabled} onCheckedChange={(v) => setForm({ ...form, bkash_merchant: { ...form.bkash_merchant, enabled: v } })} />
              </div>
            </CardHeader>
            {form.bkash_merchant.enabled && (
              <CardContent>
                <p className="text-sm text-muted-foreground">API credentials must be added as server-side secrets (BKASH_APP_KEY, BKASH_APP_SECRET, BKASH_USERNAME, BKASH_PASSWORD) via the API Keys page.</p>
              </CardContent>
            )}
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Nagad Merchant API</CardTitle>
                  <CardDescription>Accept Nagad payments via merchant API</CardDescription>
                </div>
                <Switch checked={form.nagad_merchant.enabled} onCheckedChange={(v) => setForm({ ...form, nagad_merchant: { ...form.nagad_merchant, enabled: v } })} />
              </div>
            </CardHeader>
            {form.nagad_merchant.enabled && (
              <CardContent>
                <p className="text-sm text-muted-foreground">API credentials must be added as server-side secrets (NAGAD_MERCHANT_ID, NAGAD_PUBLIC_KEY, NAGAD_PRIVATE_KEY) via the API Keys page.</p>
              </CardContent>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPaymentGateways;
