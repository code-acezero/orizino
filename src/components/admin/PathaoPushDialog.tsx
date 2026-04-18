import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Truck, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orderId: string;
  orderNumber: string;
}

const PathaoPushDialog: React.FC<Props> = ({ open, onOpenChange, orderId, orderNumber }) => {
  const qc = useQueryClient();
  const [cityId, setCityId] = useState<number | null>(null);
  const [zoneId, setZoneId] = useState<number | null>(null);
  const [areaId, setAreaId] = useState<number | null>(null);
  const [cityName, setCityName] = useState("");
  const [zoneName, setZoneName] = useState("");

  const { data: existing } = useQuery({
    queryKey: ["pathao-shipment", orderId],
    queryFn: async () => {
      const { data } = await supabase
        .from("pathao_shipments")
        .select("*")
        .eq("order_id", orderId)
        .maybeSingle();
      return data;
    },
    enabled: open,
  });

  const callFn = async (action: string, body: any = {}) => {
    const { data, error } = await supabase.functions.invoke("pathao", {
      body: { action, ...body },
    });
    if (error) throw error;
    return data;
  };

  const cities = useQuery({
    queryKey: ["pathao-cities"],
    queryFn: async () => {
      const r = await callFn("cities");
      return r?.data?.data || r?.data || [];
    },
    enabled: open,
  });

  const zones = useQuery({
    queryKey: ["pathao-zones", cityId],
    queryFn: async () => {
      if (!cityId) return [];
      const r = await callFn("zones", { city_id: cityId });
      return r?.data?.data || r?.data || [];
    },
    enabled: !!cityId,
  });

  const areas = useQuery({
    queryKey: ["pathao-areas", zoneId],
    queryFn: async () => {
      if (!zoneId) return [];
      const r = await callFn("areas", { zone_id: zoneId });
      return r?.data?.data || r?.data || [];
    },
    enabled: !!zoneId,
  });

  const pushOrder = useMutation({
    mutationFn: async () => {
      if (!cityId || !zoneId) throw new Error("City and Zone required");
      return callFn("create-order", {
        order_id: orderId,
        recipient_city: cityId,
        recipient_zone: zoneId,
        recipient_area: areaId || undefined,
        recipient_city_name: cityName,
        recipient_zone_name: zoneName,
      });
    },
    onSuccess: () => {
      toast({ title: "Order pushed to Pathao" });
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["pathao-shipments-all"] });
      qc.invalidateQueries({ queryKey: ["pathao-shipment", orderId] });
      onOpenChange(false);
    },
    onError: (e: any) =>
      toast({ title: "Push failed", description: e.message, variant: "destructive" }),
  });

  const syncStatus = useMutation({
    mutationFn: async () => {
      if (!existing) return;
      return callFn("sync-status", {
        consignment_id: existing.consignment_id,
        environment: existing.environment,
      });
    },
    onSuccess: () => {
      toast({ title: "Status synced" });
      qc.invalidateQueries({ queryKey: ["pathao-shipment", orderId] });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" /> Pathao — {orderNumber}
          </DialogTitle>
        </DialogHeader>

        {existing ? (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-muted/30 space-y-1">
              <p className="text-xs text-muted-foreground">Consignment</p>
              <p className="font-mono text-sm">{existing.consignment_id}</p>
              <Badge>{existing.order_status?.toString().replace(/_/g, " ") || "—"}</Badge>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => syncStatus.mutate()}
              disabled={syncStatus.isPending}
            >
              {syncStatus.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Sync Status
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label>City</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={cityId || ""}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setCityId(id || null);
                  setZoneId(null);
                  setAreaId(null);
                  const c = (cities.data || []).find((x: any) => x.city_id === id);
                  setCityName(c?.city_name || "");
                }}
              >
                <option value="">{cities.isLoading ? "Loading..." : "Select city"}</option>
                {(cities.data || []).map((c: any) => (
                  <option key={c.city_id} value={c.city_id}>
                    {c.city_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Zone</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={zoneId || ""}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setZoneId(id || null);
                  setAreaId(null);
                  const z = (zones.data || []).find((x: any) => x.zone_id === id);
                  setZoneName(z?.zone_name || "");
                }}
                disabled={!cityId}
              >
                <option value="">{zones.isLoading ? "Loading..." : "Select zone"}</option>
                {(zones.data || []).map((z: any) => (
                  <option key={z.zone_id} value={z.zone_id}>
                    {z.zone_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Area (optional)</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={areaId || ""}
                onChange={(e) => setAreaId(Number(e.target.value) || null)}
                disabled={!zoneId}
              >
                <option value="">Select area</option>
                {(areas.data || []).map((a: any) => (
                  <option key={a.area_id} value={a.area_id}>
                    {a.area_name}
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter>
              <Button onClick={() => pushOrder.mutate()} disabled={pushOrder.isPending || !cityId || !zoneId}>
                {pushOrder.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Push to Pathao
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PathaoPushDialog;
