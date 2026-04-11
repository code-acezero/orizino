import React, { useState, useEffect, useRef } from "react";
import { Bell, X, CheckCheck, Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { subscribe as subscribeToasts, type AppToast, removeToast as removeAppToast } from "@/lib/app-toast";
import { playNotificationSound } from "@/lib/sounds";
import { useIsMobile } from "@/hooks/use-mobile";

interface Notification {
  id: string;
  title: string;
  message: string | null;
  type: string;
  is_read: boolean;
  created_at: string;
  link_url: string | null;
}

const typeConfig: Record<string, { icon: React.ElementType; color: string }> = {
  success: { icon: CheckCircle, color: "text-green-400" },
  error: { icon: XCircle, color: "text-destructive" },
  warning: { icon: AlertTriangle, color: "text-yellow-400" },
  general: { icon: Info, color: "text-primary" },
  info: { icon: Info, color: "text-blue-400" },
};

interface IslandItem {
  id: string;
  title: string;
  message?: string;
  type: string;
  source: "notification" | "toast";
}

interface NotificationBellProps {
  adminMode?: boolean;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ adminMode = false }) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [islandItem, setIslandItem] = useState<IslandItem | null>(null);
  const [lastSeenId, setLastSeenId] = useState<string | null>(null);
  const [bellRing, setBellRing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const islandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: notifications = [] } = useQuery({
    queryKey: ["bell-notifications", user?.id, adminMode ? "admin" : "user"],
    queryFn: async () => {
      let query = supabase.from("notifications").select("*");
      if (adminMode) {
        query = query.or(`user_id.is.null,user_id.eq.${user!.id}`);
      } else {
        query = query
          .or(`user_id.eq.${user!.id},user_id.is.null`)
          .not("type", "in", '("support","call","admin","order_status","low_stock")');
      }
      const { data, error } = await query.order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const showIsland = (item: IslandItem) => {
    if (islandTimerRef.current) clearTimeout(islandTimerRef.current);
    setIslandItem(item);
    setBellRing(true);
    setTimeout(() => setBellRing(false), 600);
    islandTimerRef.current = setTimeout(() => setIslandItem(null), 4000);
  };

  useEffect(() => {
    if (notifications.length > 0 && !open) {
      const latest = notifications[0];
      if (latest && !latest.is_read && latest.id !== lastSeenId) {
        setLastSeenId(latest.id);
        playNotificationSound();
        showIsland({
          id: latest.id,
          title: latest.title,
          message: latest.message || undefined,
          type: latest.type,
          source: "notification",
        });
      }
    }
  }, [notifications, open, lastSeenId]);

  useEffect(() => {
    const unsub = subscribeToasts((toasts: AppToast[]) => {
      if (toasts.length > 0) {
        const t = toasts[0];
        showIsland({
          id: `toast-${t.id}`,
          title: t.title,
          message: t.description,
          type: t.type,
          source: "toast",
        });
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bell-notifications"] });
      qc.invalidateQueries({ queryKey: ["unread-notifications"] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter((n) => !n.is_read);
      for (const n of unread) {
        await supabase.from("notifications").update({ is_read: true }).eq("id", n.id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bell-notifications"] });
      qc.invalidateQueries({ queryKey: ["unread-notifications"] });
    },
  });

  const getConfig = (type: string) => typeConfig[type] || typeConfig.general;
  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (!user) return null;

  const isExpanded = !!islandItem && !open;

  // Desktop: inline expanding island from bell; Mobile: dropdown below navbar
  const desktopIsland = !isMobile && isExpanded && islandItem;
  const mobileIsland = isMobile && isExpanded && islandItem;

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell + Desktop inline island */}
      <motion.button
        className="flex items-center justify-center shrink-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all relative overflow-hidden"
        onClick={() => { if (desktopIsland) { setIslandItem(null); setOpen(true); } else setOpen(!open); }}
        animate={{
          width: desktopIsland ? 280 : 40,
          height: 40,
          borderRadius: 20,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        style={{ cursor: "pointer" }}
      >
        {/* Bell icon */}
        <motion.div
          className="absolute left-2.5 top-1/2"
          animate={{
            y: "-50%",
            rotate: bellRing ? [0, 15, -15, 10, -10, 5, 0] : 0,
          }}
          transition={bellRing ? { duration: 0.6 } : { duration: 0.2 }}
        >
          <Bell className="w-5 h-5" />
        </motion.div>

        {/* Desktop inline island content */}
        <AnimatePresence>
          {desktopIsland && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 pl-9 pr-8 w-full"
            >
              {React.createElement(getConfig(islandItem!.type).icon, {
                className: `w-3.5 h-3.5 shrink-0 ${getConfig(islandItem!.type).color}`,
              })}
              <div className="min-w-0 flex-1 text-left">
                <p className="text-xs font-medium text-foreground truncate leading-tight">
                  {islandItem!.title}
                </p>
                {islandItem!.message && (
                  <p className="text-[10px] text-muted-foreground truncate leading-tight">
                    {islandItem!.message}
                  </p>
                )}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setIslandItem(null); }}
                className="shrink-0 p-0.5 rounded-full hover:bg-secondary/50 absolute right-2 top-1/2 -translate-y-1/2"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Unread badge */}
        {unreadCount > 0 && !desktopIsland && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1 right-1 w-4 h-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center font-bold"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Mobile dropdown island */}
      <AnimatePresence>
        {mobileIsland && (
          <motion.div
            initial={{ opacity: 0, y: -8, scaleY: 0.8 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -8, scaleY: 0.8 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute top-full right-0 mt-1 w-[calc(100vw-2rem)] max-w-xs z-[100]"
            style={{ transformOrigin: "top right" }}
            onClick={() => { setIslandItem(null); setOpen(true); }}
          >
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-secondary/90 backdrop-blur-xl border border-border/50 shadow-lg cursor-pointer">
              {React.createElement(getConfig(islandItem!.type).icon, {
                className: `w-4 h-4 shrink-0 ${getConfig(islandItem!.type).color}`,
              })}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground truncate leading-tight">
                  {islandItem!.title}
                </p>
                {islandItem!.message && (
                  <p className="text-[10px] text-muted-foreground truncate leading-tight">
                    {islandItem!.message}
                  </p>
                )}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setIslandItem(null); }}
                className="shrink-0 p-0.5 rounded-full hover:bg-secondary/50"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 w-80 max-h-[420px] z-[100]"
          >
            <div className="glass-strong rounded-2xl border border-border/50 shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllRead.mutate()}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <CheckCheck className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>
              <div className="overflow-y-auto max-h-[350px] divide-y divide-border/30">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground text-sm">No notifications yet</div>
                ) : (
                  notifications.map((notif) => {
                    const cfg = getConfig(notif.type);
                    const IconComp = cfg.icon;
                    const content = (
                      <div
                        className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-secondary/30 cursor-pointer ${!notif.is_read ? "bg-primary/5" : ""}`}
                        onClick={() => { if (!notif.is_read) markRead.mutate(notif.id); }}
                      >
                        <div className={`mt-0.5 shrink-0 ${cfg.color}`}>
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className={`text-xs font-medium truncate ${!notif.is_read ? "text-foreground" : "text-muted-foreground"}`}>{notif.title}</p>
                            {!notif.is_read && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                          </div>
                          {notif.message && <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{notif.message}</p>}
                          <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(notif.created_at)}</p>
                        </div>
                      </div>
                    );
                    return notif.link_url ? (
                      <Link key={notif.id} to={notif.link_url} onClick={() => setOpen(false)}>{content}</Link>
                    ) : (
                      <div key={notif.id}>{content}</div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
