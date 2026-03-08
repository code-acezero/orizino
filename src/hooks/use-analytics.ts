import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Generate a simple session ID per browser tab
const getSessionId = () => {
  let id = sessionStorage.getItem("analytics_session_id");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("analytics_session_id", id);
  }
  return id;
};

/** Track a page view event */
export const trackPageView = async (page: string) => {
  try {
    await (supabase as any).from("page_analytics").insert({
      event_type: "page_view",
      page,
      session_id: getSessionId(),
    });
  } catch {
    // silently fail — analytics should never break the app
  }
};

/** Track a section becoming visible (engagement) */
export const trackSectionView = async (sectionId: string, page = "/home") => {
  try {
    await (supabase as any).from("page_analytics").insert({
      event_type: "section_view",
      page,
      section_id: sectionId,
      session_id: getSessionId(),
    });
  } catch {
    // silently fail
  }
};

/** Track how long a section stays visible */
export const trackSectionDuration = async (
  sectionId: string,
  durationMs: number,
  page = "/home"
) => {
  if (durationMs < 500) return; // ignore very short views
  try {
    await (supabase as any).from("page_analytics").insert({
      event_type: "section_engagement",
      page,
      section_id: sectionId,
      duration_ms: Math.round(durationMs),
      session_id: getSessionId(),
    });
  } catch {
    // silently fail
  }
};

/** Track a click event (CTA, product card, link, etc.) */
export const trackClick = async (
  clickType: string,
  targetId: string,
  page = "/home",
  metadata?: Record<string, any>
) => {
  try {
    await (supabase as any).from("page_analytics").insert({
      event_type: "click",
      page,
      section_id: clickType,
      session_id: getSessionId(),
      metadata: { target_id: targetId, click_type: clickType, ...metadata },
    });
  } catch {
    // silently fail
  }
};

/**
 * Hook: observe when a section scrolls into view and track engagement.
 * Returns a ref to attach to the section container.
 */
export const useSectionTracker = (sectionId: string, page = "/home") => {
  const ref = useRef<HTMLDivElement | null>(null);
  const trackedRef = useRef(false);
  const visibleSince = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Section entered viewport
          if (!trackedRef.current) {
            trackedRef.current = true;
            trackSectionView(sectionId, page);
          }
          visibleSince.current = Date.now();
        } else if (visibleSince.current) {
          // Section left viewport — track duration
          const duration = Date.now() - visibleSince.current;
          trackSectionDuration(sectionId, duration, page);
          visibleSince.current = null;
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      // Track remaining duration on unmount
      if (visibleSince.current) {
        const duration = Date.now() - visibleSince.current;
        trackSectionDuration(sectionId, duration, page);
      }
    };
  }, [sectionId, page]);

  return ref;
};

/** Hook: track page view on mount (once per page load) */
export const usePageViewTracker = (page: string) => {
  const tracked = useRef(false);
  useEffect(() => {
    if (!tracked.current) {
      tracked.current = true;
      trackPageView(page);
    }
  }, [page]);
};
