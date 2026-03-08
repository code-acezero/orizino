import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import ImageUpload from "@/components/ImageUpload";
import { toast } from "@/lib/app-toast";
import { Plus, Pencil, Trash2, Send, Bell } from "lucide-react";

const AdminAnnouncements = () => {
  const qc = useQueryClient();
  const [notifDialog, setNotifDialog] = useState(false);
  const [popupDialog, setPopupDialog] = useState(false);
  const [notifForm, setNotifForm] = useState({ title: "", message: "", link_url: "", type: "announcement" });
  const [editingPopup, setEditingPopup] = useState<any>(null);

  // Notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ["admin-notifications-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("notifications").select("*").is("user_id", null).order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
  });

  const sendNotification = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("notifications").insert({
        title: notifForm.title,
        message: notifForm.message,
        link_url: notifForm.link_url || null,
        type: notifForm.type,
        user_id: null, // broadcast to all
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-notifications-list"] });
      setNotifDialog(false);
      setNotifForm({ title: "", message: "", link_url: "", type: "announcement" });
      toast.success("Notification sent to all users");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteNotification = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-notifications-list"] });
      toast.success("Deleted");
    },
  });

  // Popups
  const { data: popups = [] } = useQuery({
    queryKey: ["admin-popups"],
    queryFn: async () => {
      const { data, error } = await supabase.from("popups").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const savePopup = useMutation({
    mutationFn: async (popup: any) => {
      const { id, created_at, ...rest } = popup;
      if (id) {
        const { error } = await supabase.from("popups").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("popups").insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-popups"] });
      setPopupDialog(false);
      toast.success("Popup saved");
    },
    onError: (e) => toast.error(e.message),
  });

  const deletePopup = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("popups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-popups"] });
      toast.success("Deleted");
    },
  });

  const openPopupEdit = (popup?: any) => {
    setEditingPopup(popup ? { ...popup } : {
      title: "",
      message: "",
      image_url: "",
      link_url: "",
      link_text: "Learn More",
      is_active: true,
      max_views: 1,
      duration_hours: 24,
      starts_at: new Date().toISOString().slice(0, 16),
      ends_at: "",
    });
    setPopupDialog(true);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold">Announcements & Popups</h1>

      <Tabs defaultValue="announcements">
        <TabsList>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="popups">Offer Popups</TabsTrigger>
        </TabsList>

        <TabsContent value="announcements">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setNotifDialog(true)}><Send className="w-4 h-4 mr-2" />Send Announcement</Button>
            </div>

            <Card className="glass">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifications.map((n) => (
                      <TableRow key={n.id}>
                        <TableCell className="font-medium">{n.title}</TableCell>
                        <TableCell className="text-muted-foreground max-w-[200px] truncate">{n.message}</TableCell>
                        <TableCell><Badge>{n.type}</Badge></TableCell>
                        <TableCell className="text-muted-foreground text-xs">{new Date(n.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button size="icon" variant="ghost" onClick={() => deleteNotification.mutate(n.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {notifications.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No announcements sent yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="popups">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => openPopupEdit()}><Plus className="w-4 h-4 mr-2" />Add Popup</Button>
            </div>

            <Card className="glass">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Max Views</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {popups.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.title}</TableCell>
                        <TableCell>{p.max_views}x</TableCell>
                        <TableCell>{p.duration_hours}h</TableCell>
                        <TableCell>{p.is_active ? "✓" : "✗"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => openPopupEdit(p)}><Pencil className="w-4 h-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => deletePopup.mutate(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {popups.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No popups yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Send notification dialog */}
      <Dialog open={notifDialog} onOpenChange={setNotifDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle><Bell className="w-5 h-5 inline mr-2" />Send Announcement</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title</Label><Input value={notifForm.title} onChange={(e) => setNotifForm({ ...notifForm, title: e.target.value })} /></div>
            <div><Label>Message</Label><Textarea value={notifForm.message} onChange={(e) => setNotifForm({ ...notifForm, message: e.target.value })} /></div>
            <div><Label>Link URL (optional)</Label><Input value={notifForm.link_url} onChange={(e) => setNotifForm({ ...notifForm, link_url: e.target.value })} placeholder="https://..." /></div>
            <div>
              <Label>Type</Label>
              <div className="flex gap-2 mt-1">
                {["announcement", "offer", "update"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setNotifForm({ ...notifForm, type: t })}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-all ${
                      notifForm.type === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={() => sendNotification.mutate()} disabled={sendNotification.isPending || !notifForm.title}>
              {sendNotification.isPending ? "Sending..." : "Send to All Users"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Popup edit dialog */}
      <Dialog open={popupDialog} onOpenChange={setPopupDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingPopup?.id ? "Edit Popup" : "Add Popup"}</DialogTitle></DialogHeader>
          {editingPopup && (
            <div className="space-y-4">
              <div><Label>Title</Label><Input value={editingPopup.title} onChange={(e) => setEditingPopup({ ...editingPopup, title: e.target.value })} /></div>
              <div><Label>Message</Label><Textarea value={editingPopup.message || ""} onChange={(e) => setEditingPopup({ ...editingPopup, message: e.target.value })} /></div>
              <div>
                <Label>Image</Label>
                <ImageUpload bucket="banners" folder="popups" value={editingPopup.image_url} onUploaded={(url) => setEditingPopup({ ...editingPopup, image_url: url })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Link URL</Label><Input value={editingPopup.link_url || ""} onChange={(e) => setEditingPopup({ ...editingPopup, link_url: e.target.value })} /></div>
                <div><Label>Button Text</Label><Input value={editingPopup.link_text || ""} onChange={(e) => setEditingPopup({ ...editingPopup, link_text: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Max Views per User</Label><Input type="number" value={editingPopup.max_views} onChange={(e) => setEditingPopup({ ...editingPopup, max_views: Number(e.target.value) })} /></div>
                <div><Label>Duration (hours)</Label><Input type="number" value={editingPopup.duration_hours} onChange={(e) => setEditingPopup({ ...editingPopup, duration_hours: Number(e.target.value) })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Starts At</Label><Input type="datetime-local" value={editingPopup.starts_at?.slice(0, 16) || ""} onChange={(e) => setEditingPopup({ ...editingPopup, starts_at: e.target.value })} /></div>
                <div><Label>Ends At</Label><Input type="datetime-local" value={editingPopup.ends_at?.slice(0, 16) || ""} onChange={(e) => setEditingPopup({ ...editingPopup, ends_at: e.target.value || null })} /></div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editingPopup.is_active} onCheckedChange={(v) => setEditingPopup({ ...editingPopup, is_active: v })} />
                <Label>Active</Label>
              </div>
              <Button className="w-full" onClick={() => savePopup.mutate(editingPopup)} disabled={savePopup.isPending || !editingPopup.title}>
                {savePopup.isPending ? "Saving..." : "Save Popup"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAnnouncements;
