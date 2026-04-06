import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Bot, User, Headphones } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import wolfMascot from "@/assets/wolf-mascot.png";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";

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

      // Show again after scroll stops
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

const AIChatWidget: React.FC = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const [liveConvId, setLiveConvId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollVisible = useScrollVisibility();

  // Smart positioning: detect if sticky bar or bottom nav overlaps and move up
  const [mascotBottom, setMascotBottom] = useState("bottom-20");
  useEffect(() => {
    const recalc = () => {
      if (window.innerWidth >= 1024) { setMascotBottom("bottom-6"); return; }
      const stickyBar = document.getElementById("sticky-add-to-cart");
      const bottomNav = document.querySelector("nav[data-bottom-nav]") || document.querySelector(".fixed.bottom-0");
      let highestTop = window.innerHeight;
      if (stickyBar) highestTop = Math.min(highestTop, stickyBar.getBoundingClientRect().top);
      else if (bottomNav) highestTop = Math.min(highestTop, bottomNav.getBoundingClientRect().top);
      const offset = window.innerHeight - highestTop + 12;
      setMascotBottom(`bottom-[${Math.max(offset, 80)}px]`);
    };
    recalc();
    window.addEventListener("scroll", recalc, { passive: true });
    window.addEventListener("resize", recalc, { passive: true });
    const observer = new MutationObserver(recalc);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      window.removeEventListener("scroll", recalc);
      window.removeEventListener("resize", recalc);
      observer.disconnect();
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

  if (isAdminPage || isLandingPage || !isEnabled) return null;

  // When chat is open, always show; when closed, respect scroll visibility
  const showMascot = !open && scrollVisible;

  return (
    <>
      {/* Floating wolf mascot button — hides while scrolling */}
      <AnimatePresence>
        {showMascot && (
          <motion.button
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            onClick={() => setOpen(true)}
            className={`fixed right-4 z-50 group transition-all duration-300 lg:bottom-6 ${mascotBottom}`}
            aria-label="Open support chat"
          >
            <div className="relative w-16 h-16">
              {/* Ambient glow behind mascot */}
              <motion.div
                className="absolute inset-[-8px] rounded-full bg-primary/20 blur-xl"
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              />
              {/* Secondary glow ring */}
              <motion.div
                className="absolute inset-[-4px] rounded-full border border-primary/20"
                animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.5, 0.2] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", delay: 0.5 }}
              />

              {/* Wolf mascot */}
              <div className="relative w-16 h-16 flex items-center justify-center">
                <img
                  src={wolfMascot}
                  alt="Support"
                  className="w-14 h-14 object-contain drop-shadow-[0_0_12px_hsl(var(--primary)/0.5)] group-hover:drop-shadow-[0_0_20px_hsl(var(--primary)/0.7)] transition-all duration-300 group-hover:scale-110"
                />
              </div>

              {/* Bubble particles */}
              <BubbleParticle delay={0} size={5} x={-6} y={10} duration={3.5} />
              <BubbleParticle delay={0.8} size={4} x={52} y={5} duration={4} />
              <BubbleParticle delay={1.5} size={6} x={20} y={-4} duration={3} />
              <BubbleParticle delay={2.2} size={3} x={46} y={20} duration={4.5} />
              <BubbleParticle delay={0.4} size={4} x={-2} y={40} duration={3.8} />

              {/* Online pulse dot */}
              <motion.div
                className="absolute top-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-background shadow-[0_0_6px_theme(colors.emerald.400)]"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
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
            className="fixed bottom-20 lg:bottom-6 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-8rem)] rounded-3xl bg-card border border-border/60 shadow-[0_8px_40px_hsl(0_0%_0%/0.5)] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
              <AgentAvatar />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{agentName || "Support"}</p>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${liveMode ? "bg-emerald-400" : "bg-primary"}`} />
                  <p className="text-[10px] text-muted-foreground">{liveMode ? "Live agent" : "AI assistant"}</p>
                </div>
              </div>
              {user && !liveMode && (
                <button onClick={requestLiveSupport} className="p-2 rounded-xl hover:bg-secondary/50 transition-colors" title="Request live support">
                  <Headphones className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-2 rounded-xl hover:bg-secondary/50 transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

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
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border/50">
              <div className="flex gap-2">
                <input value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder={liveMode ? "Message agent..." : "Ask anything..."}
                  className="flex-1 bg-secondary/60 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
                <button onClick={sendMessage} disabled={!input.trim() || loading}
                  className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:bg-primary/90 transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatWidget;
