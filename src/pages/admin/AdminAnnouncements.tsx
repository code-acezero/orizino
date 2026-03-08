import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import ImageUpload from "@/components/ImageUpload";
import { toast } from "@/lib/app-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Pencil, Trash2, Send, Bell, X, Megaphone, Tag,
  AlertTriangle, Info, Zap, Clock, MousePointerClick, ScrollText,
  ArrowDown, Maximize, PanelBottom, SlidersHorizontal, Eye,
} from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format } from "date-fns";

/* ── Constants ── */
const priorityConfig: Record<string, { label: string; color: string; icon: any }> = {
  normal:  { label: "Normal",  color: "bg-secondary text-secondary-foreground",        icon: Info },
  high:    { label: "High",    color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: AlertTriangle },
  urgent:  { label: "Urgent",  color: "bg-destructive/10 text-destructive border-destructive/20", icon: Zap },
};

const notifTypes = [
  { value: "announcement", label: "Announcement", icon: Megaphone },
  { value: "offer", label: "Offer", icon: Tag },
  { value: "update", label: "Update", icon: Info },
];

const notifIcons = [
  { value: "", label: "Default" },
  { value: "megaphone", label: "📢 Megaphone" },
  { value: "gift", label: "🎁 Gift" },
  { value: "star", label: "⭐ Star" },
  { value: "fire", label: "🔥 Fire" },
  { value: "party", label: "🎉 Party" },
  { value: "warning", label: "⚠️ Warning" },
  { value: "heart", label: "❤️ Heart" },
];

const popupPositions = [
  { value: "center", label: "Center", desc: "Centered modal" },
  { value: "bottom-center", label: "Bottom Center", desc: "Bottom slide-up bar" },
  { value: "bottom-right", label: "Bottom Right", desc: "Corner notification" },
  { value: "top-center", label: "Top Center", desc: "Top banner" },
  { value: "fullscreen", label: "Fullscreen", desc: "Full overlay" },
];

const popupAnimations = [
  { value: "scale", label: "Scale" },
  { value: "slide-up", label: "Slide Up" },
  { value: "slide-down", label: "Slide Down" },
  { value: "fade", label: "Fade" },
  { value: "bounce", label: "Bounce" },
  { value: "flip", label: "Flip" },
];

const popupTriggers = [
  { value: "timer", label: "Timer Delay", icon: Clock, desc: "Show after X seconds" },
  { value: "scroll", label: "Scroll %", icon: ScrollText, desc: "Show when user scrolls X%" },
  { value: "exit", label: "Exit Intent", icon: MousePointerClick, desc: "Show when user moves to leave" },
  { value: "immediate", label: "Immediate", icon: Zap, desc: "Show instantly" },
];

const displayTypes = [
  { value: "popup", label: "Popup Modal", icon: Maximize },
  { value: "banner", label: "Banner Bar", icon: PanelBottom },
  { value: "slide-in", label: "Slide-in Card", icon: ArrowDown },
  { value: "fullscreen", label: "Fullscreen", icon: Maximize },
];

/* ── Mini Preview with live animation ── */
const getMiniAnimation = (style: string) => {
  switch (style) {
    case "slide-up": return { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 } };
    case "slide-down": return { initial: { opacity: 0, y: -30 }, animate: { opacity: 1, y: 0 } };
    case "fade": return { initial: { opacity: 0 }, animate: { opacity: 1 } };
    case "bounce": return { initial: { opacity: 0, scale: 0.3 }, animate: { opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 15 } } };
    case "flip": return { initial: { opacity: 0, rotateX: 90 }, animate: { opacity: 1, rotateX: 0 } };
    case "zoom": return { initial: { opacity: 0, scale: 1.4 }, animate: { opacity: 1, scale: 1 } };
    case "scale": default: return { initial: { opacity: 0, scale: 0.85 }, animate: { opacity: 1, scale: 1 } };
  }
};

