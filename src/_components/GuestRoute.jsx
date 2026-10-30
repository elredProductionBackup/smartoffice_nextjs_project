"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { REDIRECT_PARAM, sanitizeRedirect } from "@/utils/shareLink";

export default function GuestRoute({ children }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const selectedRole = localStorage.getItem("selectedRole");

    // Login is complete only after OTP *and* role selection
    if (token && selectedRole) {
      // Already signed in: open the shared page directly if the link carried one
      const redirect = sanitizeRedirect(new URLSearchParams(window.location.search).get(REDIRECT_PARAM));
      router.replace(redirect || "/dashboard");
    } else {
      setChecked(true); // allow rendering
    }
  }, [router]);

  // Do not render anything until auth is checked
  if (!checked) {
    return (
      <div className="h-dvh flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#0B57D0] border-t-transparent rounded-full animate-spin" aria-label="Loading" />
      </div>
    );
  }

  return children;
}
