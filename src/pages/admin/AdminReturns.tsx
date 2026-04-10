import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/lib/app-toast";
import { RotateCcw, Package, Clock } from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500",
  approved: "bg-blue-500/10 text-blue-500",
  rejected: "bg-destructive/10 text-destructive",
  completed: "bg-green-500/10 text-green-500",
};

const AdminReturns = () => {
  const qc = useQueryClient();
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");

  const { data: returns = [], isLoading } = useQuery({
    queryKey: ["admin-returns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("return_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      const { error } = await supabase
        .from("return_requests")
        .update({ status, admin_notes: notes, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-returns"] });
      setSelectedReturn(null);
      toast.success("Return request updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <RotateCcw className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-display font-bold">Return Requests</h1>
        <Badge variant="secondary">{returns.length}</Badge>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : returns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No return requests yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {returns.map((r: any) => (
            <Card key={r.id} className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => { setSelectedReturn(r); setAdminNotes(r.admin_notes || ""); setNewStatus(r.status); }}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Order: {r.order_id?.slice(0, 8)}...</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{r.reason}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {format(new Date(r.created_at), "MMM dd, yyyy")}</p>
                </div>
                <Badge className={statusColors[r.status] || ""}>{r.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedReturn && (
        <Card>
          <CardHeader>
            <CardTitle>Manage Return</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Reason:</p>
              <p className="text-sm text-foreground">{selectedReturn.reason}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Status</p>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Admin Notes</p>
              <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={3} />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => updateMutation.mutate({ id: selectedReturn.id, status: newStatus, notes: adminNotes })} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Update"}
              </Button>
              <Button variant="outline" onClick={() => setSelectedReturn(null)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminReturns;
