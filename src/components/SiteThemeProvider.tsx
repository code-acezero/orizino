import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const applyTheme = (mode: string, theme: string) => {
  const html = document.documentElement;
  // Remove old theme/mode classes
  html.classList.remove("light");
  html.className = html.className.replace(/\btheme-\w+/g, "").trim();
  
  if (mode === "light") html.classList.add("light");
  if (theme && theme !== "default") html.classList.add(`theme-${theme}`);
};

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

  // Apply theme whenever settings change
  useEffect(() => {
    if (!siteSettings) return;
    const mode = siteSettings.site_mode || "dark";
    const theme = siteSettings.site_theme || "default";
    applyTheme(mode, theme);
  }, [siteSettings]);

  // Listen for realtime changes to site_settings and invalidate ALL related queries
  useEffect(() => {
    const channel = supabase
      .channel("site-settings-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_settings" },
        () => {
          // Invalidate theme queries
          qc.invalidateQueries({ queryKey: ["site-settings"] });
          qc.invalidateQueries({ queryKey: ["site-settings-nav"] });
          qc.invalidateQueries({ queryKey: ["admin-settings"] });
          // Invalidate home page content queries
          qc.invalidateQueries({ queryKey: ["home-category-sections"] });
          qc.invalidateQueries({ queryKey: ["home-sales-config"] });
          qc.invalidateQueries({ queryKey: ["home-new-arrivals"] });
          qc.invalidateQueries({ queryKey: ["sale-products"] });
          qc.invalidateQueries({ queryKey: ["home-section-products"] });
          qc.invalidateQueries({ queryKey: ["home-section-categories"] });
          // Showcase config
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