const PopupPreview = ({ popup }: { popup: any }) => {
  const [animKey, setAnimKey] = useState(0);
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const prevRef = useRef({ position: popup.position, display_type: popup.display_type, animation_style: popup.animation_style });

  useEffect(() => {
    const prev = prevRef.current;
    if (prev.position !== popup.position || prev.display_type !== popup.display_type || prev.animation_style !== popup.animation_style) {
      setAnimKey((k) => k + 1);
      prevRef.current = { position: popup.position, display_type: popup.display_type, animation_style: popup.animation_style };
    }
  }, [popup.position, popup.display_type, popup.animation_style]);

  const positionClasses: Record<string, string> = {
    center: "items-center justify-center",
    "bottom-center": "items-end justify-center pb-2",
    "bottom-right": "items-end justify-end pb-2 pr-2",
    "top-center": "items-start justify-center pt-2",
    fullscreen: "items-center justify-center",
  };

  const anim = getMiniAnimation(popup.animation_style || "scale");

  const deviceWidth = device === "desktop" ? "100%" : device === "tablet" ? "65%" : "40%";

  return (
    <div className="space-y-2">
      {/* Device toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">Preview</span>
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-secondary/50">
          {(["desktop", "tablet", "mobile"] as const).map((d) => (
            <button
              key={d}
              onClick={() => { setDevice(d); setAnimKey((k) => k + 1); }}
              className={`px-2 py-0.5 rounded-md text-[9px] font-medium transition-all ${
                device === d ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {d === "desktop" ? "🖥" : d === "tablet" ? "📱" : "📲"} {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="relative w-full h-56 rounded-xl bg-secondary/30 border border-border/50 overflow-hidden flex items-start justify-center p-2">
        <div
          className="h-full rounded-lg border border-border/30 bg-background overflow-hidden flex flex-col transition-all duration-300"
          style={{ width: deviceWidth, maxWidth: "100%" }}
        >
          {/* Simulated browser chrome */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-secondary/40 border-b border-border/30 shrink-0">
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-destructive/60" />
              <span className="w-2 h-2 rounded-full bg-amber-400/60" />
              <span className="w-2 h-2 rounded-full bg-primary/60" />
            </div>
            <div className="flex-1 mx-2 h-3.5 rounded-md bg-secondary/60 flex items-center px-1.5">
              <span className="text-[7px] text-muted-foreground">yoursite.com</span>
            </div>
            <Badge variant="outline" className="text-[7px] h-3.5 px-1 border-primary/30 text-primary">Live</Badge>
          </div>

          {/* Preview area */}
          <div className={`flex-1 flex ${positionClasses[popup.position || "center"] || positionClasses.center} p-2 relative`}>
            {popup.display_type !== "banner" && popup.display_type !== "slide-in" && (
              <motion.div
                key={`backdrop-${animKey}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-background/30"
              />
            )}

            <motion.div
              key={animKey}
              {...anim}
              transition={anim.animate?.transition || { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              className={`rounded-lg shadow-xl overflow-hidden relative z-10 ${
                popup.position === "fullscreen" ? "w-full h-full" :
                popup.display_type === "banner" ? "w-full max-h-14" :
                popup.display_type === "slide-in" ? (device === "mobile" ? "w-4/5 max-h-28" : "w-2/5 max-h-28") :
                (device === "mobile" ? "w-[90%] max-h-32" : "w-3/5 max-h-32")
              }`}
              style={{
                backgroundColor: popup.bg_color || "hsl(220, 20%, 10%)",
                color: popup.text_color || "hsl(210, 40%, 95%)",
              }}
            >
              <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-background/30 flex items-center justify-center">
                <X className="w-1.5 h-1.5" />
              </div>
              {popup.image_url && (
                <div className="h-10 bg-secondary/50">
                  <img src={popup.image_url} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-1.5">
                <p className="text-[9px] font-bold truncate">{popup.title || "Popup Title"}</p>
                {popup.message && <p className="text-[6px] opacity-70 line-clamp-2 leading-tight mt-0.5">{popup.message}</p>}
                {popup.link_url && (
                  <div className="mt-1 inline-block text-[6px] px-1.5 py-0.5 rounded-md bg-primary/20 text-primary font-medium">
                    {popup.link_text || "Learn More"}
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Info badges */}
          <div className="px-2 py-1 flex items-center justify-between border-t border-border/20 shrink-0">
            <div className="flex gap-1">
              <Badge variant="outline" className="text-[7px] h-4 px-1">{popup.display_type || "popup"}</Badge>
              <Badge variant="outline" className="text-[7px] h-4 px-1">{popup.position || "center"}</Badge>
            </div>
            <button
              onClick={() => setAnimKey((k) => k + 1)}
              className="text-[7px] text-primary hover:text-primary/80 transition-colors flex items-center gap-0.5"
            >
              <motion.span
                key={`replay-${animKey}`}
                animate={{ rotate: 360 }}
                transition={{ duration: 0.4 }}
                className="inline-block"
              >↻</motion.span>
              Replay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Full-screen live preview (matches HomePopup rendering) ── */
const getPreviewAnimation = (style: string) => {
  switch (style) {
    case "slide-up": return { initial: { opacity: 0, y: 80 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 80 } };
    case "slide-down": return { initial: { opacity: 0, y: -80 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -80 } };
    case "fade": return { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
    case "bounce": return { initial: { opacity: 0, scale: 0.3 }, animate: { opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 15 } }, exit: { opacity: 0, scale: 0.3 } };
    case "flip": return { initial: { opacity: 0, rotateX: 90 }, animate: { opacity: 1, rotateX: 0 }, exit: { opacity: 0, rotateX: 90 } };
    case "zoom": return { initial: { opacity: 0, scale: 1.3 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 1.3 } };
    case "scale": default: return { initial: { opacity: 0, scale: 0.9, y: 20 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.9, y: 20 } };
  }
};

const getPreviewPosition = (position: string, displayType: string): string => {
  if (displayType === "banner") {
    if (position === "top" || position === "top-center") return "items-start justify-center pt-4";
    if (position === "bottom" || position === "bottom-center") return "items-end justify-center pb-4";
    return "items-center justify-center";
  }
  if (displayType === "slide-in") {
    if (position === "bottom-right") return "items-end justify-end pb-6 pr-6";
    if (position === "bottom-left" || position === "bottom-center") return "items-end justify-start pb-6 pl-6";
    if (position === "top-center") return "items-start justify-center pt-6";
    return "items-end justify-end pb-6 pr-6";
  }
  if (position === "top" || position === "top-center") return "items-start justify-center pt-20";
  if (position === "bottom" || position === "bottom-center") return "items-end justify-center pb-20";
  if (position === "bottom-right") return "items-end justify-end pb-20 pr-8";
  if (position === "fullscreen") return "items-center justify-center";
  return "items-center justify-center";
};

const getPreviewSize = (displayType: string): string => {
  if (displayType === "banner") return "w-full max-w-2xl";
  if (displayType === "slide-in") return "max-w-sm w-full";
  if (displayType === "fullscreen") return "w-full h-full max-w-none rounded-none";
  return "max-w-md w-full";
};

const FullPopupPreview = ({ popup, onClose }: { popup: any; onClose: () => void }) => {
  const animStyle = popup.animation_style || "scale";
  const position = popup.position || "center";
  const displayType = popup.display_type || "popup";
  const anim = getPreviewAnimation(animStyle);
  const posClasses = getPreviewPosition(position, displayType);
  const sizeClasses = getPreviewSize(displayType);
  const hasBg = !!popup.bg_color;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-[200] flex p-4 ${posClasses}`}
      onClick={onClose}
    >
      {displayType !== "banner" && displayType !== "slide-in" && (
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
      )}

      {/* Admin label */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[210] flex items-center gap-2">
        <Badge className="bg-primary/90 text-primary-foreground text-xs px-3 py-1">
          <Eye className="w-3 h-3 mr-1.5" /> Preview Mode
        </Badge>
        <Button size="sm" variant="secondary" onClick={onClose} className="h-7 text-xs rounded-full">
          <X className="w-3 h-3 mr-1" /> Close
        </Button>
      </div>

      <motion.div
        {...anim}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        onClick={(e) => e.stopPropagation()}
        className={`relative overflow-hidden shadow-2xl ${sizeClasses} ${hasBg ? "rounded-3xl" : "glass-strong rounded-3xl"}`}
        style={{
          ...(popup.bg_color ? { backgroundColor: popup.bg_color } : {}),
          perspective: animStyle === "flip" ? "800px" : undefined,
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-background/50 hover:bg-background/80 transition-colors"
          style={popup.text_color ? { color: popup.text_color } : {}}
        >
          <X className="w-4 h-4" />
        </button>

        {popup.image_url && (
          <img src={popup.image_url} alt="" className="w-full h-48 object-cover" />
        )}

        <div className="p-6 space-y-3">
          <h3
            className={popup.text_color ? "text-xl font-bold font-display" : "text-xl font-bold font-display text-foreground"}
            style={popup.text_color ? { color: popup.text_color } : undefined}
          >
            {popup.title || "Popup Title"}
          </h3>
          {popup.message && (
            <p
              className={popup.text_color ? "text-sm opacity-80" : "text-sm text-muted-foreground"}
              style={popup.text_color ? { color: popup.text_color } : undefined}
            >
              {popup.message}
            </p>
          )}
          {popup.link_url && (
            <span className="inline-block btn-pill bg-gradient-primary text-primary-foreground font-semibold px-6 py-2.5 text-sm cursor-pointer">
              {popup.link_text || "Learn More"}
            </span>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const AdminAnnouncements = () => {
  const qc = useQueryClient();
  const [notifDialog, setNotifDialog] = useState(false);
  const [popupDialog, setPopupDialog] = useState(false);
  const [notifForm, setNotifForm] = useState({
    title: "", message: "", link_url: "", type: "announcement",
    priority: "normal", icon: "", scheduled_at: "", expires_at: "",
  });
  const [editingPopup, setEditingPopup] = useState<any>(null);
  const [previewPopup, setPreviewPopup] = useState<any>(null);

  /* ── Notifications queries ── */
  const { data: notifications = [] } = useQuery({
    queryKey: ["admin-notifications-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications").select("*")
        .is("user_id", null)
        .order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
  });

  const sendNotification = useMutation({
    mutationFn: async () => {
      const payload: any = {
        title: notifForm.title,
        message: notifForm.message,
        link_url: notifForm.link_url || null,
        type: notifForm.type,
        user_id: null,
        priority: notifForm.priority,
        icon: notifForm.icon || null,
        scheduled_at: notifForm.scheduled_at || null,
        expires_at: notifForm.expires_at || null,
      };
      const { error } = await supabase.from("notifications").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-notifications-list"] });
      setNotifDialog(false);
      setNotifForm({ title: "", message: "", link_url: "", type: "announcement", priority: "normal", icon: "", scheduled_at: "", expires_at: "" });
      toast.success(notifForm.scheduled_at ? "Notification scheduled" : "Notification sent to all users");
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

  /* ── Popups queries ── */
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

  const duplicatePopup = (popup: any) => {
    const { id, created_at, ...rest } = popup;
    setEditingPopup({ ...rest, title: `${rest.title} (copy)` });
    setPopupDialog(true);
  };

  const openPopupEdit = (popup?: any) => {
    setEditingPopup(popup ? { ...popup } : {
      title: "", message: "", image_url: "", link_url: "", link_text: "Learn More",
      is_active: true, max_views: 1, duration_hours: 24,
      starts_at: new Date().toISOString().slice(0, 16), ends_at: "",
      display_type: "popup", position: "center", animation_style: "scale",
      trigger_type: "timer", trigger_value: 1500,
      bg_color: "", text_color: "",
    });
    setPopupDialog(true);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold">Announcements & Popups</h1>

      <Tabs defaultValue="announcements">
        <TabsList>
          <TabsTrigger value="announcements" className="flex items-center gap-1"><Bell className="w-4 h-4" /> Announcements</TabsTrigger>
          <TabsTrigger value="popups" className="flex items-center gap-1"><Maximize className="w-4 h-4" /> Popups</TabsTrigger>
        </TabsList>

        {/* ── ANNOUNCEMENTS TAB ── */}
        <TabsContent value="announcements">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{notifications.length} announcement{notifications.length !== 1 ? "s" : ""} sent</p>
              <Button onClick={() => setNotifDialog(true)}><Send className="w-4 h-4 mr-2" />New Announcement</Button>
            </div>

            <Card className="glass">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Schedule</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifications.map((n: any) => {
                      const prio = priorityConfig[n.priority] || priorityConfig.normal;
                      const PrioIcon = prio.icon;
                      return (
                        <TableRow key={n.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {n.icon && <span className="text-sm">{notifIcons.find(i => i.value === n.icon)?.label.split(" ")[0] || ""}</span>}
                              <span className="font-medium">{n.title}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-[180px] truncate">{n.message}</TableCell>
                          <TableCell><Badge variant="outline">{n.type}</Badge></TableCell>
                          <TableCell>
                            <Badge variant="outline" className={prio.color}>
                              <PrioIcon className="w-3 h-3 mr-1" />{prio.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {n.scheduled_at ? format(new Date(n.scheduled_at), "MMM dd, HH:mm") : "Immediate"}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {format(new Date(n.created_at), "MMM dd, yyyy")}
                          </TableCell>
                           <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="icon" variant="ghost"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete announcement?</AlertDialogTitle>
                                  <AlertDialogDescription>This will permanently delete "{n.title}". This action cannot be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteNotification.mutate(n.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {notifications.length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No announcements sent yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── POPUPS TAB ── */}
        <TabsContent value="popups">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{popups.length} popup{popups.length !== 1 ? "s" : ""} · {popups.filter((p: any) => p.is_active).length} active</p>
              <Button onClick={() => openPopupEdit()}><Plus className="w-4 h-4 mr-2" />Add Popup</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {popups.map((p: any) => (
                <Card key={p.id} className={`glass transition-colors ${p.is_active ? "border-primary/20" : "opacity-60"}`}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-display font-semibold text-sm">{p.title}</h3>
                        {p.message && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{p.message}</p>}
                      </div>
                      <Badge variant={p.is_active ? "default" : "outline"} className="text-[10px] shrink-0 ml-2">
                        {p.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-[10px]">{p.display_type || "popup"}</Badge>
                      <Badge variant="outline" className="text-[10px]">{p.position || "center"}</Badge>
                      <Badge variant="outline" className="text-[10px]">{p.trigger_type || "timer"}</Badge>
                      <Badge variant="outline" className="text-[10px]">{p.max_views}x views</Badge>
                    </div>
                    {p.image_url && (
                      <img src={p.image_url} alt="" className="w-full h-24 object-cover rounded-lg" />
                    )}
                    <div className="flex gap-1 pt-1">
                      <Button size="sm" variant="ghost" className="flex-1" onClick={() => openPopupEdit(p)}>
                        <Pencil className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setPreviewPopup(p)} title="Preview">
                        <Eye className="w-3 h-3 text-primary" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => duplicatePopup(p)}>
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deletePopup.mutate(p.id)}>
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {popups.length === 0 && (
                <Card className="glass col-span-full">
                  <CardContent className="py-12 text-center text-muted-foreground">No popups yet</CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── ANNOUNCEMENT DIALOG ── */}
      <Dialog open={notifDialog} onOpenChange={setNotifDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle><Bell className="w-5 h-5 inline mr-2" />New Announcement</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title</Label><Input value={notifForm.title} onChange={(e) => setNotifForm({ ...notifForm, title: e.target.value })} placeholder="Holiday Sale is Live!" /></div>
            <div><Label>Message</Label><Textarea value={notifForm.message} onChange={(e) => setNotifForm({ ...notifForm, message: e.target.value })} placeholder="Don't miss our biggest sale of the year..." /></div>
            <div><Label>Link URL (optional)</Label><Input value={notifForm.link_url} onChange={(e) => setNotifForm({ ...notifForm, link_url: e.target.value })} placeholder="/shop?sale=true" /></div>

            {/* Type */}
            <div>
              <Label>Type</Label>
              <div className="flex gap-2 mt-1.5">
                {notifTypes.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setNotifForm({ ...notifForm, type: t.value })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      notifForm.type === t.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-secondary/30"
                    }`}
                  >
                    <t.icon className="w-3 h-3" />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div>
              <Label>Priority</Label>
              <div className="flex gap-2 mt-1.5">
                {Object.entries(priorityConfig).map(([key, cfg]) => {
                  const PIcon = cfg.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => setNotifForm({ ...notifForm, priority: key })}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        notifForm.priority === key ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-secondary/30"
                      }`}
                    >
                      <PIcon className="w-3 h-3" />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Icon */}
            <div>
              <Label>Icon</Label>
              <Select value={notifForm.icon || ""} onValueChange={(v) => setNotifForm({ ...notifForm, icon: v })}>
                <SelectTrigger><SelectValue placeholder="Default icon" /></SelectTrigger>
                <SelectContent>
                  {notifIcons.map((i) => (
                    <SelectItem key={i.value} value={i.value || "default"}>{i.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Scheduling */}
            <Card className="border-border/50">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <Label className="font-medium">Scheduling (optional)</Label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Schedule Send</Label>
                    <Input type="datetime-local" value={notifForm.scheduled_at} onChange={(e) => setNotifForm({ ...notifForm, scheduled_at: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Expires At</Label>
                    <Input type="datetime-local" value={notifForm.expires_at} onChange={(e) => setNotifForm({ ...notifForm, expires_at: e.target.value })} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button className="w-full" onClick={() => sendNotification.mutate()} disabled={sendNotification.isPending || !notifForm.title}>
              {sendNotification.isPending ? "Sending..." : notifForm.scheduled_at ? "Schedule Announcement" : "Send to All Users"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── POPUP EDITOR DIALOG ── */}
      <Dialog open={popupDialog} onOpenChange={setPopupDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingPopup?.id ? "Edit Popup" : "Create Popup"}</DialogTitle></DialogHeader>
          {editingPopup && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Form */}
              <div className="space-y-4">
                <div><Label>Title</Label><Input value={editingPopup.title} onChange={(e) => setEditingPopup({ ...editingPopup, title: e.target.value })} /></div>
                <div><Label>Message</Label><Textarea value={editingPopup.message || ""} onChange={(e) => setEditingPopup({ ...editingPopup, message: e.target.value })} /></div>
                <div>
                  <Label>Image</Label>
                  <ImageUpload bucket="banners" folder="popups" value={editingPopup.image_url} onUploaded={(url) => setEditingPopup({ ...editingPopup, image_url: url })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Link URL</Label><Input value={editingPopup.link_url || ""} onChange={(e) => setEditingPopup({ ...editingPopup, link_url: e.target.value })} /></div>
                  <div><Label>Button Text</Label><Input value={editingPopup.link_text || ""} onChange={(e) => setEditingPopup({ ...editingPopup, link_text: e.target.value })} /></div>
                </div>

                {/* Display & Position */}
                <Card className="border-border/50">
                  <CardContent className="pt-4 space-y-3">
                    <Label className="font-medium flex items-center gap-2"><SlidersHorizontal className="w-4 h-4 text-primary" /> Display Settings</Label>
                    <div>
                      <Label className="text-xs text-muted-foreground">Display Type</Label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        {displayTypes.map((dt) => (
                          <button
                            key={dt.value}
                            onClick={() => setEditingPopup({ ...editingPopup, display_type: dt.value })}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs border transition-all ${
                              editingPopup.display_type === dt.value ? "border-primary bg-primary/10 text-primary" : "border-border/50 text-muted-foreground hover:bg-secondary/30"
                            }`}
                          >
                            <dt.icon className="w-3.5 h-3.5" />
                            {dt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Position</Label>
                      <Select value={editingPopup.position || "center"} onValueChange={(v) => setEditingPopup({ ...editingPopup, position: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {popupPositions.map((p) => (
                            <SelectItem key={p.value} value={p.value}>{p.label} – {p.desc}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Animation</Label>
                      <Select value={editingPopup.animation_style || "scale"} onValueChange={(v) => setEditingPopup({ ...editingPopup, animation_style: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {popupAnimations.map((a) => (
                            <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right: More options + Preview */}
              <div className="space-y-4">
                {/* Mini Preview + Live Preview Button */}
                <PopupPreview popup={editingPopup} />
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => setPreviewPopup({ ...editingPopup })}
                >
                  <Eye className="w-4 h-4 text-primary" />
                  Preview Live
                </Button>

                {/* Trigger */}
                <Card className="border-border/50">
                  <CardContent className="pt-4 space-y-3">
                    <Label className="font-medium flex items-center gap-2"><MousePointerClick className="w-4 h-4 text-accent" /> Trigger</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {popupTriggers.map((t) => (
                        <button
                          key={t.value}
                          onClick={() => setEditingPopup({ ...editingPopup, trigger_type: t.value })}
                          className={`flex flex-col items-start gap-0.5 px-3 py-2 rounded-xl text-left border transition-all ${
                            editingPopup.trigger_type === t.value ? "border-primary bg-primary/10" : "border-border/50 hover:bg-secondary/30"
                          }`}
                        >
                          <span className="flex items-center gap-1.5 text-xs font-medium"><t.icon className="w-3 h-3" />{t.label}</span>
                          <span className="text-[10px] text-muted-foreground">{t.desc}</span>
                        </button>
                      ))}
                    </div>
                    {(editingPopup.trigger_type === "timer" || editingPopup.trigger_type === "scroll") && (
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          {editingPopup.trigger_type === "timer"
                            ? `Delay: ${((editingPopup.trigger_value || 1500) / 1000).toFixed(1)}s`
                            : `Scroll: ${editingPopup.trigger_value || 50}%`
                          }
                        </Label>
                        <Slider
                          value={[editingPopup.trigger_value || (editingPopup.trigger_type === "timer" ? 1500 : 50)]}
                          onValueChange={([v]) => setEditingPopup({ ...editingPopup, trigger_value: v })}
                          min={editingPopup.trigger_type === "timer" ? 500 : 10}
                          max={editingPopup.trigger_type === "timer" ? 10000 : 100}
                          step={editingPopup.trigger_type === "timer" ? 500 : 5}
                          className="mt-2"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Colors */}
                <Card className="border-border/50">
                  <CardContent className="pt-4 space-y-3">
                    <Label className="font-medium">Colors</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Background</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            value={editingPopup.bg_color || ""}
                            onChange={(e) => setEditingPopup({ ...editingPopup, bg_color: e.target.value })}
                            placeholder="Default"
                          />
                          {editingPopup.bg_color && <div className="w-7 h-7 rounded-lg border border-border shrink-0" style={{ backgroundColor: editingPopup.bg_color }} />}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Text Color</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            value={editingPopup.text_color || ""}
                            onChange={(e) => setEditingPopup({ ...editingPopup, text_color: e.target.value })}
                            placeholder="Default"
                          />
                          {editingPopup.text_color && <div className="w-7 h-7 rounded-lg border border-border shrink-0" style={{ backgroundColor: editingPopup.text_color }} />}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Frequency & Schedule */}
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Max Views</Label><Input type="number" value={editingPopup.max_views} onChange={(e) => setEditingPopup({ ...editingPopup, max_views: Number(e.target.value) })} /></div>
                  <div><Label>Cooldown (hours)</Label><Input type="number" value={editingPopup.duration_hours} onChange={(e) => setEditingPopup({ ...editingPopup, duration_hours: Number(e.target.value) })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
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
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── FULL PREVIEW OVERLAY ── */}
      <AnimatePresence>
        {previewPopup && (
          <FullPopupPreview popup={previewPopup} onClose={() => setPreviewPopup(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminAnnouncements;
