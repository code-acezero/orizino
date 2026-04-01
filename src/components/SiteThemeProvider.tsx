import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/* ── 20 Gradient Theme Groups ── */
const themeOverrides: Record<string, Record<string, string>> = {
  ocean: {
    "--primary": "200 90% 50%", "--accent": "220 80% 55%", "--ring": "200 90% 50%",
    "--gradient-primary": "linear-gradient(135deg, hsl(200 90% 50%), hsl(220 80% 55%))",
    "--gradient-accent": "linear-gradient(135deg, hsl(220 80% 55%), hsl(240 70% 60%))",
    "--gradient-glow": "radial-gradient(ellipse at center, hsl(200 90% 50% / 0.15), transparent 70%)",
    "--sidebar-primary": "200 90% 50%", "--sidebar-ring": "200 90% 50%",
  },
  sunset: {
    "--primary": "25 95% 55%", "--accent": "340 80% 55%", "--ring": "25 95% 55%",
    "--gradient-primary": "linear-gradient(135deg, hsl(25 95% 55%), hsl(45 90% 55%))",
    "--gradient-accent": "linear-gradient(135deg, hsl(340 80% 55%), hsl(10 80% 50%))",
    "--gradient-glow": "radial-gradient(ellipse at center, hsl(25 95% 55% / 0.15), transparent 70%)",
    "--sidebar-primary": "25 95% 55%", "--sidebar-ring": "25 95% 55%",
  },
  rose: {
    "--primary": "340 82% 55%", "--accent": "320 70% 50%", "--ring": "340 82% 55%",
    "--gradient-primary": "linear-gradient(135deg, hsl(340 82% 55%), hsl(320 70% 50%))",
    "--gradient-accent": "linear-gradient(135deg, hsl(320 70% 50%), hsl(300 60% 50%))",
    "--gradient-glow": "radial-gradient(ellipse at center, hsl(340 82% 55% / 0.15), transparent 70%)",
    "--sidebar-primary": "340 82% 55%", "--sidebar-ring": "340 82% 55%",
  },
  violet: {
    "--primary": "270 80% 60%", "--accent": "290 70% 55%", "--ring": "270 80% 60%",
    "--gradient-primary": "linear-gradient(135deg, hsl(270 80% 60%), hsl(290 70% 55%))",
    "--gradient-accent": "linear-gradient(135deg, hsl(290 70% 55%), hsl(310 60% 50%))",
    "--gradient-glow": "radial-gradient(ellipse at center, hsl(270 80% 60% / 0.15), transparent 70%)",
    "--sidebar-primary": "270 80% 60%", "--sidebar-ring": "270 80% 60%",
  },
  crimson: {
    "--primary": "0 85% 55%", "--accent": "15 80% 50%", "--ring": "0 85% 55%",
    "--gradient-primary": "linear-gradient(135deg, hsl(0 85% 55%), hsl(15 80% 50%))",
    "--gradient-accent": "linear-gradient(135deg, hsl(15 80% 50%), hsl(30 90% 55%))",
    "--gradient-glow": "radial-gradient(ellipse at center, hsl(0 85% 55% / 0.15), transparent 70%)",
    "--sidebar-primary": "0 85% 55%", "--sidebar-ring": "0 85% 55%",
  },
  gold: {
    "--primary": "45 90% 50%", "--accent": "35 85% 45%", "--ring": "45 90% 50%",
    "--gradient-primary": "linear-gradient(135deg, hsl(45 90% 50%), hsl(35 85% 45%))",
    "--gradient-accent": "linear-gradient(135deg, hsl(35 85% 45%), hsl(25 80% 45%))",
    "--gradient-glow": "radial-gradient(ellipse at center, hsl(45 90% 50% / 0.15), transparent 70%)",
    "--sidebar-primary": "45 90% 50%", "--sidebar-ring": "45 90% 50%",
  },
  mint: {
    "--primary": "170 70% 45%", "--accent": "150 60% 40%", "--ring": "170 70% 45%",
    "--gradient-primary": "linear-gradient(135deg, hsl(170 70% 45%), hsl(150 60% 40%))",
    "--gradient-accent": "linear-gradient(135deg, hsl(150 60% 40%), hsl(140 55% 40%))",
    "--gradient-glow": "radial-gradient(ellipse at center, hsl(170 70% 45% / 0.15), transparent 70%)",
    "--sidebar-primary": "170 70% 45%", "--sidebar-ring": "170 70% 45%",
  },
  aurora: {
    "--primary": "160 85% 45%", "--accent": "200 80% 55%", "--ring": "160 85% 45%",
    "--gradient-primary": "linear-gradient(135deg, hsl(160 85% 45%), hsl(200 80% 55%))",
    "--gradient-accent": "linear-gradient(135deg, hsl(200 80% 55%), hsl(240 70% 60%))",
    "--gradient-glow": "radial-gradient(ellipse at center, hsl(160 85% 45% / 0.12), hsl(240 70% 60% / 0.08), transparent 70%)",
    "--sidebar-primary": "160 85% 45%", "--sidebar-ring": "160 85% 45%",
  },
  neon: {
    "--primary": "120 100% 50%", "--accent": "180 100% 50%", "--ring": "120 100% 50%",
    "--gradient-primary": "linear-gradient(135deg, hsl(120 100% 50%), hsl(180 100% 50%))",
    "--gradient-accent": "linear-gradient(135deg, hsl(180 100% 50%), hsl(240 100% 60%))",
    "--gradient-glow": "radial-gradient(ellipse at center, hsl(120 100% 50% / 0.2), transparent 70%)",
    "--sidebar-primary": "120 100% 50%", "--sidebar-ring": "120 100% 50%",
  },
  lavender: {
    "--primary": "250 60% 65%", "--accent": "280 50% 60%", "--ring": "250 60% 65%",
    "--gradient-primary": "linear-gradient(135deg, hsl(250 60% 65%), hsl(280 50% 60%))",
    "--gradient-accent": "linear-gradient(135deg, hsl(280 50% 60%), hsl(310 45% 60%))",
    "--gradient-glow": "radial-gradient(ellipse at center, hsl(250 60% 65% / 0.15), transparent 70%)",
    "--sidebar-primary": "250 60% 65%", "--sidebar-ring": "250 60% 65%",
  },
  ember: {
    "--primary": "15 90% 50%", "--accent": "0 80% 45%", "--ring": "15 90% 50%",
    "--gradient-primary": "linear-gradient(135deg, hsl(15 90% 50%), hsl(0 80% 45%))",
    "--gradient-accent": "linear-gradient(135deg, hsl(0 80% 45%), hsl(345 75% 45%))",
    "--gradient-glow": "radial-gradient(ellipse at center, hsl(15 90% 50% / 0.18), transparent 70%)",
    "--sidebar-primary": "15 90% 50%", "--sidebar-ring": "15 90% 50%",
  },
  sapphire: {
    "--primary": "220 85% 55%", "--accent": "240 75% 60%", "--ring": "220 85% 55%",
    "--gradient-primary": "linear-gradient(135deg, hsl(220 85% 55%), hsl(240 75% 60%))",
    "--gradient-accent": "linear-gradient(135deg, hsl(240 75% 60%), hsl(260 65% 55%))",
    "--gradient-glow": "radial-gradient(ellipse at center, hsl(220 85% 55% / 0.15), transparent 70%)",
    "--sidebar-primary": "220 85% 55%", "--sidebar-ring": "220 85% 55%",
  },
  coral: {
    "--primary": "10 80% 60%", "--accent": "350 75% 55%", "--ring": "10 80% 60%",
    "--gradient-primary": "linear-gradient(135deg, hsl(10 80% 60%), hsl(350 75% 55%))",
    "--gradient-accent": "linear-gradient(135deg, hsl(350 75% 55%), hsl(330 70% 55%))",
    "--gradient-glow": "radial-gradient(ellipse at center, hsl(10 80% 60% / 0.15), transparent 70%)",
    "--sidebar-primary": "10 80% 60%", "--sidebar-ring": "10 80% 60%",
  },
  arctic: {
    "--primary": "195 85% 55%", "--accent": "210 80% 60%", "--ring": "195 85% 55%",
    "--gradient-primary": "linear-gradient(135deg, hsl(195 85% 55%), hsl(210 80% 60%))",
    "--gradient-accent": "linear-gradient(135deg, hsl(210 80% 60%), hsl(225 75% 55%))",
    "--gradient-glow": "radial-gradient(ellipse at center, hsl(195 85% 55% / 0.12), transparent 70%)",
    "--sidebar-primary": "195 85% 55%", "--sidebar-ring": "195 85% 55%",
  },
  forest: {
    "--primary": "140 65% 40%", "--accent": "160 55% 35%", "--ring": "140 65% 40%",
    "--gradient-primary": "linear-gradient(135deg, hsl(140 65% 40%), hsl(160 55% 35%))",
    "--gradient-accent": "linear-gradient(135deg, hsl(160 55% 35%), hsl(180 50% 35%))",
    "--gradient-glow": "radial-gradient(ellipse at center, hsl(140 65% 40% / 0.15), transparent 70%)",
    "--sidebar-primary": "140 65% 40%", "--sidebar-ring": "140 65% 40%",
  },
  midnight: {
    "--primary": "235 70% 55%", "--accent": "255 60% 50%", "--ring": "235 70% 55%",
    "--gradient-primary": "linear-gradient(135deg, hsl(235 70% 55%), hsl(255 60% 50%))",
    "--gradient-accent": "linear-gradient(135deg, hsl(255 60% 50%), hsl(275 55% 50%))",
    "--gradient-glow": "radial-gradient(ellipse at center, hsl(235 70% 55% / 0.15), transparent 70%)",
    "--sidebar-primary": "235 70% 55%", "--sidebar-ring": "235 70% 55%",
  },
  candy: {
    "--primary": "320 80% 60%", "--accent": "290 70% 55%", "--ring": "320 80% 60%",
    "--gradient-primary": "linear-gradient(135deg, hsl(320 80% 60%), hsl(290 70% 55%))",
    "--gradient-accent": "linear-gradient(135deg, hsl(290 70% 55%), hsl(260 65% 55%))",
    "--gradient-glow": "radial-gradient(ellipse at center, hsl(320 80% 60% / 0.15), transparent 70%)",
    "--sidebar-primary": "320 80% 60%", "--sidebar-ring": "320 80% 60%",
  },
  bronze: {
    "--primary": "30 70% 45%", "--accent": "20 65% 40%", "--ring": "30 70% 45%",
    "--gradient-primary": "linear-gradient(135deg, hsl(30 70% 45%), hsl(20 65% 40%))",
    "--gradient-accent": "linear-gradient(135deg, hsl(20 65% 40%), hsl(10 60% 40%))",
    "--gradient-glow": "radial-gradient(ellipse at center, hsl(30 70% 45% / 0.15), transparent 70%)",
    "--sidebar-primary": "30 70% 45%", "--sidebar-ring": "30 70% 45%",
  },
  plasma: {
    "--primary": "280 90% 60%", "--accent": "310 85% 55%", "--ring": "280 90% 60%",
    "--gradient-primary": "linear-gradient(135deg, hsl(280 90% 60%), hsl(310 85% 55%))",
    "--gradient-accent": "linear-gradient(135deg, hsl(310 85% 55%), hsl(340 80% 55%))",
    "--gradient-glow": "radial-gradient(ellipse at center, hsl(280 90% 60% / 0.18), transparent 70%)",
    "--sidebar-primary": "280 90% 60%", "--sidebar-ring": "280 90% 60%",
  },
  slate: {
    "--primary": "215 25% 50%", "--accent": "220 30% 45%", "--ring": "215 25% 50%",
    "--gradient-primary": "linear-gradient(135deg, hsl(215 25% 50%), hsl(220 30% 45%))",
    "--gradient-accent": "linear-gradient(135deg, hsl(220 30% 45%), hsl(225 25% 40%))",
    "--gradient-glow": "radial-gradient(ellipse at center, hsl(215 25% 50% / 0.12), transparent 70%)",
    "--sidebar-primary": "215 25% 50%", "--sidebar-ring": "215 25% 50%",
  },
};

