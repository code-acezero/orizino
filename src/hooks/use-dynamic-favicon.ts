import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useDynamicFavicon = () => {
  const { data: siteSettings } = useQuery({
    queryKey: ["site-settings-favicon"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["site_icon_url", "site_name"]);
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
    const iconUrl = siteSettings?.site_icon_url as string;
    const siteName = siteSettings?.site_name as string;

    // Update favicon
    if (iconUrl) {
      let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = iconUrl;
      link.type = iconUrl.endsWith(".svg") ? "image/svg+xml" : "image/png";
    }

    // Update document title if site name available and no SEO hook has set it
    if (siteName && !document.title.includes("|")) {
      document.title = siteName;
    }
  }, [siteSettings]);
};
