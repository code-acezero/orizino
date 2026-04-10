import React, { Suspense, lazy } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { LayoutProvider } from "@/contexts/LayoutContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import SiteThemeProvider from "./components/SiteThemeProvider";
import MainLayout from "./components/MainLayout";

import { useDynamicFavicon } from "./hooks/use-dynamic-favicon";

// Eagerly load critical pages
import HomePage from "./pages/HomePage";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";

// Lazy load everything else
import AdminLayout from "./components/admin/AdminLayout";
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const ShopPage = lazy(() => import("./pages/ShopPage"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const OrdersPage = lazy(() => import("./pages/OrdersPage"));
const WishlistPage = lazy(() => import("./pages/WishlistPage"));
const SupportPage = lazy(() => import("./pages/SupportPage"));
const CmsPage = lazy(() => import("./pages/CmsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AIChatWidget = lazy(() => import("./components/AIChatWidget"));
const PromoPopup = lazy(() => import("./components/PromoPopup"));

// Lazy admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const AdminBanners = lazy(() => import("./pages/admin/AdminBanners"));
const AdminRequests = lazy(() => import("./pages/admin/AdminRequests"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminShowcase = lazy(() => import("./pages/admin/AdminShowcase"));
const AdminHome = lazy(() => import("./pages/admin/AdminHome"));
const AdminAnnouncements = lazy(() => import("./pages/admin/AdminAnnouncements"));
const AdminCoupons = lazy(() => import("./pages/admin/AdminCoupons"));
const AdminShipping = lazy(() => import("./pages/admin/AdminShipping"));
const AdminSupport = lazy(() => import("./pages/admin/AdminSupport"));
const AdminApiKeys = lazy(() => import("./pages/admin/AdminApiKeys"));
const AdminAISettings = lazy(() => import("./pages/admin/AdminAISettings"));
const AdminUserPromos = lazy(() => import("./pages/admin/AdminUserPromos"));
const AdminDeliveryOffers = lazy(() => import("./pages/admin/AdminDeliveryOffers"));
const AdminCmsPages = lazy(() => import("./pages/admin/AdminCmsPages"));
const AdminLanding = lazy(() => import("./pages/admin/AdminLanding"));
const AdminBranding = lazy(() => import("./pages/admin/AdminBranding"));
const AdminMobileUI = lazy(() => import("./pages/admin/AdminMobileUI"));
const AdminCallSettings = lazy(() => import("./pages/admin/AdminCallSettings"));
const AdminFooter = lazy(() => import("./pages/admin/AdminFooter"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      retry: 1,
    },
  },
});

const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const AppContent = () => {
  useDynamicFavicon();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
          <CurrencyProvider>
          <LayoutProvider>
          <SiteThemeProvider />
          <AppContent />
          <Suspense fallback={null}>
            <AIChatWidget />
            <PromoPopup />
          </Suspense>
          <Suspense fallback={<PageFallback />}>
          <Routes>
            {/* Landing page without persistent nav */}
            <Route path="/" element={<LandingPage />} />

            {/* All pages with persistent Navbar + Footer */}
            <Route element={<MainLayout />}>
              <Route path="/home" element={<HomePage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/categories/:slug" element={<CategoryPage />} />
              <Route path="/product/:slug" element={<ProductDetailPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
              <Route path="/page/:slug" element={<CmsPage />} />
            </Route>

            {/* Admin routes */}
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
              <Route path="mobile-ui" element={<AdminMobileUI />} />
              <Route path="call-settings" element={<AdminCallSettings />} />
              <Route path="footer" element={<AdminFooter />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          </LayoutProvider>
          </CurrencyProvider>
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
