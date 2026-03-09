import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, MessageCircle, User, Clock, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

const AdminSupport = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [] } = useQuery({
    queryKey: ["admin-support-conversations"],
    queryFn: async () => {
      const { data } = await supabase
        .from("support_conversations")
        .select("*")
        .order("updated_at", { ascending: false });
      return data || [];
    },
    refetchInterval: 5000,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["admin-support-messages", selectedConv],
    queryFn: async () => {
      if (!selectedConv) return [];
      const { data } = await supabase
        .from("support_messages")
        .select("*")
        .eq("conversation_id", selectedConv)
        .order("created_at");
      return data || [];
    },
    enabled: !!selectedConv,
    refetchInterval: 3000,
  });

  // Real-time subscription
  useEffect(() => {
    if (!selectedConv) return;
    const channel = supabase
      .channel(`support-${selectedConv}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: `conversation_id=eq.${selectedConv}` },
        () => qc.invalidateQueries({ queryKey: ["admin-support-messages", selectedConv] })
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedConv, qc]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendReply = async () => {
    if (!reply.trim() || !selectedConv || !user) return;
    setSending(true);
    await supabase.from("support_messages").insert({
      conversation_id: selectedConv,
      sender_id: user.id,
      sender_type: "admin",
      content: reply.trim(),
    });
    setReply("");
    setSending(false);
    qc.invalidateQueries({ queryKey: ["admin-support-messages", selectedConv] });
  };

  const closeConversation = async (id: string) => {
    await supabase.from("support_conversations").update({ status: "closed", updated_at: new Date().toISOString() }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-support-conversations"] });
  };

  const openCount = conversations.filter((c: any) => c.status === "open").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold">Live Support</h1>
        {openCount > 0 && <Badge variant="destructive">{openCount} open</Badge>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: "calc(100vh - 200px)" }}>
        {/* Conversation list */}
        <div className="border border-border rounded-2xl overflow-hidden flex flex-col">
          <div className="p-3 border-b border-border bg-secondary/30">
            <p className="text-sm font-medium text-foreground">Conversations</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No conversations</div>
            ) : conversations.map((conv: any) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConv(conv.id)}
                className={`w-full text-left p-3 border-b border-border hover:bg-secondary/30 transition-colors ${
                  selectedConv === conv.id ? "bg-primary/5 border-l-2 border-l-primary" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground truncate">{conv.subject}</span>
                  <Badge variant={conv.status === "open" ? "destructive" : "secondary"} className="text-[10px]">
                    {conv.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {format(new Date(conv.updated_at), "MMM d, HH:mm")}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="lg:col-span-2 border border-border rounded-2xl overflow-hidden flex flex-col">
          {!selectedConv ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select a conversation</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-3 border-b border-border bg-secondary/30 flex items-center justify-between">
                <p className="text-sm font-medium">Chat</p>
                <Button size="sm" variant="outline" onClick={() => closeConversation(selectedConv)}>
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Close
                </Button>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg: any) => (
                  <div key={msg.id} className={`flex gap-2 ${msg.sender_type === "admin" ? "justify-end" : "justify-start"}`}>
                    {msg.sender_type !== "admin" && (
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.sender_type === "admin"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : msg.sender_type === "ai"
                        ? "bg-secondary/80 text-foreground rounded-bl-md border border-border"
                        : "bg-secondary text-foreground rounded-bl-md"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendReply()}
                    placeholder="Type a reply..."
                    className="rounded-xl"
                  />
                  <Button onClick={sendReply} disabled={!reply.trim() || sending} className="rounded-xl">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSupport;
