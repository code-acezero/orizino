import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const SiteThemeProvider = () => {
  const { data: siteSettings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("key, value").in("key", ["site_theme", "site_mode"]);
      const map: Record<string, any> = {};
      data?.forEach((s) => {
        const val = s.value;
        map[s.key] = typeof val === "object" && val !== null ? (val as any).value ?? val : val;
      });
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!siteSettings) return;
    const mode = (siteSettings.site_mode as string) || "dark";
    const theme = (siteSettings.site_theme as string) || "default";

    document.documentElement.classList.toggle("light", mode === "light");
    document.documentElement.className = document.documentElement.className.replace(/theme-\w+/g, "");
    if (theme !== "default") document.documentElement.classList.add(`theme-${theme}`);
  }, [siteSettings]);

  return null;
};

export default SiteThemeProvider;
