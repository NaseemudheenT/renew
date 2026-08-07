"use client";

/**
 * PostHog analytics — initialised once on the client. No-ops cleanly when the
 * key is absent, so local/dev without analytics keys just works. Respects
 * Do-Not-Track and never captures on the server.
 */
import { useEffect } from "react";
import posthog from "posthog-js";
import { clientEnv } from "@/lib/env";

let started = false;

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (started || !clientEnv.posthog.key) return;
    if (navigator.doNotTrack === "1") return;

    posthog.init(clientEnv.posthog.key, {
      api_host: clientEnv.posthog.host,
      capture_pageview: true,
      capture_pageleave: true,
      persistence: "localStorage+cookie",
      autocapture: true,
      // We route through Next; disable session recording by default for privacy.
      disable_session_recording: true,
      loaded: () => {
        started = true;
      },
    });
  }, []);

  return <>{children}</>;
}

export { posthog };
