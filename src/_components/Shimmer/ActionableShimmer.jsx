const ShimmerRow = () => {
  return (
    <div className="flex items-center justify-between py-[20px] border-b border-[#D4DFF1] animate-pulse">
      {/* LEFT: Avatar + text */}
      <div className="flex items-start gap-4 flex-3">
        <div className="w-[18px] h-[18px] rounded-[4px] bg-[#D4DFF1] mt-[6px] ml-[6px]" />

        <div className="flex-1 flex flex-col gap-2">
          <div className="h-[20px] w-[60%] rounded-full bg-[#D4DFF1]" />
          <div className="h-[12px] w-[20%] rounded-full bg-[#E1E8F6]" />
        </div>
      </div>

      {/* RIGHT: Action circles */}
      <div className="flex gap-4 flex-[1.2] justify-start">
        <div className="w-[32px] h-[32px] rounded-full bg-[#D4DFF1]" />
        <div className="w-[32px] h-[32px] rounded-full bg-[#D4DFF1]" />
        <div className="w-[32px] h-[32px] rounded-full bg-[#D4DFF1]" />
      </div>
    </div>
  );
};

const ActionableShimmer = () => {
  return (
    <div className="flex flex-col">
      
      {/* Header shimmer */}
      <div className="h-[56px] pb-[14px] flex items-start ">
        <div className="flex-3 flex items-center gap-[20px]">
            <div className="h-[20px] w-[150px] rounded-full bg-[#D4DFF1] animate-pulse"></div>
            <div className="h-[36] w-[50px] rounded-full bg-[#D4DFF1] animate-pulse"></div>
        </div>
        <div className="flex-1 flex items-center gap-[4px] justify-end">
            <div className="h-[32px] w-[40px] rounded-[4px] bg-[#D4DFF1] animate-pulse mr-[6px]"></div>
            <div className="h-[32px] w-[64px] rounded-[4px] bg-[#D4DFF1] animate-pulse"></div>
            <div className="h-[32px] w-[76px] rounded-[4px] bg-[#D4DFF1] animate-pulse"></div>
            <div className="h-[32px] w-[54px] rounded-[4px] bg-[#D4DFF1] animate-pulse"></div>
        </div>
      </div>

      {/* Rows */}
      <div className="flex-1">
        {Array.from({ length: 4 }).map((_, index) => (
          <ShimmerRow key={index} />
        ))}
      </div>
    </div>
  );
};

export default ActionableShimmer;
