import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Theme variable overrides - applied as inline styles for guaranteed specificity
const themeOverrides: Record<string, Record<string, string>> = {
  ocean: {
    "--primary": "200 90% 50%",
    "--accent": "240 70% 60%",
    "--ring": "200 90% 50%",
    "--gradient-primary": "linear-gradient(135deg, hsl(200 90% 50%), hsl(220 80% 55%))",
    "--gradient-accent": "linear-gradient(135deg, hsl(240 70% 60%), hsl(260 60% 55%))",
    "--gradient-glow": "radial-gradient(ellipse at center, hsl(200 90% 50% / 0.15), transparent 70%)",
    "--sidebar-primary": "200 90% 50%",
    "--sidebar-ring": "200 90% 50%",
  },
  sunset: {
    "--primary": "25 95% 55%",
    "--accent": "340 80% 55%",
    "--ring": "25 95% 55%",
    "--gradient-primary": "linear-gradient(135deg, hsl(25 95% 55%), hsl(45 90% 55%))",
    "--gradient-accent": "linear-gradient(135deg, hsl(340 80% 55%), hsl(10 80% 50%))",
    "--gradient-glow": "radial-gradient(ellipse at center, hsl(25 95% 55% / 0.15), transparent 70%)",
    "--sidebar-primary": "25 95% 55%",
    "--sidebar-ring": "25 95% 55%",
  },
  rose: {
    "--primary": "340 82% 55%",
    "--accent": "280 60% 55%",
    "--ring": "340 82% 55%",
    "--gradient-primary": "linear-gradient(135deg, hsl(340 82% 55%), hsl(320 70% 50%))",
    "--gradient-accent": "linear-gradient(135deg, hsl(280 60% 55%), hsl(300 50% 50%))",
    "--gradient-glow": "radial-gradient(ellipse at center, hsl(340 82% 55% / 0.15), transparent 70%)",
    "--sidebar-primary": "340 82% 55%",
    "--sidebar-ring": "340 82% 55%",
  },
  violet: {
    "--primary": "270 80% 60%",
    "--accent": "200 80% 55%",
    "--ring": "270 80% 60%",
    "--gradient-primary": "linear-gradient(135deg, hsl(270 80% 60%), hsl(290 70% 55%))",
    "--gradient-accent": "linear-gradient(135deg, hsl(200 80% 55%), hsl(220 70% 55%))",
    "--gradient-glow": "radial-gradient(ellipse at center, hsl(270 80% 60% / 0.15), transparent 70%)",
    "--sidebar-primary": "270 80% 60%",
    "--sidebar-ring": "270 80% 60%",
  },
  crimson: {
    "--primary": "0 85% 55%",
    "--accent": "30 90% 55%",
    "--ring": "0 85% 55%",
    "--gradient-primary": "linear-gradient(135deg, hsl(0 85% 55%), hsl(15 80% 50%))",
    "--gradient-accent": "linear-gradient(135deg, hsl(30 90% 55%), hsl(50 85% 50%))",
    "--gradient-glow": "radial-gradient(ellipse at center, hsl(0 85% 55% / 0.15), transparent 70%)",
    "--sidebar-primary": "0 85% 55%",
    "--sidebar-ring": "0 85% 55%",
  },
  gold: {
    "--primary": "45 90% 50%",
    "--accent": "25 85% 50%",
    "--ring": "45 90% 50%",
    "--gradient-primary": "linear-gradient(135deg, hsl(45 90% 50%), hsl(35 85% 45%))",
    "--gradient-accent": "linear-gradient(135deg, hsl(25 85% 50%), hsl(15 80% 45%))",
    "--gradient-glow": "radial-gradient(ellipse at center, hsl(45 90% 50% / 0.15), transparent 70%)",
    "--sidebar-primary": "45 90% 50%",
    "--sidebar-ring": "45 90% 50%",
  },
  mint: {
    "--primary": "170 70% 45%",
    "--accent": "140 60% 45%",
    "--ring": "170 70% 45%",
    "--gradient-primary": "linear-gradient(135deg, hsl(170 70% 45%), hsl(190 65% 40%))",
    "--gradient-accent": "linear-gradient(135deg, hsl(140 60% 45%), hsl(160 55% 40%))",
    "--gradient-glow": "radial-gradient(ellipse at center, hsl(170 70% 45% / 0.15), transparent 70%)",
    "--sidebar-primary": "170 70% 45%",
    "--sidebar-ring": "170 70% 45%",
  },
};