/* ── Light mode overrides ── */
const lightOverrides: Record<string, string> = {
  "--background": "0 0% 97%", "--foreground": "220 20% 10%",
  "--card": "0 0% 100%", "--card-foreground": "220 20% 10%",
  "--popover": "0 0% 100%", "--popover-foreground": "220 20% 10%",
  "--primary-foreground": "0 0% 100%",
  "--secondary": "220 15% 92%", "--secondary-foreground": "220 20% 15%",
  "--muted": "220 15% 94%", "--muted-foreground": "215 15% 45%",
  "--border": "220 15% 88%", "--input": "220 15% 88%",
  "--glass-bg": "0 0% 100% / 0.7", "--glass-border": "220 15% 80% / 0.4",
  "--glass-shadow": "0 8px 32px hsl(0 0% 0% / 0.08)",
  "--sidebar-background": "0 0% 98%", "--sidebar-foreground": "220 20% 15%",
  "--sidebar-accent": "220 15% 94%", "--sidebar-accent-foreground": "220 20% 15%",
  "--sidebar-border": "220 15% 88%",
};

const allThemeVars = [
  "--primary", "--accent", "--ring",
  "--gradient-primary", "--gradient-accent", "--gradient-glow",
  "--sidebar-primary", "--sidebar-ring",
  "--background", "--foreground", "--card", "--card-foreground",
  "--popover", "--popover-foreground", "--primary-foreground",
  "--secondary", "--secondary-foreground", "--muted", "--muted-foreground",
  "--border", "--input", "--glass-bg", "--glass-border", "--glass-shadow",
  "--sidebar-background", "--sidebar-foreground",
  "--sidebar-accent", "--sidebar-accent-foreground", "--sidebar-border",
];

