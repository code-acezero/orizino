import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface LangDef {
  code: string;
  label: string;
  nativeLabel: string;
  dir: "ltr" | "rtl";
}

export const ALL_LANGUAGES: LangDef[] = [
  { code: "en", label: "English", nativeLabel: "English", dir: "ltr" },
  { code: "bn", label: "Bengali", nativeLabel: "বাংলা", dir: "ltr" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी", dir: "ltr" },
  { code: "ur", label: "Urdu", nativeLabel: "اردو", dir: "rtl" },
  { code: "ar", label: "Arabic", nativeLabel: "العربية", dir: "rtl" },
  { code: "ja", label: "Japanese", nativeLabel: "日本語", dir: "ltr" },
  { code: "zh", label: "Chinese", nativeLabel: "中文", dir: "ltr" },
  { code: "ko", label: "Korean", nativeLabel: "한국어", dir: "ltr" },
  { code: "es", label: "Spanish", nativeLabel: "Español", dir: "ltr" },
  { code: "fr", label: "French", nativeLabel: "Français", dir: "ltr" },
  { code: "de", label: "German", nativeLabel: "Deutsch", dir: "ltr" },
  { code: "pt", label: "Portuguese", nativeLabel: "Português", dir: "ltr" },
  { code: "ru", label: "Russian", nativeLabel: "Русский", dir: "ltr" },
  { code: "tr", label: "Turkish", nativeLabel: "Türkçe", dir: "ltr" },
  { code: "id", label: "Indonesian", nativeLabel: "Bahasa Indonesia", dir: "ltr" },
  { code: "th", label: "Thai", nativeLabel: "ไทย", dir: "ltr" },
  { code: "vi", label: "Vietnamese", nativeLabel: "Tiếng Việt", dir: "ltr" },
  { code: "ms", label: "Malay", nativeLabel: "Bahasa Melayu", dir: "ltr" },
  { code: "fa", label: "Persian", nativeLabel: "فارسی", dir: "rtl" },
  { code: "it", label: "Italian", nativeLabel: "Italiano", dir: "ltr" },
  { code: "nl", label: "Dutch", nativeLabel: "Nederlands", dir: "ltr" },
  { code: "pl", label: "Polish", nativeLabel: "Polski", dir: "ltr" },
  { code: "sv", label: "Swedish", nativeLabel: "Svenska", dir: "ltr" },
];

// Static English UI strings — translations loaded dynamically
const EN_STRINGS: Record<string, string> = {
  "nav.home": "Home",
  "nav.shop": "Shop",
  "nav.cart": "Cart",
  "nav.wishlist": "Wishlist",
  "nav.orders": "Orders",
  "nav.profile": "Profile",
  "nav.settings": "Settings",
  "nav.signIn": "Sign In",
  "nav.signOut": "Sign Out",
  "nav.search": "Search products...",
  "nav.categories": "Categories",
  "nav.support": "Support",
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.delete": "Delete",
  "common.edit": "Edit",
  "common.add": "Add",
  "common.loading": "Loading...",
  "common.noResults": "No results found",
  "common.viewAll": "View All",
  "common.addToCart": "Add to Cart",
  "common.buyNow": "Buy Now",
  "common.outOfStock": "Out of Stock",
  "common.inStock": "In Stock",
  "common.price": "Price",
  "common.quantity": "Quantity",
  "common.total": "Total",
  "common.search": "Search",
  "common.back": "Back",
  "common.next": "Next",
  "common.submit": "Submit",
  "common.confirm": "Confirm",
  "common.close": "Close",
  "common.share": "Share",
  "common.review": "Review",
  "common.reviews": "Reviews",
  "common.description": "Description",
  "common.specifications": "Specifications",
  "common.relatedProducts": "Related Products",
  "settings.appearance": "Appearance",
  "settings.notifications": "Notifications",
  "settings.security": "Security",
  "settings.general": "General",
  "settings.language": "Language",
  "settings.currency": "Currency",
  "settings.darkMode": "Dark Mode",
  "profile.personalInfo": "Personal Information",
  "profile.addresses": "Addresses",
  "profile.payments": "Payments",
  "profile.reviews": "Reviews",
  "profile.myOrders": "My Orders",
  "profile.editProfile": "Edit Profile",
  "checkout.address": "Shipping Address",
  "checkout.payment": "Payment Method",
  "checkout.review": "Review Order",
  "checkout.placeOrder": "Place Order",
  "checkout.subtotal": "Subtotal",
  "checkout.shipping": "Shipping",
  "checkout.discount": "Discount",
  "checkout.orderTotal": "Order Total",
  "checkout.orderPlaced": "Order Placed!",
  "cart.empty": "Your cart is empty",
  "cart.continueShopping": "Continue Shopping",
  "cart.checkout": "Checkout",
  "wishlist.empty": "Your wishlist is empty",
  "wishlist.addedToCart": "Added to cart",
  "order.pending": "Pending",
  "order.processing": "Processing",
  "order.shipped": "Shipped",
  "order.delivered": "Delivered",
  "order.cancelled": "Cancelled",
  "order.trackOrder": "Track Order",
  "footer.subscribe": "Subscribe",
  "footer.privacyPolicy": "Privacy Policy",
  "footer.termsOfService": "Terms of Service",
  "footer.stayAhead": "Stay ahead",
  "footer.getLatest": "Get the latest drops",
};

// Basic translation mappings for key languages
const TRANSLATIONS: Record<string, Record<string, string>> = {
  bn: {
    "nav.home": "হোম", "nav.shop": "শপ", "nav.cart": "কার্ট", "nav.wishlist": "ইচ্ছা তালিকা",
    "nav.orders": "অর্ডার", "nav.profile": "প্রোফাইল", "nav.settings": "সেটিংস",
    "nav.signIn": "সাইন ইন", "nav.signOut": "সাইন আউট", "nav.search": "পণ্য খুঁজুন...",
    "common.save": "সংরক্ষণ", "common.cancel": "বাতিল", "common.delete": "মুছুন",
    "common.edit": "সম্পাদনা", "common.add": "যোগ করুন", "common.loading": "লোড হচ্ছে...",
    "common.addToCart": "কার্টে যোগ করুন", "common.buyNow": "এখনই কিনুন",
    "common.outOfStock": "স্টক নেই", "common.inStock": "স্টকে আছে",
    "settings.appearance": "থিম", "settings.notifications": "নোটিফিকেশন",
    "settings.security": "নিরাপত্তা", "settings.general": "সাধারণ",
    "settings.language": "ভাষা", "settings.currency": "মুদ্রা", "settings.darkMode": "ডার্ক মোড",
    "checkout.placeOrder": "অর্ডার করুন",
  },
  hi: {
    "nav.home": "होम", "nav.shop": "शॉप", "nav.cart": "कार्ट", "nav.wishlist": "इच्छा सूची",
    "nav.orders": "ऑर्डर", "nav.profile": "प्रोफ़ाइल", "nav.settings": "सेटिंग्स",
    "nav.signIn": "साइन इन", "nav.signOut": "साइन आउट", "nav.search": "उत्पाद खोजें...",
    "common.save": "सहेजें", "common.cancel": "रद्द करें", "common.addToCart": "कार्ट में डालें",
    "settings.language": "भाषा", "settings.currency": "मुद्रा",
    "checkout.placeOrder": "ऑर्डर दें",
  },
  ur: {
    "nav.home": "ہوم", "nav.shop": "شاپ", "nav.cart": "کارٹ", "nav.wishlist": "خواہش کی فہرست",
    "nav.signIn": "سائن ان", "nav.signOut": "سائن آؤٹ", "nav.search": "مصنوعات تلاش کریں...",
    "common.save": "محفوظ کریں", "common.cancel": "منسوخ",
    "settings.language": "زبان", "settings.currency": "کرنسی",
  },
  ja: {
    "nav.home": "ホーム", "nav.shop": "ショップ", "nav.cart": "カート", "nav.wishlist": "ウィッシュリスト",
    "nav.orders": "注文", "nav.profile": "プロフィール", "nav.settings": "設定",
    "nav.signIn": "ログイン", "nav.signOut": "ログアウト", "nav.search": "商品を検索...",
    "common.save": "保存", "common.cancel": "キャンセル", "common.addToCart": "カートに追加",
    "settings.language": "言語", "settings.currency": "通貨",
    "checkout.placeOrder": "注文する",
  },
  zh: {
    "nav.home": "首页", "nav.shop": "商店", "nav.cart": "购物车", "nav.wishlist": "愿望清单",
    "nav.orders": "订单", "nav.profile": "个人资料", "nav.settings": "设置",
    "nav.signIn": "登录", "nav.signOut": "退出", "nav.search": "搜索商品...",
    "common.save": "保存", "common.cancel": "取消", "common.addToCart": "加入购物车",
    "settings.language": "语言", "settings.currency": "货币",
    "checkout.placeOrder": "下单",
  },
  ko: {
    "nav.home": "홈", "nav.shop": "쇼핑", "nav.cart": "장바구니", "nav.wishlist": "위시리스트",
    "nav.orders": "주문", "nav.profile": "프로필", "nav.settings": "설정",
    "nav.signIn": "로그인", "nav.signOut": "로그아웃", "nav.search": "상품 검색...",
    "common.save": "저장", "common.cancel": "취소", "common.addToCart": "장바구니에 담기",
    "settings.language": "언어", "settings.currency": "통화",
    "checkout.placeOrder": "주문하기",
  },
  ar: {
    "nav.home": "الرئيسية", "nav.shop": "المتجر", "nav.cart": "السلة", "nav.wishlist": "المفضلة",
    "nav.signIn": "تسجيل الدخول", "nav.signOut": "تسجيل الخروج", "nav.search": "ابحث عن منتجات...",
    "common.save": "حفظ", "common.cancel": "إلغاء", "common.addToCart": "أضف إلى السلة",
    "settings.language": "اللغة", "settings.currency": "العملة",
    "checkout.placeOrder": "تقديم الطلب",
  },
};

interface LanguageContextType {
  language: string;
  setLanguage: (code: string) => void;
  t: (key: string) => string;
  dir: "ltr" | "rtl";
  allLanguages: LangDef[];
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key) => key,
  dir: "ltr",
  allLanguages: ALL_LANGUAGES,
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState("en");
  const { user } = useAuth();

  // Load from preferences
  useEffect(() => {
    const saved = localStorage.getItem("preferred_language");
    if (saved) {
      setLanguageState(saved);
      return;
    }
    if (!user) return;
    supabase.from("profiles").select("preferences").eq("id", user.id).single().then(({ data }) => {
      const lang = (data?.preferences as any)?.language;
      if (lang) setLanguageState(lang);
    });
  }, [user]);

  // Update dir on html element
  useEffect(() => {
    const langDef = ALL_LANGUAGES.find((l) => l.code === language);
    document.documentElement.dir = langDef?.dir || "ltr";
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((code: string) => {
    setLanguageState(code);
    localStorage.setItem("preferred_language", code);
    if (user) {
      supabase.from("profiles").select("preferences").eq("id", user.id).single().then(({ data }) => {
        const prefs = (data?.preferences as any) || {};
        supabase.from("profiles").update({ preferences: { ...prefs, language: code } }).eq("id", user.id);
      });
    }
  }, [user]);

  const t = useCallback((key: string): string => {
    if (language === "en") return EN_STRINGS[key] || key;
    return TRANSLATIONS[language]?.[key] || EN_STRINGS[key] || key;
  }, [language]);

  const dir = ALL_LANGUAGES.find((l) => l.code === language)?.dir || "ltr";

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir, allLanguages: ALL_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;
