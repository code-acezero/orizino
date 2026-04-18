import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, Truck, MapPin, TrendingUp, Package } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

type PathaoConfig = {
  environment?: "sandbox" | "live";
  sandbox_store_id?: number;
  live_store_id?: number;
  default_item_weight?: number;
  default_delivery_type?: number;
};

const STATUS_COLORS: Record<string, string> = {
  pickup_requested: "hsl(var(--chart-1, 220 70% 50%))",
  assigned_for_pickup: "hsl(var(--chart-2, 280 70% 50%))",
  picked: "hsl(var(--chart-3, 30 80% 55%))",
  at_the_sorting_hub: "hsl(var(--chart-4, 200 70% 50%))",
  in_transit: "hsl(var(--chart-5, 260 70% 60%))",
  out_for_delivery: "hsl(var(--primary))",
  delivered: "hsl(142 70% 45%)",
  returned: "hsl(var(--destructive))",
  cancelled: "hsl(var(--muted-foreground))",
};

const AdminPathao: React.FC = () => {
  const qc = useQueryClient();
  const [configForm, setConfigForm] = useState<PathaoConfig>({});

  // ---- Load config
  const { data: configRow } = useQuery({
    queryKey: ["pathao-config"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "pathao_public_config")
        .maybeSingle();
      const cfg = ((data?.value as any) || {}) as PathaoConfig;
      setConfigForm(cfg);
      return cfg;
    },
  });

  // ---- Shipments
  const { data: shipments = [], isLoading: shipLoading } = useQuery({
    queryKey: ["pathao-shipments-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pathao_shipments")
        .select("*, orders(order_number, total, created_at)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
  });

  // ---- Save config
  const saveConfig = useMutation({
    mutationFn: async (cfg: PathaoConfig) => {
      const { error } = await supabase
        .from("site_settings")
        .upsert({ key: "pathao_public_config", value: cfg as any }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Pathao settings saved" });
      qc.invalidateQueries({ queryKey: ["pathao-config"] });
    },
    onError: (e: any) =>
      toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  // ---- Sync all shipments
  const syncAll = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("pathao", {
        body: { action: "sync-all" },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (d: any) => {
      toast({ title: `Synced ${d?.synced ?? 0}/${d?.total ?? 0} shipments` });
      qc.invalidateQueries({ queryKey: ["pathao-shipments-all"] });
    },
    onError: (e: any) =>
      toast({ title: "Sync failed", description: e.message, variant: "destructive" }),
  });

  // ---- Test stores list
  const testConnection = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("pathao", {
        body: { action: "list-stores", environment: configForm.environment || "sandbox" },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (d: any) => {
      const stores = d?.data?.data || d?.data || [];
      toast({
        title: "Connection OK",
        description: `Found ${Array.isArray(stores) ? stores.length : "?"} store(s).`,
      });
      console.log("Pathao stores:", d);
    },
    onError: (e: any) =>
      toast({ title: "Connection failed", description: e.message, variant: "destructive" }),
  });

  // ---- Aggregations for charts
  const stats = useMemo(() => {
    const byStatus: Record<string, number> = {};
    const byCity: Record<string, number> = {};
    let codTotal = 0;
    let feeTotal = 0;
    let returnCount = 0;
    let deliveryCount = 0;
    const trendMap: Record<string, { date: string; total: number; returned: number }> = {};

    for (const s of shipments) {
      const slug = (s.order_status_slug || "unknown").toLowerCase();
      byStatus[slug] = (byStatus[slug] || 0) + 1;
      if (s.recipient_city_name) {
        byCity[s.recipient_city_name] = (byCity[s.recipient_city_name] || 0) + 1;
      }
      codTotal += Number(s.cod_amount || 0);
      feeTotal += Number(s.delivery_fee || 0);
      if (s.shipment_type === "return") returnCount++;
      else deliveryCount++;

      const d = new Date(s.created_at).toISOString().slice(0, 10);
      if (!trendMap[d]) trendMap[d] = { date: d, total: 0, returned: 0 };
      trendMap[d].total++;
      if (slug === "returned" || s.shipment_type === "return") trendMap[d].returned++;
    }

    const statusData = Object.entries(byStatus).map(([k, v]) => ({
      name: k.replace(/_/g, " "),
      value: v,
      slug: k,
    }));
    const cityData = Object.entries(byCity)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([k, v]) => ({ name: k, value: v }));
    const trend = Object.values(trendMap)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);

    return {
      statusData,
      cityData,
      codTotal,
      feeTotal,
      returnRate: deliveryCount ? (returnCount / (deliveryCount + returnCount)) * 100 : 0,
      total: shipments.length,
      trend,
    };
  }, [shipments]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pathao Courier</h1>
          <p className="text-sm text-muted-foreground">
            Manage Pathao integration, shipments, and delivery analytics.
          </p>
        </div>
        <Button onClick={() => syncAll.mutate()} disabled={syncAll.isPending}>
          {syncAll.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Sync All
        </Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="shipments">Shipments</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<Package className="w-5 h-5" />} label="Total Shipments" value={stats.total} />
            <StatCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="COD Collection"
              value={`৳${stats.codTotal.toLocaleString()}`}
            />
            <StatCard
              icon={<Truck className="w-5 h-5" />}
              label="Delivery Fees"
              value={`৳${stats.feeTotal.toLocaleString()}`}
            />
            <StatCard
              icon={<MapPin className="w-5 h-5" />}
              label="Return Rate"
              value={`${stats.returnRate.toFixed(1)}%`}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent style={{ height: 280 }}>
                {stats.statusData.length === 0 ? (
                  <EmptyChart />
                ) : (
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={stats.statusData}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={90}
                        innerRadius={50}
                        label
                      >
                        {stats.statusData.map((d, i) => (
                          <Cell
                            key={i}
                            fill={STATUS_COLORS[d.slug] || "hsl(var(--muted-foreground))"}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Cities</CardTitle>
              </CardHeader>
              <CardContent style={{ height: 280 }}>
                {stats.cityData.length === 0 ? (
                  <EmptyChart />
                ) : (
                  <ResponsiveContainer>
                    <BarChart data={stats.cityData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Shipment Trend (last 30 days)</CardTitle>
            </CardHeader>
            <CardContent style={{ height: 260 }}>
              {stats.trend.length === 0 ? (
                <EmptyChart />
              ) : (
                <ResponsiveContainer>
                  <LineChart data={stats.trend}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="returned" stroke="hsl(var(--destructive))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SHIPMENTS */}
        <TabsContent value="shipments">
          <Card>
            <CardHeader>
              <CardTitle>Shipments ({shipments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {shipLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : shipments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No shipments yet. Push an order from the Orders page.
                </p>
              ) : (
                <div className="space-y-2">
                  {shipments.map((s: any) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{s.consignment_id}</span>
                          <Badge variant="outline">{s.environment}</Badge>
                          <Badge>{s.shipment_type}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Order {s.orders?.order_number} · {s.recipient_city_name || "—"}{" "}
                          {s.recipient_zone_name ? `· ${s.recipient_zone_name}` : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          style={{
                            backgroundColor:
                              STATUS_COLORS[(s.order_status_slug || "").toLowerCase()] ||
                              "hsl(var(--muted))",
                            color: "white",
                          }}
                        >
                          {(s.order_status || "—").toString().replace(/_/g, " ")}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          ৳{Number(s.cod_amount || 0).toLocaleString()} COD
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SETTINGS */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Pathao Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-w-xl">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <Label>Live Environment</Label>
                  <p className="text-xs text-muted-foreground">
                    Toggle off to use sandbox for testing.
                  </p>
                </div>
                <Switch
                  checked={configForm.environment === "live"}
                  onCheckedChange={(v) =>
                    setConfigForm((f) => ({ ...f, environment: v ? "live" : "sandbox" }))
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Sandbox Store ID</Label>
                  <Input
                    type="number"
                    value={configForm.sandbox_store_id || ""}
                    onChange={(e) =>
                      setConfigForm((f) => ({
                        ...f,
                        sandbox_store_id: Number(e.target.value) || undefined,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Live Store ID</Label>
                  <Input
                    type="number"
                    value={configForm.live_store_id || ""}
                    onChange={(e) =>
                      setConfigForm((f) => ({
                        ...f,
                        live_store_id: Number(e.target.value) || undefined,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Default Item Weight (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={configForm.default_item_weight || 0.5}
                    onChange={(e) =>
                      setConfigForm((f) => ({
                        ...f,
                        default_item_weight: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Delivery Type</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={configForm.default_delivery_type || 48}
                    onChange={(e) =>
                      setConfigForm((f) => ({
                        ...f,
                        default_delivery_type: Number(e.target.value),
                      }))
                    }
                  >
                    <option value={48}>Normal (48h)</option>
                    <option value={12}>On Demand (12h)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => saveConfig.mutate(configForm)}
                  disabled={saveConfig.isPending}
                >
                  Save Settings
                </Button>
                <Button
                  variant="outline"
                  onClick={() => testConnection.mutate()}
                  disabled={testConnection.isPending}
                >
                  {testConnection.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Test Connection
                </Button>
              </div>

              <p className="text-xs text-muted-foreground pt-2 border-t">
                Credentials are configured via Lovable Secrets. After running "Test Connection",
                check the browser console to see your store list and copy the correct Store IDs
                here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({
  icon,
  label,
  value,
}) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
        {icon} {label}
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </CardContent>
  </Card>
);

const EmptyChart: React.FC = () => (
  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
    No data yet.
  </div>
);

export default AdminPathao;
