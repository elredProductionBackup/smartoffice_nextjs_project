"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { CLUSTER_PARAM, getStoredClusterCode } from "@/utils/shareLink";

/**
 * Adds ?networkClusterCode=<code> to the address bar of every dashboard page
 * (without a navigation or history entry), so a copied URL always opens the
 * right network cluster for whoever receives it.
 *
 * Uses useSearchParams, so render the component that calls it inside <Suspense>.
 */
export default function useShareableUrl() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = getStoredClusterCode();
    if (!code || searchParams.get(CLUSTER_PARAM) === code) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set(CLUSTER_PARAM, code);
    window.history.replaceState(null, "", `${pathname}?${params.toString()}${window.location.hash}`);
  }, [pathname, searchParams]);
}

// Render-nothing component so the hook can sit in its own <Suspense> boundary
export function ShareableUrlSync() {
  useShareableUrl();
  return null;
}
