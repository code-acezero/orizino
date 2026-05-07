import React, { useState } from "react";
import { Bell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/app-toast";

interface Props { userId: string; }

const TestPushButton: React.FC<Props> = ({ userId }) => {
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-push", {
        body: {
          user_id: userId,
          payload: {
            type: "general",
            title: "🔔 Test push",
            body: "This is a test notification from support.",
            url: "/support",
            tag: "test-push",
          },
        },
      });
      if (error) throw error;
      const sent = (data as any)?.sent ?? 0;
      if (sent > 0) toast({ title: `Sent to ${sent} device(s)` });
      else toast({ title: "No devices subscribed", description: "Ask the user to enable alerts in Support.", variant: "destructive" });
    } catch (e: any) {
      toast({ title: "Push failed", description: e?.message || "Try again", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button size="sm" variant="outline" onClick={send} disabled={busy} className="rounded-xl gap-1.5" title="Send a test push notification to this user">
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
      <span className="hidden sm:inline">Test push</span>
    </Button>
  );
};

export default TestPushButton;
