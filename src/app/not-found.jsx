"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-6 px-5">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 text-center">
        Page Not Found
      </h1>
      <p className="text-gray-500 text-base sm:text-lg text-center max-w-md">
        The page you are trying to access does not exist or you don’t
        have permission to view it.
      </p>

      <Link
        href="/dashboard/profile"
        className="px-6 py-2 rounded-full bg-blue-600 text-white"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
