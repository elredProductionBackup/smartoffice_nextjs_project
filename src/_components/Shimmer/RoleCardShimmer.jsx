import React from "react";

// Mirrors the role card layout: radio dot, stacked illustration tiles, title & description
const ShimmerCard = () => {
  return (
    <div className="relative rounded-2xl border border-gray-100 bg-white p-5 pb-7">
      <div className="absolute top-4 right-4 h-5 w-5 rounded-full bg-[#D4DFF1]" />

      <div className="relative h-36 w-full flex items-center justify-center">
        <div className="absolute -translate-x-9 -rotate-[10deg] w-14 h-16 rounded-xl bg-[#E6EDF8]" />
        <div className="absolute translate-x-9 rotate-[10deg] w-14 h-16 rounded-xl bg-[#E6EDF8]" />
        <div className="relative w-[72px] h-[72px] rounded-2xl bg-[#D4DFF1]" />
      </div>

      <div className="mt-6 flex flex-col items-center gap-[10px]">
        <div className="h-[16px] w-[45%] rounded-[10px] bg-[#D4DFF1]" />
        <div className="h-[12px] w-[75%] rounded-[10px] bg-[#D4DFF1]" />
        <div className="h-[12px] w-[55%] rounded-[10px] bg-[#D4DFF1]" />
      </div>
    </div>
  );
};

const RoleCardShimmer = ({ count = 3 }) => {
  return (
    <div className="mt-12 w-full max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-5 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <ShimmerCard key={i} />
      ))}
    </div>
  );
};

export default RoleCardShimmer;
