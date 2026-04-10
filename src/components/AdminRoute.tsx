import React, { createContext, useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type AdminRole = "admin" | "moderator" | null;

const AdminRoleContext = createContext<AdminRole>(null);
export const useAdminRole = () => useContext(AdminRoleContext);

// Pages moderators can access
const MODERATOR_ALLOWED_PATHS = [
  "/admin",
  "/admin/products",
  "/admin/categories",
  "/admin/orders",
  "/admin/coupons",
  "/admin/delivery-offers",
  "/admin/banners",
  "/admin/showcase",
  "/admin/reviews",
  "/admin/announcements",
  "/admin/support",
];

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  const { data: role, isLoading: roleLoading } = useQuery({
    queryKey: ["user-admin-role", user?.id],
    queryFn: async (): Promise<AdminRole> => {
      // Check admin first
      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: user!.id,
        _role: "admin",
      });
      if (isAdmin) return "admin";

      const { data: isMod } = await supabase.rpc("has_role", {
        _user_id: user!.id,
        _role: "moderator",
      });
      if (isMod) return "moderator";

      return null;
    },
    enabled: !!user,
  });

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!role) return <Navigate to="/" replace />;

  // Moderator path guard
  if (role === "moderator") {
    const currentPath = location.pathname.replace(/\/$/, "") || "/admin";
    const allowed = MODERATOR_ALLOWED_PATHS.some(
      (p) => currentPath === p || (p === "/admin" && currentPath === "/admin")
    );
    if (!allowed) return <Navigate to="/admin" replace />;
  }

  return (
    <AdminRoleContext.Provider value={role}>
      {children}
    </AdminRoleContext.Provider>
  );
};

export default AdminRoute;
