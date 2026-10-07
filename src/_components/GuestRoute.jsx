"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function GuestRoute({ children }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const selectedRole = localStorage.getItem("selectedRole");

    // Login is complete only after OTP *and* role selection
    if (token && selectedRole) {
      router.replace("/dashboard");
    } else {
      setChecked(true); // ✅ allow rendering
    }
  }, [router]);

  // 🚫 Do not render ANYTHING until auth is checked
  if (!checked) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return children;
}
