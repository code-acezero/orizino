import { supabase } from "@/integrations/supabase/client";

export interface IceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export async function getIceServers(): Promise<IceServerConfig[]> {
  const servers: IceServerConfig[] = [];

  try {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "voice_call_config")
      .maybeSingle();

    const config = (data?.value as any) || {};

    // STUN (primary)
    if (config.stun_enabled !== false) {
      const urls = config.stun_urls?.length
        ? config.stun_urls
        : ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"];
      servers.push({ urls });
    }

    // Metered.ca TURN (fallback)
    if (config.metered_enabled && config.metered_api_key) {
      try {
        const resp = await fetch(
          `https://${config.metered_domain || "global.relay.metered.ca"}/api/v1/turn/credentials?apiKey=${config.metered_api_key}`
        );
        if (resp.ok) {
          const turnServers = await resp.json();
          servers.push(...turnServers);
        }
      } catch (e) {
        console.warn("Failed to fetch Metered TURN credentials:", e);
      }
    }

    // Self-hosted Coturn
    if (config.coturn_enabled && config.coturn_url) {
      const raw = config.coturn_url as string;
      const coturnUrl = /^(turn|turns|stun):/.test(raw) ? raw : `turn:${raw}`;
      servers.push({
        urls: coturnUrl,
        username: config.coturn_username || undefined,
        credential: config.coturn_credential || undefined,
      });
    }
  } catch {
    // Fallback to default STUN
    servers.push({ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] });
  }

  if (servers.length === 0) {
    servers.push({ urls: ["stun:stun.l.google.com:19302"] });
  }

  return servers;
}
