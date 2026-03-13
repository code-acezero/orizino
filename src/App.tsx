import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import ShopPage from "./pages/ShopPage";
import CategoryPage from "./pages/CategoryPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrdersPage from "./pages/OrdersPage";
import WishlistPage from "./pages/WishlistPage";
import SupportPage from "./pages/SupportPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminBanners from "./pages/admin/AdminBanners";
import AdminRequests from "./pages/admin/AdminRequests";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminShowcase from "./pages/admin/AdminShowcase";
import AdminHome from "./pages/admin/AdminHome";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminShipping from "./pages/admin/AdminShipping";
import AdminSupport from "./pages/admin/AdminSupport";
import AdminApiKeys from "./pages/admin/AdminApiKeys";
import AdminAISettings from "./pages/admin/AdminAISettings";
import AdminUserPromos from "./pages/admin/AdminUserPromos";
import AdminDeliveryOffers from "./pages/admin/AdminDeliveryOffers";
import AdminCmsPages from "./pages/admin/AdminCmsPages";
import AdminLanding from "./pages/admin/AdminLanding";
import AdminBranding from "./pages/admin/AdminBranding";
import CmsPage from "./pages/CmsPage";
import NotFound from "./pages/NotFound";
import SiteThemeProvider from "./components/SiteThemeProvider";
import AppToastOverlay from "./components/AppToastOverlay";
import AIChatWidget from "./components/AIChatWidget";
import PromoPopup from "./components/PromoPopup";
import { useDynamicFavicon } from "./hooks/use-dynamic-favicon";

const queryClient = new QueryClient();

const AppContent = () => {
  useDynamicFavicon();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppToastOverlay />
      <BrowserRouter>
        <AuthProvider>
          <CurrencyProvider>
          <SiteThemeProvider />
          <AppContent />
          <AIChatWidget />
          <PromoPopup />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/auth" element={<Navigate to="/home" replace />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/categories/:slug" element={<CategoryPage />} />
            <Route path="/product/:slug" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route
              path="/profile"
              element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
            />
            <Route
              path="/settings"
              element={<ProtectedRoute><SettingsPage /></ProtectedRoute>}
            />
            <Route
              path="/checkout"
              element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>}
            />
            <Route
              path="/orders"
              element={<ProtectedRoute><OrdersPage /></ProtectedRoute>}
            />
            <Route
              path="/admin"
              element={<AdminRoute><AdminLayout /></AdminRoute>}
            >
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="reviews" element={<AdminReviews />} />
              <Route path="banners" element={<AdminBanners />} />
              <Route path="requests" element={<AdminRequests />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="showcase" element={<AdminShowcase />} />
              <Route path="home" element={<AdminHome />} />
              <Route path="announcements" element={<AdminAnnouncements />} />
              <Route path="coupons" element={<AdminCoupons />} />
              <Route path="shipping" element={<AdminShipping />} />
              <Route path="support" element={<AdminSupport />} />
              <Route path="api-keys" element={<AdminApiKeys />} />
              <Route path="ai-settings" element={<AdminAISettings />} />
              <Route path="user-promos" element={<AdminUserPromos />} />
              <Route path="delivery-offers" element={<AdminDeliveryOffers />} />
              <Route path="cms-pages" element={<AdminCmsPages />} />
              <Route path="landing" element={<AdminLanding />} />
              <Route path="branding" element={<AdminBranding />} />
            </Route>
            <Route path="/page/:slug" element={<CmsPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </CurrencyProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
