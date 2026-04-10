import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, User, Headphones, ArrowLeft, Phone, PhoneOff, Mic, MicOff } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { useSeoMeta } from "@/hooks/use-seo-meta";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { useLanguage } from "@/contexts/LanguageContext";
import { playRingtone, stopRingtone } from "@/lib/sounds";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

/* ── Incoming Call Modal ── */
const IncomingCallOverlay: React.FC<{
  visible: boolean;
  onAccept: () => void;
  onReject: () => void;
}> = ({ visible, onAccept, onReject }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="glass-strong rounded-3xl p-8 max-w-sm w-full mx-4 text-center space-y-6"
        >
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
              <Phone className="w-8 h-8 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-display font-bold text-foreground">Incoming Voice Call</h3>
            <p className="text-sm text-muted-foreground mt-1">Customer support wants to speak with you</p>
          </div>
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={onReject}
              className="w-16 h-16 rounded-full bg-destructive/90 hover:bg-destructive flex items-center justify-center transition-all shadow-lg hover:shadow-destructive/30"
            >
              <PhoneOff className="w-7 h-7 text-white" />
            </button>
            <button
              onClick={onAccept}
              className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-all shadow-lg hover:shadow-green-500/30 animate-pulse"
            >
              <Phone className="w-7 h-7 text-white" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

/* ── Active Call Bar ── */
const ActiveCallBar: React.FC<{
  duration: number;
  muted: boolean;
  onToggleMute: () => void;
  onHangup: () => void;
}> = ({ duration, muted, onToggleMute, onHangup }) => {
  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  return (
    <motion.div
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -40, opacity: 0 }}
      className="sticky top-16 z-40 mx-4 mb-4 flex items-center justify-between gap-4 px-5 py-3 rounded-2xl bg-green-500/10 border border-green-500/20 backdrop-blur-sm"
    >
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
        <span className="text-sm font-medium text-green-600">Voice Call Active</span>
        <span className="text-xs text-muted-foreground font-mono">{fmt(duration)}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={onToggleMute} className="h-8 w-8 p-0 rounded-full">
          {muted ? <MicOff className="w-4 h-4 text-destructive" /> : <Mic className="w-4 h-4 text-green-500" />}
        </Button>
        <Button size="sm" variant="ghost" onClick={onHangup} className="h-8 w-8 p-0 rounded-full text-destructive hover:bg-destructive/10">
          <PhoneOff className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};

const SupportPage: React.FC = () => {
  useSeoMeta("support", "Support | Ace Marketplace");
  const { user } = useAuth();
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Call state
  const [incomingCall, setIncomingCall] = useState(false);

  // Play/stop ringtone on incoming call
  useEffect(() => {
    if (incomingCall) { playRingtone(); } else { stopRingtone(); }
    return () => stopRingtone();
  }, [incomingCall]);
  const [callActive, setCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callMuted, setCallMuted] = useState(false);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const callChannelRef = useRef<any>(null);
  const pendingOfferRef = useRef<string | null>(null);

  const { data: aiConfig } = useQuery({
    queryKey: ["ai-agent-config"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("value").eq("key", "ai_agent_config").maybeSingle();
      return (data?.value as any) || {};
    },
    staleTime: 60_000,
  });

  // Find active support conversation for this user
  const { data: activeConv } = useQuery({
    queryKey: ["user-active-conv", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("support_conversations")
        .select("id")
        .eq("user_id", user!.id)
        .in("status", ["open", "assigned"])
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  // Listen for incoming calls on active conversation
  useEffect(() => {
    if (!activeConv?.id) return;

    const channel = supabase.channel(`call-${activeConv.id}`, {
      config: { broadcast: { self: false } },
    });

    channel.on("broadcast", { event: "call-request" }, ({ payload }) => {
      if (payload.action === "incoming") {
        setIncomingCall(true);
        // Auto-dismiss after 30s
        setTimeout(() => setIncomingCall(false), 30000);
      }
    });

    channel.on("broadcast", { event: "call-signal" }, async ({ payload }) => {
      if (payload.type === "offer" && payload.from === "admin") {
        pendingOfferRef.current = payload.sdp;
      }
      if (payload.type === "ice-candidate" && payload.from === "admin" && peerRef.current) {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
      }
      if (payload.type === "hangup") {
        hangupCall();
      }
    });

    channel.subscribe();
    callChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConv?.id]);

  const acceptCall = async () => {
    setIncomingCall(false);

    // Respond with accepted
    callChannelRef.current?.send({
      type: "broadcast",
      event: "call-response",
      payload: { action: "accepted" },
    });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
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

      // If we have a pending offer, set it
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

      setCallActive(true);
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

  const hangupCall = () => {
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
  };

  const toggleCallMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
      setCallMuted(!callMuted);
    }
  };

  const agentName = aiConfig?.name || "Ace Assistant";
  const welcomeMessage = aiConfig?.welcome_message || "Hi! How can I help you today?";

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ role: "assistant", content: welcomeMessage }]);
    }
  }, [welcomeMessage]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: { messages: newMessages, context: { userId: user?.id } },
      });
      if (error) throw error;
      setMessages((prev) => [...prev, { role: "assistant", content: data?.reply || "Sorry, I couldn't process that." }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }, [input, messages, loading, user]);

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
      <IncomingCallOverlay visible={incomingCall} onAccept={acceptCall} onReject={rejectCall} />

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/home" className="p-2 rounded-xl hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div className="flex items-center gap-3">
            {aiConfig?.avatar_type === "image" && aiConfig?.avatar_url ? (
              <img src={aiConfig.avatar_url} alt={agentName} className="w-12 h-12 rounded-2xl object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                {aiConfig?.avatar_emoji ? <span className="text-xl">{aiConfig.avatar_emoji}</span> : <Bot className="w-6 h-6 text-primary" />}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold font-display text-foreground">
                {agentName ? `Support (${agentName})` : t("nav.support")}
              </h1>
              <p className="text-sm text-muted-foreground">{t("nav.support")}</p>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {callActive && (
            <ActiveCallBar
              duration={callDuration}
              muted={callMuted}
              onToggleMute={toggleCallMute}
              onHangup={hangupCall}
            />
          )}
        </AnimatePresence>

        <div className="glass-strong rounded-3xl overflow-hidden flex flex-col" style={{ height: "calc(100vh - 280px)", minHeight: "400px" }}>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div className={`max-w-[75%] rounded-2xl px-5 py-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-secondary text-foreground rounded-bl-md"
                }`}>
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : <p className="text-sm">{msg.content}</p>}
                </div>
                {msg.role === "user" && (
                  <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-secondary rounded-2xl px-5 py-3 flex gap-1.5">
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border">
            <div className="flex gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder={t("nav.search").replace("...", "") + "..."}
                className="flex-1 bg-secondary rounded-2xl px-5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <Button onClick={sendMessage} disabled={!input.trim() || loading} className="rounded-2xl px-5 h-11">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SupportPage;
