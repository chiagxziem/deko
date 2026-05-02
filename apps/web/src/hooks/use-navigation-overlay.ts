import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

import { useNavigationStore } from "@/stores/navigation-store";

export function useNavigationOverlay() {
  const router = useRouter();
  const isNavigating = useNavigationStore((s) => s.isNavigating);
  const startNavigation = useNavigationStore((s) => s.startNavigation);
  const stopNavigation = useNavigationStore((s) => s.stopNavigation);

  useEffect(() => {
    const unsubscribeBeforeNavigate = router.subscribe(
      "onBeforeNavigate",
      ({ fromLocation, pathChanged }) => {
        if (fromLocation && pathChanged) {
          startNavigation();
        }
      },
    );

    const unsubscribeResolved = router.subscribe("onResolved", () => {
      stopNavigation();
    });

    return () => {
      unsubscribeBeforeNavigate();
      unsubscribeResolved();
    };
  }, [router, startNavigation, stopNavigation]);

  useEffect(() => {
    document.body.style.overflow = isNavigating ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isNavigating]);

  return { isNavigating };
}
