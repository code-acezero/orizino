import React, { Suspense, lazy, useState, useEffect } from "react";
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
const LiveTrackingPage = lazy(() => import("./pages/LiveTrackingPage"));
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
const AdminCouriers = lazy(() => import("./pages/admin/AdminCouriers"));
const AdminCourierManagement = lazy(() => import("./pages/admin/AdminCourierManagement"));
const AdminAISettings = lazy(() => import("./pages/admin/AdminAISettings"));
const AdminUserPromos = lazy(() => import("./pages/admin/AdminUserPromos"));
const AdminDeliveryOffers = lazy(() => import("./pages/admin/AdminDeliveryOffers"));
const AdminCmsPages = lazy(() => import("./pages/admin/AdminCmsPages"));
const AdminLanding = lazy(() => import("./pages/admin/AdminLanding"));
const AdminBranding = lazy(() => import("./pages/admin/AdminBranding"));
const AdminMobileUI = lazy(() => import("./pages/admin/AdminMobileUI"));
const AdminCallSettings = lazy(() => import("./pages/admin/AdminCallSettings"));
const AdminFooter = lazy(() => import("./pages/admin/AdminFooter"));
const AdminPaymentGateways = lazy(() => import("./pages/admin/AdminPaymentGateways"));
const AdminReturns = lazy(() => import("./pages/admin/AdminReturns"));
const AdminTracking = lazy(() => import("./pages/admin/AdminTracking"));
const AdminDebug = lazy(() => import("./pages/admin/AdminDebug"));


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

const LogoLoader = lazy(() => import("./components/LogoLoader"));

const PageFallback = () => (
  <div className="flex-1 flex items-center justify-center py-20">
    <Suspense fallback={null}>
      <LogoLoader size={48} />
    </Suspense>
  </div>
);

const SplashScreen = lazy(() => import("./components/SplashScreen"));

const AppContent = () => {
  useDynamicFavicon();
  return null;
};

const useSplash = () => {
  const [show, setShow] = useState(true);
  const [contentReady, setContentReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 2200);
    const t2 = setTimeout(() => setContentReady(true), 600);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, []);
  return { show, contentReady };
};

const App = () => {
  const { show: splash, contentReady } = useSplash();
  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
          <CurrencyProvider>
          <LayoutProvider>
          <Suspense fallback={null}>
            <SplashScreen visible={splash} />
          </Suspense>
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
              <Route path="/orders/:id/track" element={<ProtectedRoute><Suspense fallback={<PageFallback />}><LiveTrackingPage /></Suspense></ProtectedRoute>} />
              <Route path="/page/:slug" element={<Suspense fallback={<PageFallback />}><CmsPage /></Suspense>} />
            </Route>

            {/* Admin routes — layout is eagerly loaded, child pages lazy */}
            <Route
              path="/origin"
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
              <Route path="debug" element={<Suspense fallback={<PageFallback />}><AdminDebug /></Suspense>} />
              <Route path="couriers" element={<Suspense fallback={<PageFallback />}><AdminCouriers /></Suspense>} />
              <Route path="courier-management" element={<Suspense fallback={<PageFallback />}><AdminCourierManagement /></Suspense>} />
              <Route path="ai-settings" element={<Suspense fallback={<PageFallback />}><AdminAISettings /></Suspense>} />
              <Route path="user-promos" element={<Suspense fallback={<PageFallback />}><AdminUserPromos /></Suspense>} />
              <Route path="delivery-offers" element={<Suspense fallback={<PageFallback />}><AdminDeliveryOffers /></Suspense>} />
              <Route path="cms-pages" element={<Suspense fallback={<PageFallback />}><AdminCmsPages /></Suspense>} />
              <Route path="landing" element={<Suspense fallback={<PageFallback />}><AdminLanding /></Suspense>} />
              <Route path="branding" element={<Suspense fallback={<PageFallback />}><AdminBranding /></Suspense>} />
              <Route path="mobile-ui" element={<Suspense fallback={<PageFallback />}><AdminMobileUI /></Suspense>} />
              <Route path="call-settings" element={<Suspense fallback={<PageFallback />}><AdminCallSettings /></Suspense>} />
              <Route path="footer" element={<Suspense fallback={<PageFallback />}><AdminFooter /></Suspense>} />
              <Route path="payment-gateways" element={<Suspense fallback={<PageFallback />}><AdminPaymentGateways /></Suspense>} />
              <Route path="returns" element={<Suspense fallback={<PageFallback />}><AdminReturns /></Suspense>} />
              <Route path="tracking" element={<Suspense fallback={<PageFallback />}><AdminTracking /></Suspense>} />
              <Route path="pathao" element={<Suspense fallback={<PageFallback />}><AdminCouriers /></Suspense>} />
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
};

export default App;
