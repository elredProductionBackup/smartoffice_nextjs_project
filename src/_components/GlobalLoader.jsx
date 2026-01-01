"use client";

import useGlobalLoader from "@/store/useGlobalLoader";

const GlobalLoader = () => {
  const loading = useGlobalLoader((state) => state.loading);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        
        {/* Text */}
        <p className="text-white text-xl font-medium">
          Loading...
        </p>
      </div>
    </div>
  );
};

export default GlobalLoader;
