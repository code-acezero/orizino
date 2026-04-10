import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import NotificationBell from "@/components/NotificationBell";
import AppToastOverlay from "@/components/AppToastOverlay";
import { LogOut, User } from "lucide-react";

const AdminLayout: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["admin-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "AD";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border px-4 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
            <SidebarTrigger className="mr-4" />
            <span className="font-display text-sm text-muted-foreground">
              Zero Marketplace Admin
            </span>

            {/* Right side: notifications + profile */}
            <div className="ml-auto flex items-center gap-2">
              <NotificationBell adminMode />

              <div className="flex items-center gap-2 ml-2">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Admin"
                    className="w-8 h-8 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-border flex items-center justify-center">
                    <span className="text-xs font-semibold text-primary">{initials}</span>
                  </div>
                )}
                <div className="hidden sm:block">
                  <p className="text-xs font-medium text-foreground leading-tight">{profile?.full_name || "Admin"}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">Administrator</p>
                </div>
              </div>

              <button
                onClick={() => { signOut(); navigate("/auth"); }}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
      {/* Admin-specific toast overlay */}
      <AppToastOverlay />
    </SidebarProvider>
  );
};

export default AdminLayout;
