import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  Star,
  Image,
  Settings,
  ArrowLeft,
  MessageSquare,
  Layers,
  Home,
  Megaphone,
  Tag,
  Truck,
  Headphones,
  Key,
  Bot,
  Gift,
  Percent,
  Palette,
  Globe,
  Smartphone,
  Phone,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminRole } from "@/components/AdminRoute";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

interface MenuItem {
  title: string;
  url: string;
  icon: any;
  adminOnly?: boolean;
}

const mainItems: MenuItem[] = [
  { title: "Dashboard", url: "/origin", icon: LayoutDashboard },
  { title: "Products", url: "/origin/products", icon: Package },
  { title: "Categories", url: "/origin/categories", icon: FolderTree },
  { title: "Orders", url: "/origin/orders", icon: ShoppingCart },
  { title: "Users", url: "/origin/users", icon: Users, adminOnly: true },
];

const commerceItems: MenuItem[] = [
  { title: "Coupons", url: "/origin/coupons", icon: Tag },
  { title: "User Promos", url: "/origin/user-promos", icon: Gift, adminOnly: true },
  { title: "Shipping", url: "/origin/shipping", icon: Truck, adminOnly: true },
  { title: "Delivery Offers", url: "/origin/delivery-offers", icon: Percent },
  { title: "Payment Gateways", url: "/origin/payment-gateways", icon: Key, adminOnly: true },
  { title: "Returns", url: "/origin/returns", icon: Package },
];

const contentItems: MenuItem[] = [
  { title: "Landing Page", url: "/origin/landing", icon: Globe, adminOnly: true },
  { title: "Home Page", url: "/origin/home", icon: Home, adminOnly: true },
  { title: "Showcase", url: "/origin/showcase", icon: Layers },
  { title: "Banners", url: "/origin/banners", icon: Image },
  { title: "Footer", url: "/origin/footer", icon: Layers, adminOnly: true },
  { title: "Reviews", url: "/origin/reviews", icon: Star },
  { title: "Announcements", url: "/origin/announcements", icon: Megaphone },
  { title: "CMS Pages", url: "/origin/cms-pages", icon: MessageSquare, adminOnly: true },
  { title: "Product Requests", url: "/origin/requests", icon: MessageSquare, adminOnly: true },
];

const systemItems: MenuItem[] = [
  { title: "Live Support", url: "/origin/support", icon: Headphones },
  { title: "Call Settings", url: "/origin/call-settings", icon: Phone, adminOnly: true },
  { title: "AI Agent", url: "/origin/ai-settings", icon: Bot, adminOnly: true },
  { title: "Branding", url: "/origin/branding", icon: Palette, adminOnly: true },
  { title: "Mobile UI", url: "/origin/mobile-ui", icon: Smartphone, adminOnly: true },
  { title: "API Keys", url: "/origin/api-keys", icon: Key, adminOnly: true },
  { title: "Settings", url: "/origin/settings", icon: Settings, adminOnly: true },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const role = useAdminRole();

  const { data: openSupportCount = 0 } = useQuery({
    queryKey: ["admin-open-support-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("support_conversations")
        .select("*", { count: "exact", head: true })
        .eq("status", "open");
      return count || 0;
    },
    refetchInterval: 10000,
  });

  const isActive = (path: string) =>
    path === "/origin"
      ? location.pathname === "/origin"
      : location.pathname.startsWith(path);

  const getBadge = (url: string) => {
    if (url === "/origin/support" && openSupportCount > 0) return openSupportCount;
    return null;
  };

  const filterItems = (items: MenuItem[]) =>
    role === "moderator" ? items.filter((i) => !i.adminOnly) : items;

  const renderGroup = (label: string, items: MenuItem[]) => {
    const filtered = filterItems(items);
    if (filtered.length === 0) return null;
    return (
      <SidebarGroup>
        <SidebarGroupLabel>{label}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {filtered.map((item) => {
              const badge = getBadge(item.url);
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end={item.url === "/origin"}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                      {badge != null && (
                        <span className="ml-auto min-w-[20px] h-5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5">
                          {badge}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        {!collapsed && (
          <h2 className="font-display text-lg font-bold text-primary">
            Admin Panel
          </h2>
        )}
      </SidebarHeader>

      <SidebarContent>
        {renderGroup("Management", mainItems)}
        {renderGroup("Commerce", commerceItems)}
        {renderGroup("Content", contentItems)}
        {renderGroup("System", systemItems)}
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink to="/home">
                <ArrowLeft className="h-4 w-4" />
                {!collapsed && <span>Back to Store</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
