import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const SiteThemeProvider = () => {
  const qc = useQueryClient();

  const { data: siteSettings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["site_theme", "site_mode"]);
      if (error) {
        console.error("[SiteThemeProvider] Query error:", error);
        return null;
      }
      const map: Record<string, string> = {};
      data?.forEach((s) => {
        const val = s.value;
        const resolved = typeof val === "object" && val !== null ? (val as any).value ?? val : val;
        map[s.key] = String(resolved ?? "");
      });
      console.log("[SiteThemeProvider] Fetched settings:", map);
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
    
    const html = document.documentElement;
    
    // Remove all theme-* classes
    const currentClasses = Array.from(html.classList);
    currentClasses.forEach(cls => {
      if (cls.startsWith("theme-")) html.classList.remove(cls);
    });
    html.classList.remove("light", "dark");
    
    // Apply mode
    if (mode === "light") {
      html.classList.add("light");
    }
    
    // Apply theme
    if (theme && theme !== "default") {
      html.classList.add(`theme-${theme}`);
    }
    
    console.log("[SiteThemeProvider] Applied theme:", theme, "mode:", mode, "classes:", html.className);
  }, [siteSettings]);

  // Listen for realtime changes to site_settings and invalidate ALL related queries
  useEffect(() => {
    const channel = supabase
      .channel("site-settings-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_settings" },
        () => {
          console.log("[SiteThemeProvider] Realtime update detected");
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
