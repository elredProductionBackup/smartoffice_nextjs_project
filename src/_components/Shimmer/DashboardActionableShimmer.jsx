import React from "react";

const ShimmerRow = () => {
  return (
    <div className="flex items-start justify-between gap-[34px] pb-[20px] border-b border-[#C3CEE4] last:border-none">
      {/* Left */}
      <div className="flex gap-3 w-full">
        <div className="mt-[7px] h-[8px] w-[8px] rounded-full bg-[#D4DFF1]" />

        <div className="flex flex-col gap-[10px] w-full">
          <div className="h-[16px] w-[80%] rounded-[10px] bg-[#D4DFF1]" />
          <div className="h-[12px] w-[40%] rounded-[10px] bg-[#D4DFF1]" />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-start gap-[34px]">
        <div className="h-[12px] w-[60px] rounded-[10px] bg-[#D4DFF1] px-[20px]" />
        <div className="h-[24px] w-[24px] rounded-full bg-[#D4DFF1]" />
      </div>
    </div>
  );
};

const DashboardActionableShimmer = () => {
  return (
    <div className="w-[100%] flex-1 flex-col gap-[20px]">
      {/* Header shimmer */}
      <div className="flex items-start justify-between mb-[20px] animate-pulse">
        <div className="h-[20px] w-[100px] rounded-[10px] bg-[#D4DFF1]" />
        <div className="h-[27px] w-[100px] rounded-full bg-[#D4DFF1]" />
      </div>

      {/* List shimmer */}
      <div className="flex-1 flex flex-col gap-[20px] animate-pulse">
        {Array.from({ length: 3 }).map((_, i) => (
          <ShimmerRow key={i} />
        ))}
      </div>
    </div>
  );
};

export default DashboardActionableShimmer;
