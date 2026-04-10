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
  <div className="flex-1 flex items-center justify-center py-20">
    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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
          <Routes>
            {/* Landing page without persistent nav */}
            <Route path="/" element={<LandingPage />} />

            {/* All pages with persistent Navbar + Footer */}
            <Route element={<MainLayout />}>
              <Route path="/home" element={<HomePage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/reset-password" element={<Suspense fallback={<PageFallback />}><ResetPasswordPage /></Suspense>} />
              <Route path="/shop" element={<Suspense fallback={<PageFallback />}><ShopPage /></Suspense>} />
              <Route path="/categories/:slug" element={<Suspense fallback={<PageFallback />}><CategoryPage /></Suspense>} />
              <Route path="/product/:slug" element={<Suspense fallback={<PageFallback />}><ProductDetailPage /></Suspense>} />
              <Route path="/cart" element={<Suspense fallback={<PageFallback />}><CartPage /></Suspense>} />
              <Route path="/wishlist" element={<Suspense fallback={<PageFallback />}><WishlistPage /></Suspense>} />
              <Route path="/support" element={<Suspense fallback={<PageFallback />}><SupportPage /></Suspense>} />
              <Route path="/profile" element={<ProtectedRoute><Suspense fallback={<PageFallback />}><ProfilePage /></Suspense></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Suspense fallback={<PageFallback />}><SettingsPage /></Suspense></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute><Suspense fallback={<PageFallback />}><CheckoutPage /></Suspense></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><Suspense fallback={<PageFallback />}><OrdersPage /></Suspense></ProtectedRoute>} />
              <Route path="/page/:slug" element={<Suspense fallback={<PageFallback />}><CmsPage /></Suspense>} />
            </Route>

            {/* Admin routes — layout is eagerly loaded, child pages lazy */}
            <Route
              path="/admin"
              element={<AdminRoute><AdminLayout /></AdminRoute>}
            >
              <Route index element={<Suspense fallback={<PageFallback />}><AdminDashboard /></Suspense>} />
              <Route path="products" element={<Suspense fallback={<PageFallback />}><AdminProducts /></Suspense>} />
              <Route path="categories" element={<Suspense fallback={<PageFallback />}><AdminCategories /></Suspense>} />
              <Route path="orders" element={<Suspense fallback={<PageFallback />}><AdminOrders /></Suspense>} />
              <Route path="users" element={<Suspense fallback={<PageFallback />}><AdminUsers /></Suspense>} />
              <Route path="reviews" element={<Suspense fallback={<PageFallback />}><AdminReviews /></Suspense>} />
              <Route path="banners" element={<Suspense fallback={<PageFallback />}><AdminBanners /></Suspense>} />
              <Route path="requests" element={<Suspense fallback={<PageFallback />}><AdminRequests /></Suspense>} />
              <Route path="settings" element={<Suspense fallback={<PageFallback />}><AdminSettings /></Suspense>} />
              <Route path="showcase" element={<Suspense fallback={<PageFallback />}><AdminShowcase /></Suspense>} />
              <Route path="home" element={<Suspense fallback={<PageFallback />}><AdminHome /></Suspense>} />
              <Route path="announcements" element={<Suspense fallback={<PageFallback />}><AdminAnnouncements /></Suspense>} />
              <Route path="coupons" element={<Suspense fallback={<PageFallback />}><AdminCoupons /></Suspense>} />
              <Route path="shipping" element={<Suspense fallback={<PageFallback />}><AdminShipping /></Suspense>} />
              <Route path="support" element={<Suspense fallback={<PageFallback />}><AdminSupport /></Suspense>} />
              <Route path="api-keys" element={<Suspense fallback={<PageFallback />}><AdminApiKeys /></Suspense>} />
              <Route path="ai-settings" element={<Suspense fallback={<PageFallback />}><AdminAISettings /></Suspense>} />
              <Route path="user-promos" element={<Suspense fallback={<PageFallback />}><AdminUserPromos /></Suspense>} />
              <Route path="delivery-offers" element={<Suspense fallback={<PageFallback />}><AdminDeliveryOffers /></Suspense>} />
              <Route path="cms-pages" element={<Suspense fallback={<PageFallback />}><AdminCmsPages /></Suspense>} />
              <Route path="landing" element={<Suspense fallback={<PageFallback />}><AdminLanding /></Suspense>} />
              <Route path="branding" element={<Suspense fallback={<PageFallback />}><AdminBranding /></Suspense>} />
              <Route path="mobile-ui" element={<Suspense fallback={<PageFallback />}><AdminMobileUI /></Suspense>} />
              <Route path="call-settings" element={<Suspense fallback={<PageFallback />}><AdminCallSettings /></Suspense>} />
              <Route path="footer" element={<Suspense fallback={<PageFallback />}><AdminFooter /></Suspense>} />
            </Route>

            <Route path="*" element={<Suspense fallback={<PageFallback />}><NotFound /></Suspense>} />
          </Routes>
          </LayoutProvider>
          </CurrencyProvider>
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
