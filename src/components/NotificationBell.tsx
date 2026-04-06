import React, { useState, useEffect, useRef } from "react";
import { Bell, X, CheckCheck, Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

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
};

const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [comicNotif, setComicNotif] = useState<Notification | null>(null);
  const [lastSeenId, setLastSeenId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: notifications = [] } = useQuery({
    queryKey: ["bell-notifications", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .or(`user_id.eq.${user!.id},user_id.is.null`)
        .not("type", "in", '("support","call")')
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Show comic bubble for new notifications
  useEffect(() => {
    if (notifications.length > 0 && !open) {
      const latest = notifications[0];
      if (latest && !latest.is_read && latest.id !== lastSeenId) {
        setComicNotif(latest);
        setLastSeenId(latest.id);
        const timer = setTimeout(() => setComicNotif(null), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [notifications, open, lastSeenId]);

  // Close panel on outside click
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

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => { setOpen(!open); setComicNotif(null); }}
        className="p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1 right-1 w-4 h-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center font-bold"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Comic dialogue bubble */}
      <AnimatePresence>
        {comicNotif && !open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="absolute top-full right-0 mt-2 z-[100] pointer-events-auto"
          >
            <div className="relative">
              {/* Triangle pointer */}
              <div className="absolute -top-2 right-4 w-4 h-4 rotate-45 bg-card border-l border-t border-border" />
              <div
                className="relative glass-strong rounded-2xl p-3 pr-8 max-w-[280px] border-2 border-primary/30 shadow-lg cursor-pointer"
                onClick={() => { setComicNotif(null); setOpen(true); }}
                style={{ boxShadow: "4px 4px 0px hsl(var(--primary) / 0.2)" }}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); setComicNotif(null); }}
                  className="absolute top-1.5 right-1.5 p-0.5 rounded-full hover:bg-secondary/50 text-muted-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="flex items-start gap-2">
                  {React.createElement(getConfig(comicNotif.type).icon, { className: `w-4 h-4 mt-0.5 shrink-0 ${getConfig(comicNotif.type).color}` })}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{comicNotif.title}</p>
                    {comicNotif.message && (
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{comicNotif.message}</p>
                    )}
                  </div>
                </div>
              </div>
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
              {/* Header */}
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

              {/* List */}
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
                      <Link key={notif.id} to={notif.link_url} onClick={() => setOpen(false)}>
                        {content}
                      </Link>
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
