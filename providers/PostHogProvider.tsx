"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect, useState, Suspense } from "react";
import { useUser } from "@clerk/nextjs";
import { usePathname, useSearchParams } from "next/navigation";

export function PostHogPageView(): null {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname;
      if (searchParams && searchParams.toString()) {
        url = url + `?${searchParams.toString()}`;
      }
      posthog.capture("$pageview", {
        $current_url: url,
      });
    }
  }, [pathname, searchParams]);

  return null;
}

export function PHProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

    console.log("PostHog API Key:", apiKey ? "Found" : "Not found");
    console.log("PostHog Host:", host);

    if (apiKey && !isInitialized) {
      console.log("Initializing PostHog...");
      posthog.init(apiKey, {
        api_host: host, // Use direct host for static export compatibility
        ui_host: host, // Keep the actual PostHog host for the UI
        person_profiles: "identified_only",
        autocapture: false, // Disable autocapture
        disable_session_recording: true, // Disable session recording
        advanced_disable_decide: true, // Disable feature flags and experiments
        loaded: (posthog) => {
          console.log("PostHog loaded successfully!");
        },
      });
      setIsInitialized(true);
    } else if (!apiKey) {
      console.warn("PostHog API key not found. Events will not be tracked.");
    }
  }, [isInitialized]);

  return (
    <PostHogProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PostHogProvider>
  );
}

// Hook to identify users with Clerk
export function usePostHogIdentify() {
  const { user } = useUser();

  useEffect(() => {
    if (user?.id && posthog) {
      posthog.identify(user.id, {
        email: user.emailAddresses[0]?.emailAddress,
        name: user.fullName,
        createdAt: user.createdAt,
      });
    }
  }, [user]);
}
