import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const SiteThemeProvider = () => {
  const qc = useQueryClient();

  const { data: siteSettings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["site_theme", "site_mode"]);
      const map: Record<string, any> = {};
      data?.forEach((s) => {
        const val = s.value;
        map[s.key] = typeof val === "object" && val !== null ? (val as any).value ?? val : val;
      });
      return map;
    },
    staleTime: 30 * 1000, // shorter stale time so theme changes propagate faster
  });

  useEffect(() => {
    if (!siteSettings) return;
    const mode = (siteSettings.site_mode as string) || "dark";
    const theme = (siteSettings.site_theme as string) || "default";

    const html = document.documentElement;
    // Remove all theme classes first
    const cleanedClasses = html.className
      .replace(/theme-\w+/g, "")
      .replace(/\blight\b/g, "")
      .replace(/\bdark\b/g, "")
      .trim();
    
    const newClasses = [cleanedClasses];
    if (mode === "light") newClasses.push("light");
    if (theme !== "default") newClasses.push(`theme-${theme}`);
    html.className = newClasses.filter(Boolean).join(" ");
  }, [siteSettings]);

  // Listen for realtime changes to site_settings
  useEffect(() => {
    const channel = supabase
      .channel("site-settings-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_settings" },
        () => {
          qc.invalidateQueries({ queryKey: ["site-settings"] });
          qc.invalidateQueries({ queryKey: ["site-settings-nav"] });
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
