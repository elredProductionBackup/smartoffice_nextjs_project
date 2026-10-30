"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, notFound } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  logout,
  selectIsAdminRole,
  selectIsFinanceOfficer,
  selectIsLearningOfficer,
} from "@/store/auth/authSlice";
import {
  ADMIN_HOME,
  ADMIN_ONLY_ROUTES,
  FINANCE_MANAGER_HOME,
  LEARNING_OFFICER_HOME,
  isAdminRouteAllowed,
  isFinanceManagerRouteAllowed,
  isLearningOfficerRouteAllowed,
} from "@/utils/routeAccess";
import {
  buildLoginUrl,
  getClusterCodeFromUrl,
  getCurrentPath,
  getStoredClusterCode,
} from "@/utils/shareLink";

const FullPageLoader = () => (
  <div className="h-dvh flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-[#0B57D0] border-t-transparent rounded-full animate-spin" aria-label="Loading" />
  </div>
);

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();

  const { isAuthenticated, user, selectedRole } = useSelector((state) => state.auth);
  const isAdmin = user?.userType?.toLowerCase() === "admin";
  const isFinanceManager = useSelector(selectIsFinanceOfficer);
  const isFinanceManagerBlocked =
    isFinanceManager && !isFinanceManagerRouteAllowed(pathname);
  const isLearningOfficer = useSelector(selectIsLearningOfficer);
  const isLearningOfficerBlocked =
    isLearningOfficer && !isLearningOfficerRouteAllowed(pathname);
  const isAdminRole = useSelector(selectIsAdminRole);
  const isAdminBlocked = isAdminRole && !isAdminRouteAllowed(pathname);

  const [ready, setReady] = useState(false);

  useEffect(() => {
    const urlClusterCode = getClusterCodeFromUrl();
    const storedClusterCode = getStoredClusterCode();
    const isLoggedIn = isAuthenticated && !!selectedRole;

    // Shared link for a different network cluster than the one this session belongs to:
    // sign out and send the user to that cluster's login, then back to the shared page.
    if (
      isLoggedIn &&
      urlClusterCode &&
      storedClusterCode &&
      urlClusterCode.toLowerCase() !== storedClusterCode.toLowerCase()
    ) {
      const redirect = getCurrentPath();
      dispatch(logout());
      router.replace(buildLoginUrl({ clusterCode: urlClusterCode, redirect }));
      return;
    }

    // Not logged in until a role has been picked on the role screen.
    // Keep the cluster code + the page that was opened so a shared link still works after login.
    if (!isLoggedIn) {
      router.replace(
        buildLoginUrl({
          clusterCode: urlClusterCode || storedClusterCode,
          redirect: getCurrentPath(),
        })
      );
      return;
    }

    setReady(true);
  }, [isAuthenticated, selectedRole, router, dispatch]);

  useEffect(() => {
    if (ready && isFinanceManagerBlocked) {
      router.replace(FINANCE_MANAGER_HOME);
    }
  }, [ready, isFinanceManagerBlocked, router]);

  useEffect(() => {
    if (ready && isLearningOfficerBlocked) {
      router.replace(LEARNING_OFFICER_HOME);
    }
  }, [ready, isLearningOfficerBlocked, router]);

  useEffect(() => {
    if (ready && isAdminBlocked) {
      router.replace(ADMIN_HOME);
    }
  }, [ready, isAdminBlocked, router]);

  const isAdminRoute = ADMIN_ONLY_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Logged out (e.g. right after logout) — show the loader while redirecting, never the 404
  const isLoggedIn = isAuthenticated && !!selectedRole;

  if (ready && isLoggedIn && !isAdmin && !isFinanceManager && !isLearningOfficer && isAdminRoute) {
    notFound();
  }

  if (!ready || !isLoggedIn || isFinanceManagerBlocked || isLearningOfficerBlocked || isAdminBlocked) {
    return <FullPageLoader />;
  }

  return children;
}
