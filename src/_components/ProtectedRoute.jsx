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
import { ADMIN_ONLY_ROUTES } from "@/utils/routeAccess";

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const isAdmin = user?.userType?.toLowerCase() === "admin";

  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/");
      return;
    }

    setReady(true);
  }, [isAuthenticated, router]);

  const isAdminRoute = ADMIN_ONLY_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (ready && !isAdmin && isAdminRoute) {
    notFound();
  }

  if (!ready) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
        {/* <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /> */}
      </div>
    );
  }

  return children;
}