const customizerVars = [
  "--font-display", "--font-body",
  "--navbar-height", "--section-gap", "--container-max",
  "--content-padding", "--card-padding",
];

const SiteThemeProvider = () => {
  const qc = useQueryClient();

  const { data: siteSettings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["site_theme", "site_mode", "site_customizer"]);
      const map: Record<string, any> = {};
      data?.forEach((s) => {
        const val = s.value;
        const resolved = typeof val === "object" && val !== null ? (val as any).value ?? val : val;
        map[s.key] = resolved;
      });
      return map;
    },
    staleTime: 5 * 1000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!siteSettings) return;
    const mode = String(siteSettings.site_mode || "dark");
    const theme = String(siteSettings.site_theme || "default");
    const html = document.documentElement;

    allThemeVars.forEach((v) => html.style.removeProperty(v));
    customizerVars.forEach((v) => html.style.removeProperty(v));

    if (mode === "light") {
      html.classList.add("light");
      Object.entries(lightOverrides).forEach(([k, v]) => html.style.setProperty(k, v));
    } else {
      html.classList.remove("light");
    }

    if (theme !== "default" && themeOverrides[theme]) {
      Object.entries(themeOverrides[theme]).forEach(([k, v]) => html.style.setProperty(k, v));
    }

    const customizer = siteSettings.site_customizer;
    if (customizer && typeof customizer === "object") {
      const c = customizer as any;
      if (c.heading_font) {
        html.style.setProperty("--font-display", `'${c.heading_font}', sans-serif`);
        loadGoogleFont(c.heading_font, c.heading_weight || "700");
      }
      if (c.body_font) {
        html.style.setProperty("--font-body", `'${c.body_font}', sans-serif`);
        loadGoogleFont(c.body_font, c.body_weight || "400");
      }
      if (c.border_radius != null) html.style.setProperty("--radius", `${c.border_radius}px`);
      if (c.glass_blur != null) html.style.setProperty("--glass-blur", `${c.glass_blur}px`);
      if (c.glass_opacity != null) {
        html.style.setProperty("--glass-bg", `220 20% 12% / ${c.glass_opacity / 100}`);
      }
      if (c.navbar_height) html.style.setProperty("--navbar-height", `${c.navbar_height}px`);
      if (c.section_gap) html.style.setProperty("--section-gap", `${c.section_gap}px`);
      if (c.container_width) html.style.setProperty("--container-max", `${c.container_width}px`);
      if (c.content_padding) html.style.setProperty("--content-padding", `${c.content_padding}px`);
      if (c.card_padding) html.style.setProperty("--card-padding", `${c.card_padding}px`);
      html.dataset.customizer = JSON.stringify(c);
    }
  }, [siteSettings]);

  useEffect(() => {
    const channel = supabase
      .channel("site-settings-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, () => {
        qc.invalidateQueries({ queryKey: ["site-settings"] });
        qc.invalidateQueries({ queryKey: ["site-settings-nav"] });
        qc.invalidateQueries({ queryKey: ["admin-settings"] });
        qc.invalidateQueries({ queryKey: ["site-customizer"] });
        qc.invalidateQueries({ queryKey: ["home-category-sections"] });
        qc.invalidateQueries({ queryKey: ["home-sales-config"] });
        qc.invalidateQueries({ queryKey: ["home-new-arrivals"] });
        qc.invalidateQueries({ queryKey: ["sale-products"] });
        qc.invalidateQueries({ queryKey: ["home-section-products"] });
        qc.invalidateQueries({ queryKey: ["home-section-categories"] });
        qc.invalidateQueries({ queryKey: ["showcase-config"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  return null;
};

/* ── Google Fonts loader ── */
const loadedFonts = new Set<string>();
function loadGoogleFont(family: string, weights: string = "400,500,600,700") {
  const key = `${family}-${weights}`;
  if (loadedFonts.has(key)) return;
  loadedFonts.add(key);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@${weights.split(",").concat(["300","400","500","600","700"]).filter((v, i, a) => a.indexOf(v) === i).join(";")}&display=swap`;
  document.head.appendChild(link);
}

export default SiteThemeProvider;