// Light mode overrides
const lightOverrides: Record<string, string> = {
  "--background": "0 0% 97%",
  "--foreground": "220 20% 10%",
  "--card": "0 0% 100%",
  "--card-foreground": "220 20% 10%",
  "--popover": "0 0% 100%",
  "--popover-foreground": "220 20% 10%",
  "--primary-foreground": "0 0% 100%",
  "--secondary": "220 15% 92%",
  "--secondary-foreground": "220 20% 15%",
  "--muted": "220 15% 94%",
  "--muted-foreground": "215 15% 45%",
  "--border": "220 15% 88%",
  "--input": "220 15% 88%",
  "--glass-bg": "0 0% 100% / 0.7",
  "--glass-border": "220 15% 80% / 0.4",
  "--glass-shadow": "0 8px 32px hsl(0 0% 0% / 0.08)",
  "--sidebar-background": "0 0% 98%",
  "--sidebar-foreground": "220 20% 15%",
  "--sidebar-accent": "220 15% 94%",
  "--sidebar-accent-foreground": "220 20% 15%",
  "--sidebar-border": "220 15% 88%",
};

// All theme variable names for cleanup
const allThemeVars = [
  "--primary", "--accent", "--ring",
  "--gradient-primary", "--gradient-accent", "--gradient-glow",
  "--sidebar-primary", "--sidebar-ring",
  "--background", "--foreground",
  "--card", "--card-foreground",
  "--popover", "--popover-foreground",
  "--primary-foreground",
  "--secondary", "--secondary-foreground",
  "--muted", "--muted-foreground",
  "--border", "--input",
  "--glass-bg", "--glass-border", "--glass-shadow",
  "--sidebar-background", "--sidebar-foreground",
  "--sidebar-accent", "--sidebar-accent-foreground",
  "--sidebar-border",
];

const SiteThemeProvider = () => {
  const qc = useQueryClient();

  const { data: siteSettings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["site_theme", "site_mode"]);
      const map: Record<string, string> = {};
      data?.forEach((s) => {
        const val = s.value;
        const resolved = typeof val === "object" && val !== null ? (val as any).value ?? val : val;
        map[s.key] = String(resolved ?? "");
      });
      return map;
    },
    staleTime: 5 * 1000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  // Apply theme via inline CSS custom properties on html element
  useEffect(() => {
    if (!siteSettings) return;
    const mode = siteSettings.site_mode || "dark";
    const theme = siteSettings.site_theme || "default";
    const html = document.documentElement;

    // Clear all previously set inline theme variables
    allThemeVars.forEach((v) => html.style.removeProperty(v));

    // Apply light mode overrides
    if (mode === "light") {
      html.classList.add("light");
      Object.entries(lightOverrides).forEach(([k, v]) => html.style.setProperty(k, v));
    } else {
      html.classList.remove("light");
    }

    // Apply color theme overrides
    if (theme !== "default" && themeOverrides[theme]) {
      Object.entries(themeOverrides[theme]).forEach(([k, v]) => html.style.setProperty(k, v));
    }
  }, [siteSettings]);

  // Listen for realtime changes to site_settings and invalidate ALL related queries
  useEffect(() => {
    const channel = supabase
      .channel("site-settings-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_settings" },
        () => {
          qc.invalidateQueries({ queryKey: ["site-settings"] });
          qc.invalidateQueries({ queryKey: ["site-settings-nav"] });
          qc.invalidateQueries({ queryKey: ["admin-settings"] });
          qc.invalidateQueries({ queryKey: ["home-category-sections"] });
          qc.invalidateQueries({ queryKey: ["home-sales-config"] });
          qc.invalidateQueries({ queryKey: ["home-new-arrivals"] });
          qc.invalidateQueries({ queryKey: ["sale-products"] });
          qc.invalidateQueries({ queryKey: ["home-section-products"] });
          qc.invalidateQueries({ queryKey: ["home-section-categories"] });
          qc.invalidateQueries({ queryKey: ["showcase-config"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return null;
};

export default SiteThemeProvider;
