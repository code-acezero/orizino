import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Bot, User, Headphones, Phone, PhoneOff, Mic, MicOff, AlertTriangle, MessageSquare, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import wolfMascot from "@/assets/wolf-mascot.png";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { toast } from "@/lib/app-toast";
import { getIceServers } from "@/lib/ice-servers";
import { playRingtone, stopRingtone } from "@/lib/sounds";

interface Msg {
  role: "user" | "assistant" | "system";
  content: string;
}

/* ── Floating bubble particles ── */
const BubbleParticle = ({ delay, size, x, y, duration }: { delay: number; size: number; x: number; y: number; duration: number }) => (
  <motion.div
    className="absolute rounded-full bg-primary/25 pointer-events-none"
    style={{ width: size, height: size, left: x, top: y }}
    animate={{
      y: [0, -20, -40, -20, 0],
      x: [0, 8, -6, 4, 0],
      opacity: [0, 0.6, 0.8, 0.4, 0],
      scale: [0.6, 1, 1.1, 0.9, 0.6],
    }}
    transition={{ repeat: Infinity, duration, delay, ease: "easeInOut" }}
  />
);

/** Hook: hide while scrolling, show at top/bottom or when idle */
function useScrollVisibility() {
  const [visible, setVisible] = useState(true);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let lastY = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const atTop = y <= 10;
      const atBottom = y >= maxScroll - 10;

      if (atTop || atBottom) {
        setVisible(true);
      } else if (Math.abs(y - lastY) > 3) {
        setVisible(false);
      }

      lastY = y;

      if (scrollTimer.current) clearTimeout(scrollTimer.current);
      scrollTimer.current = setTimeout(() => setVisible(true), 800);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
    };
  }, []);

  return visible;
}

