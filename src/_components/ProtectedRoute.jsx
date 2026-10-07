// "use client";
// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";

// export default function ProtectedRoute({ children }) {
//   const router = useRouter();
//   const [checked, setChecked] = useState(false);

//   useEffect(() => {
//     const token = localStorage.getItem("token");

//     if (!token) {
//       router.replace("/");
//     } else {
//       setChecked(true);
//     }
//   }, [router]);

//   if (!checked) {
//     return (
//       <div className="h-screen flex items-center justify-center">
//         Loading...
//       </div>
//     );
//   }

//   return children;
// }

"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, notFound } from "next/navigation";
import { useSelector } from "react-redux";
import { selectIsAdminRole, selectIsFinanceOfficer, selectIsLearningOfficer } from "@/store/auth/authSlice";
import {
  ADMIN_HOME,
  ADMIN_ONLY_ROUTES,
  FINANCE_MANAGER_HOME,
  LEARNING_OFFICER_HOME,
  isAdminRouteAllowed,
  isFinanceManagerRouteAllowed,
  isLearningOfficerRouteAllowed,
} from "@/utils/routeAccess";

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const pathname = usePathname();

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
    // Not logged in until a role has been picked on the role screen
    if (!isAuthenticated || !selectedRole) {
      router.replace("/");
      return;
    }

    setReady(true);
  }, [isAuthenticated, selectedRole, router]);

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

  if (ready && !isAdmin && !isFinanceManager && !isLearningOfficer && isAdminRoute) {
    notFound();
  }

  if (!ready || isFinanceManagerBlocked || isLearningOfficerBlocked || isAdminBlocked) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
        {/* <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /> */}
      </div>
    );
  }

  return children;
}
