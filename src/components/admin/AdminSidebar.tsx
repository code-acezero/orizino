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
  Puzzle,
  Send,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
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

const mainItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Products", url: "/admin/products", icon: Package },
  { title: "Categories", url: "/admin/categories", icon: FolderTree },
  { title: "Orders", url: "/admin/orders", icon: ShoppingCart },
  { title: "Users", url: "/admin/users", icon: Users },
];

const commerceItems = [
  { title: "Coupons", url: "/admin/coupons", icon: Tag },
  { title: "User Promos", url: "/admin/user-promos", icon: Gift },
  { title: "Shipping", url: "/admin/shipping", icon: Truck },
  { title: "Delivery Offers", url: "/admin/delivery-offers", icon: Percent },
];

const contentItems = [
  { title: "Landing Page", url: "/admin/landing", icon: Globe },
  { title: "Home Page", url: "/admin/home", icon: Home },
  { title: "Showcase", url: "/admin/showcase", icon: Layers },
  { title: "Banners", url: "/admin/banners", icon: Image },
  { title: "Reviews", url: "/admin/reviews", icon: Star },
  { title: "Announcements", url: "/admin/announcements", icon: Megaphone },
  { title: "CMS Pages", url: "/admin/cms-pages", icon: MessageSquare },
  { title: "Requests", url: "/admin/requests", icon: MessageSquare },
];

const systemItems = [
  { title: "Live Support", url: "/admin/support", icon: Headphones },
  { title: "AI Agent", url: "/admin/ai-settings", icon: Bot },
  { title: "Branding", url: "/admin/branding", icon: Palette },
  { title: "API Keys", url: "/admin/api-keys", icon: Key },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const isActive = (path: string) =>
    path === "/admin"
      ? location.pathname === "/admin"
      : location.pathname.startsWith(path);

  const renderGroup = (label: string, items: typeof mainItems) => (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={isActive(item.url)}>
                <NavLink to={item.url} end={item.url === "/admin"}>
                  <item.icon className="h-4 w-4" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

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