/* ── Inline Incoming Call UI (inside widget) ── */
const IncomingCallWidget: React.FC<{
  visible: boolean;
  onAccept: () => void;
  onReject: () => void;
}> = ({ visible, onAccept, onReject }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="border-b border-border/50 overflow-hidden"
      >
        <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
              <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                <Phone className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Incoming Voice Call</p>
              <p className="text-[11px] text-muted-foreground">Support agent calling...</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={onReject}
              className="w-11 h-11 rounded-full bg-destructive/90 hover:bg-destructive flex items-center justify-center transition-all shadow-lg"
            >
              <PhoneOff className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={onAccept}
              className="w-11 h-11 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-all shadow-lg animate-pulse"
            >
              <Phone className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

/* ── Active Call Bar (inside widget) ── */
const ActiveCallWidget: React.FC<{
  duration: number;
  muted: boolean;
  onToggleMute: () => void;
  onHangup: () => void;
}> = ({ duration, muted, onToggleMute, onHangup }) => {
  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="border-b border-green-500/20 overflow-hidden"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-green-500/10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-green-600">Call Active</span>
          <span className="text-[11px] text-muted-foreground font-mono">{fmt(duration)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={onToggleMute} className="w-7 h-7 rounded-full hover:bg-secondary/50 flex items-center justify-center transition-colors">
            {muted ? <MicOff className="w-3.5 h-3.5 text-destructive" /> : <Mic className="w-3.5 h-3.5 text-green-500" />}
          </button>
          <button onClick={onHangup} className="w-7 h-7 rounded-full hover:bg-destructive/10 flex items-center justify-center transition-colors text-destructive">
            <PhoneOff className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const AIChatWidget: React.FC = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "complaint">("chat");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Complaint state
  const [complaintSubject, setComplaintSubject] = useState("");
  const [complaintCategory, setComplaintCategory] = useState("Order Issue");
  const [complaintDescription, setComplaintDescription] = useState("");
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const [liveConvId, setLiveConvId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollVisible = useScrollVisibility();

  // Call state
  const [incomingCall, setIncomingCall] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callMuted, setCallMuted] = useState(false);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callChannelRef = useRef<any>(null);
  const pendingOfferRef = useRef<string | null>(null);

  // Smart positioning
  const [mascotBottomPx, setMascotBottomPx] = useState(80);
  useEffect(() => {
    const recalc = () => {
      if (window.innerWidth >= 1024) { setMascotBottomPx(24); return; }
      const bottomNavTray = document.getElementById("mobile-bottom-nav-tray");
      const stickyBar = document.getElementById("sticky-add-to-cart");
      let highestTop = window.innerHeight - 64;
      if (bottomNavTray) highestTop = Math.min(highestTop, bottomNavTray.getBoundingClientRect().top);
      if (stickyBar) highestTop = Math.min(highestTop, stickyBar.getBoundingClientRect().top);
      const offset = window.innerHeight - highestTop + 12;
      setMascotBottomPx(Math.max(offset, 80));
    };
    recalc();
    window.addEventListener("scroll", recalc, { passive: true });
    window.addEventListener("resize", recalc, { passive: true });
    const interval = setInterval(recalc, 1000);
    return () => {
      window.removeEventListener("scroll", recalc);
      window.removeEventListener("resize", recalc);
      clearInterval(interval);
    };
  }, []);

  const isAdminPage = location.pathname.startsWith("/admin");
  const isLandingPage = location.pathname === "/";

  const { data: aiConfig } = useQuery({
    queryKey: ["ai-agent-config"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("value").eq("key", "ai_agent_config").maybeSingle();
      return (data?.value as any) || {};
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const isEnabled = aiConfig?.is_enabled !== false;
  const agentName = aiConfig?.name || "";
  const welcomeMessage = aiConfig?.welcome_message || "Hi! How can I help you?";
  const avatarType = aiConfig?.avatar_type || "emoji";
  const avatarUrl = aiConfig?.avatar_url || "";
  const avatarEmoji = aiConfig?.avatar_emoji || "";

  const AgentAvatar = React.memo(({ size = "w-8 h-8", iconSize = "w-4 h-4" }: { size?: string; iconSize?: string }) =>
    avatarType === "image" && avatarUrl ? (
      <img src={avatarUrl} alt={agentName} className={`${size} rounded-full object-cover`} loading="eager" decoding="async" />
    ) : (
      <div className={`${size} rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center`}>
        {avatarEmoji ? <span className={iconSize === "w-4 h-4" ? "text-base" : "text-sm"}>{avatarEmoji}</span> : <Bot className={`${iconSize} text-primary`} />}
      </div>
    )
  );

  // Fetch previous conversations (read-only display)
  const { data: pastConversations = [] } = useQuery({
    queryKey: ["user-past-convs", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("support_conversations")
        .select("id, subject, status, created_at")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false });
      return data || [];
    },
    enabled: !!user && open,
    staleTime: 30_000,
  });

  const { data: liveMessages = [] } = useQuery({
    queryKey: ["live-support-messages", liveConvId],
    queryFn: async () => {
      if (!liveConvId) return [];
      const { data } = await supabase.from("support_messages").select("*").eq("conversation_id", liveConvId).order("created_at");
      return data || [];
    },
    enabled: !!liveConvId && liveMode,
    refetchInterval: 2000,
  });

  // Listen for incoming calls on any active conversation
  useEffect(() => {
    if (!user) return;

    // Find active conversation to listen on
    const setupCallChannel = async () => {
      const { data } = await supabase
        .from("support_conversations")
        .select("id")
        .eq("user_id", user.id)
        .in("status", ["open", "assigned"])
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!data?.id) return;

      const channel = supabase.channel(`call-${data.id}`, {
        config: { broadcast: { self: false } },
      });

      channel.on("broadcast", { event: "call-request" }, ({ payload }) => {
        if (payload.action === "incoming") {
          setIncomingCall(true);
          // Auto-open widget
          setOpen(true);
          setTimeout(() => setIncomingCall(false), 30000);
        }
      });

      channel.on("broadcast", { event: "call-signal" }, async ({ payload }) => {
        if (payload.type === "offer" && payload.from === "admin") {
          // If peer connection already exists (user accepted), process immediately
          const pc = peerRef.current;
          if (pc && pc.signalingState !== "closed") {
            try {
              await pc.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: payload.sdp }));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              callChannelRef.current?.send({
                type: "broadcast",
                event: "call-signal",
                payload: { type: "answer", sdp: answer.sdp, from: "user" },
              });
            } catch (err) {
              console.error("Failed to process offer:", err);
            }
          } else {
            // Store for later processing in acceptCall
            pendingOfferRef.current = payload.sdp;
          }
        }
        if (payload.type === "ice-candidate" && payload.from === "admin" && peerRef.current) {
          try {
            await peerRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } catch (err) {
            console.error("Failed to add ICE candidate:", err);
          }
        }
        if (payload.type === "hangup") {
          hangupCall();
        }
      });

      channel.subscribe();
      callChannelRef.current = channel;
    };

    setupCallChannel();

    return () => {
      if (callChannelRef.current) {
        supabase.removeChannel(callChannelRef.current);
        callChannelRef.current = null;
      }
    };
  }, [user?.id, liveConvId]);

  const acceptCall = async () => {
    setIncomingCall(false);

    callChannelRef.current?.send({
      type: "broadcast",
      event: "call-response",
      payload: { action: "accepted" },
    });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      const iceServers = await getIceServers();
      const pc = new RTCPeerConnection({
        iceServers: iceServers as RTCIceServer[],
      });
      peerRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
          remoteAudioRef.current.play().catch(() => {});
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          callChannelRef.current?.send({
            type: "broadcast",
            event: "call-signal",
            payload: { type: "ice-candidate", candidate: event.candidate, from: "user" },
          });
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === "connected") {
          setCallActive(true);
          timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
        }
        if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") {
          hangupCall();
        }
      };

      if (pendingOfferRef.current) {
        await pc.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: pendingOfferRef.current }));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        callChannelRef.current?.send({
          type: "broadcast",
          event: "call-signal",
          payload: { type: "answer", sdp: answer.sdp, from: "user" },
        });
      }
      // Don't set callActive here — wait for ICE connected state
    } catch (err) {
      console.error("Failed to accept call:", err);
    }
  };

  const rejectCall = () => {
    setIncomingCall(false);
    callChannelRef.current?.send({
      type: "broadcast",
      event: "call-response",
      payload: { action: "rejected" },
    });
  };

  const hangupCall = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    pendingOfferRef.current = null;
    setCallActive(false);
    setCallDuration(0);
    setCallMuted(false);
  }, []);

  const toggleCallMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
      setCallMuted(!callMuted);
    }
  };

  useEffect(() => {
    if (!liveConvId || !liveMode) return;
    const channel = supabase
      .channel(`widget-live-${liveConvId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: `conversation_id=eq.${liveConvId}` },
        () => qc.invalidateQueries({ queryKey: ["live-support-messages", liveConvId] })
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [liveConvId, liveMode, qc]);

  useEffect(() => {
    if (!liveConvId || !liveMode) return;
    const check = async () => {
      const { data } = await supabase.from("support_conversations").select("status").eq("id", liveConvId).maybeSingle();
      if (data?.status === "closed") {
        setLiveMode(false);
        setMessages(prev => [...prev, { role: "assistant", content: "The live support session has ended. I'm back to assist you! 😊" }]);
      }
    };
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, [liveConvId, liveMode]);

  useEffect(() => {
    if (!liveMode || liveMessages.length === 0) return;
    const converted: Msg[] = liveMessages.map((m: any) => ({
      role: m.sender_type === "user" ? "user" as const : "assistant" as const,
      content: m.content,
    }));
    setMessages(converted);
  }, [liveMessages, liveMode]);

  useEffect(() => {
    if (open && messages.length === 0 && !liveMode) {
      setMessages([{ role: "assistant", content: welcomeMessage }]);
    }
  }, [open, welcomeMessage]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return;
    if (liveMode && liveConvId && user) {
      const content = input.trim();
      setInput("");
      await supabase.from("support_messages").insert({ conversation_id: liveConvId, sender_id: user.id, sender_type: "user", content });
      await supabase.from("support_conversations").update({ updated_at: new Date().toISOString() }).eq("id", liveConvId);
      return;
    }
    const userMsg: Msg = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: { messages: newMessages.filter((m) => m.role !== "system"), context: { userId: user?.id } },
      });
      if (error) throw error;
      setMessages((prev) => [...prev, { role: "assistant", content: data?.reply || "Sorry, I couldn't process that." }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }, [input, messages, loading, user, liveMode, liveConvId]);

  const requestLiveSupport = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: conv } = await supabase.from("support_conversations").insert({
        user_id: user.id, subject: "Live Support Request", is_ai: false, status: "open",
      }).select().single();
      if (conv) {
        await supabase.from("support_messages").insert({ conversation_id: conv.id, sender_id: user.id, sender_type: "user", content: "Requested live support from chat widget." });
        await supabase.functions.invoke("notify-live-support", { body: { conversation_id: conv.id } });
        setLiveConvId(conv.id);
        setLiveMode(true);
        setMessages([{ role: "assistant", content: "🎧 Connecting you to live support... An agent will join shortly." }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Couldn't connect to live support right now." }]);
    } finally {
      setLoading(false);
    }
  };

  const requestCall = async () => {
    if (!user || !liveConvId) return;
    // Send a message requesting a call
    await supabase.from("support_messages").insert({
      conversation_id: liveConvId, sender_id: user.id, sender_type: "user",
      content: "📞 I'd like to request a voice call with a support agent.",
    });
    // Also create a notification for admins
    await supabase.from("notifications").insert({
      title: "📞 Call Request",
      message: "A customer is requesting a voice call.",
      type: "support",
      priority: "high",
      link_url: "/admin/support",
    });
    toast.success("Call request sent to support agent");
  };

  const submitComplaint = async () => {
    if (!user) { toast.error("Please sign in to submit a complaint"); return; }
    if (!complaintSubject.trim() || !complaintDescription.trim()) { toast.error("Please fill in all fields"); return; }
    setSubmittingComplaint(true);
    try {
      const { data: conv } = await supabase.from("support_conversations").insert({
        user_id: user.id,
        subject: `[${complaintCategory}] ${complaintSubject}`,
        status: "open",
        is_ai: false,
        type: "complaint",
      } as any).select("id").single();
      if (conv) {
        await supabase.from("support_messages").insert({
          conversation_id: conv.id,
          content: `**Category:** ${complaintCategory}\n\n${complaintDescription}`,
          sender_id: user.id,
          sender_type: "user",
        });
      }
      toast.success("Complaint submitted successfully!");
      setComplaintSubject("");
      setComplaintDescription("");
      setComplaintCategory("Order Issue");
      setActiveTab("chat");
    } catch {
      toast.error("Failed to submit complaint");
    }
    setSubmittingComplaint(false);
  };

  if (isAdminPage || isLandingPage || !isEnabled) return null;

  const showMascot = !open && scrollVisible;
  const showCallRing = incomingCall && !open;

  return (
    <>
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      {/* Floating wolf mascot button */}
      <AnimatePresence>
        {(showMascot || showCallRing) && (
          <motion.button
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            onClick={() => setOpen(true)}
            className="fixed right-4 z-50 group transition-all duration-300"
            style={{ bottom: mascotBottomPx }}
            aria-label="Open support chat"
          >
            <div className="relative w-16 h-16">
              {/* Incoming call ring animation */}
              {incomingCall && (
                <>
                  <motion.div
                    className="absolute inset-[-12px] rounded-full border-2 border-green-500/60"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0, 0.8] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                  />
                  <motion.div
                    className="absolute inset-[-6px] rounded-full border-2 border-green-400/80"
                    animate={{ scale: [1, 1.25, 1], opacity: [1, 0.3, 1] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0.3 }}
                  />
                </>
              )}

              {/* Ambient glow */}
              <motion.div
                className={`absolute inset-[-8px] rounded-full blur-xl ${incomingCall ? "bg-green-500/40" : "bg-primary/20"}`}
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ repeat: Infinity, duration: incomingCall ? 1 : 3, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute inset-[-4px] rounded-full border border-primary/20"
                animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.5, 0.2] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", delay: 0.5 }}
              />

              {/* Wolf mascot */}
              <div className="relative w-16 h-16 flex items-center justify-center">
                {incomingCall ? (
                  <motion.div
                    className="w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center"
                    animate={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                  >
                    <Phone className="w-7 h-7 text-white" />
                  </motion.div>
                ) : (
                  <img
                    src={wolfMascot}
                    alt="Support"
                    className="w-14 h-14 object-contain drop-shadow-[0_0_12px_hsl(var(--primary)/0.5)] group-hover:drop-shadow-[0_0_20px_hsl(var(--primary)/0.7)] transition-all duration-300 group-hover:scale-110"
                  />
                )}
              </div>

              {/* Bubble particles */}
              {!incomingCall && (
                <>
                  <BubbleParticle delay={0} size={5} x={-6} y={10} duration={3.5} />
                  <BubbleParticle delay={0.8} size={4} x={52} y={5} duration={4} />
                  <BubbleParticle delay={1.5} size={6} x={20} y={-4} duration={3} />
                  <BubbleParticle delay={2.2} size={3} x={46} y={20} duration={4.5} />
                  <BubbleParticle delay={0.4} size={4} x={-2} y={40} duration={3.8} />
                </>
              )}

              {/* Online / Call pulse dot */}
              <motion.div
                className={`absolute top-0 right-0 w-3 h-3 rounded-full border-2 border-background shadow-[0_0_6px_theme(colors.emerald.400)] ${incomingCall ? "bg-green-400" : "bg-emerald-400"}`}
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: incomingCall ? 0.6 : 2 }}
              />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed bottom-20 lg:bottom-6 right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-8rem)] rounded-3xl bg-card border border-border/60 shadow-[0_8px_40px_hsl(0_0%_0%/0.5)] flex flex-col overflow-hidden"
          >
            {/* Header with gradient accent */}
            <div className="relative">
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary/8 via-primary/3 to-transparent">
                <AgentAvatar />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {agentName ? `Support (${agentName})` : "Support"}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${callActive ? "bg-green-400 animate-pulse" : liveMode ? "bg-emerald-400" : "bg-primary"}`} />
                    <p className="text-[10px] text-muted-foreground">
                      {callActive ? "Voice call active" : liveMode ? "Live agent" : "AI assistant"}
                    </p>
                  </div>
                </div>
                {user && !liveMode && (
                  <button onClick={requestLiveSupport} className="p-2 rounded-xl hover:bg-secondary/50 transition-colors" title="Request live support">
                    <Headphones className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
                  </button>
                )}
                {user && liveMode && !callActive && (
                  <button onClick={requestCall} className="p-2 rounded-xl hover:bg-green-500/10 transition-colors" title="Request voice call">
                    <Phone className="w-4 h-4 text-green-500 hover:text-green-600 transition-colors" />
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-2 rounded-xl hover:bg-secondary/50 transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Tab switcher */}
            <div className="flex border-b border-border/30 px-2">
              {[
                { id: "chat" as const, label: "Chat", icon: MessageSquare },
                { id: "complaint" as const, label: "Complaint", icon: AlertTriangle },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all border-b-2 ${
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Incoming call UI */}
            <IncomingCallWidget visible={incomingCall} onAccept={acceptCall} onReject={rejectCall} />

            {/* Active call bar */}
            <AnimatePresence>
              {callActive && (
                <ActiveCallWidget
                  duration={callDuration}
                  muted={callMuted}
                  onToggleMute={toggleCallMute}
                  onHangup={hangupCall}
                />
              )}
            </AnimatePresence>

            {activeTab === "chat" ? (
              <>
                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      {msg.role === "assistant" && <AgentAvatar size="w-6 h-6" iconSize="w-3 h-3" />}
                      <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-secondary/80 text-foreground rounded-bl-sm"
                      }`}>
                        {msg.role === "assistant" ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:mb-1 [&_p]:mt-0">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : msg.content}
                      </div>
                      {msg.role === "user" && (
                        <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
                          <User className="w-3 h-3 text-muted-foreground" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                  {loading && (
                    <div className="flex gap-2 items-center">
                      <AgentAvatar size="w-6 h-6" iconSize="w-3 h-3" />
                      <div className="bg-secondary/80 rounded-2xl px-4 py-3 flex gap-1">
                        {[0, 1, 2].map(i => (
                          <motion.span key={i} className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full"
                            animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Past conversations */}
                  {!liveMode && !callActive && pastConversations.length > 0 && messages.length <= 1 && (
                    <div className="mt-4 pt-3 border-t border-border/30">
                      <p className="text-[11px] text-muted-foreground mb-2">Previous chats</p>
                      {pastConversations.slice(0, 5).map((conv: any) => (
                        <div key={conv.id} className="py-1.5 px-2 rounded-lg hover:bg-secondary/30">
                          <p className="text-xs text-foreground truncate">{conv.subject}</p>
                          <p className="text-[10px] text-muted-foreground">{conv.status} · {new Date(conv.created_at).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="p-3 border-t border-border/50">
                  <div className="flex gap-2">
                    <input value={input} onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                      placeholder={liveMode ? "Message agent..." : "Ask anything..."}
                      className="flex-1 bg-secondary/40 backdrop-blur-sm rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40" />
                    <button onClick={sendMessage} disabled={!input.trim() || loading}
                      className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:bg-primary/90 transition-colors">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Complaint Form */
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div>
                  <p className="text-xs font-medium text-foreground mb-1">Subject</p>
                  <input
                    value={complaintSubject}
                    onChange={(e) => setComplaintSubject(e.target.value)}
                    placeholder="Brief description of your issue"
                    className="w-full bg-secondary/40 rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground mb-1">Category</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {["Order Issue", "Product Quality", "Delivery", "Other"].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setComplaintCategory(cat)}
                        className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                          complaintCategory === cat
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/50 text-muted-foreground hover:border-primary/30"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground mb-1">Description</p>
                  <textarea
                    value={complaintDescription}
                    onChange={(e) => setComplaintDescription(e.target.value)}
                    placeholder="Please describe your issue in detail..."
                    rows={5}
                    className="w-full bg-secondary/40 rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none"
                  />
                </div>
                <button
                  onClick={submitComplaint}
                  disabled={submittingComplaint || !complaintSubject.trim() || !complaintDescription.trim()}
                  className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  {submittingComplaint ? "Submitting..." : "Submit Complaint"}
                </button>
                {!user && (
                  <p className="text-[11px] text-muted-foreground text-center">Please sign in to submit a complaint</p>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatWidget;
