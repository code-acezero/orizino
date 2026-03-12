import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User, Headphones } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";

interface Msg {
  role: "user" | "assistant" | "system";
  content: string;
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

  // Hide on admin pages and landing page
  const isAdminPage = location.pathname.startsWith("/admin");
  const isLandingPage = location.pathname === "/";

  const { data: aiConfig } = useQuery({
    queryKey: ["ai-agent-config"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("value").eq("key", "ai_agent_config").maybeSingle();
      return (data?.value as any) || {};
    },
    staleTime: 60_000,
  });

  const isEnabled = aiConfig?.is_enabled !== false;
  const agentName = aiConfig?.name || "";
  const welcomeMessage = aiConfig?.welcome_message || "Hi! How can I help you?";
  const avatarType = aiConfig?.avatar_type || "emoji";
  const avatarUrl = aiConfig?.avatar_url || "";
  const avatarEmoji = aiConfig?.avatar_emoji || "";

  const AgentAvatar = ({ size = "w-10 h-10", iconSize = "w-5 h-5" }: { size?: string; iconSize?: string }) =>
    avatarType === "image" && avatarUrl ? (
      <img src={avatarUrl} alt={agentName} className={`${size} rounded-full object-cover`} />
    ) : (
      <div className={`${size} rounded-full bg-primary/20 flex items-center justify-center`}>
        {avatarEmoji ? <span className={iconSize === "w-5 h-5" ? "text-lg" : "text-sm"}>{avatarEmoji}</span> : <Bot className={`${iconSize} text-primary`} />}
      </div>
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
      await supabase.from("support_messages").insert({
        conversation_id: liveConvId,
        sender_id: user.id,
        sender_type: "user",
        content,
      });
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
        user_id: user.id,
        subject: "Live Support Request",
        is_ai: false,
        status: "open",
      }).select().single();

      if (conv) {
        await supabase.from("support_messages").insert({
          conversation_id: conv.id,
          sender_id: user.id,
          sender_type: "user",
          content: "Requested live support from chat widget.",
        });
        await supabase.functions.invoke("notify-live-support", { body: { conversation_id: conv.id } });
        setLiveConvId(conv.id);
        setLiveMode(true);
        setMessages([{ role: "assistant", content: "🎧 Connecting you to live support... An agent will join shortly. Please wait." }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Couldn't connect to live support right now. Please try again later." }]);
    } finally {
      setLoading(false);
    }
  };

  // Don't render on admin or landing pages, or if disabled
  if (isAdminPage || isLandingPage || !isEnabled) return null;

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-20 lg:bottom-6 right-4 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/40 flex items-center justify-center hover:scale-110 transition-transform"
          >
            {avatarType === "image" && avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : avatarEmoji ? (
              <span className="text-2xl">{avatarEmoji}</span>
            ) : (
              <MessageCircle className="w-6 h-6" />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 lg:bottom-6 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-8rem)] rounded-3xl bg-background border border-border shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="flex items-center gap-3 p-4 border-b border-border bg-primary/5">
              <AgentAvatar />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{agentName || "Support"}</p>
                <p className="text-[10px] text-muted-foreground">
                  {liveMode ? "🟢 Live support" : "AI-powered support"}
                </p>
              </div>
              {user && !liveMode && (
                <button onClick={requestLiveSupport} className="p-2 rounded-xl hover:bg-secondary transition-colors" title="Request live support">
                  <Headphones className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-2 rounded-xl hover:bg-secondary transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && <AgentAvatar size="w-7 h-7" iconSize="w-3.5 h-3.5" />}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-secondary text-foreground rounded-bl-md"
                  }`}>
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:mb-1 [&_p]:mt-0">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : msg.content}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}
              {loading && (
                <div className="flex gap-2 items-center">
                  <AgentAvatar size="w-7 h-7" iconSize="w-3.5 h-3.5" />
                  <div className="bg-secondary rounded-2xl px-4 py-3 flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-border">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder={liveMode ? "Message agent..." : "Ask anything..."}
                  className="flex-1 bg-secondary rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 hover:bg-primary/90 transition-colors"
                >
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
