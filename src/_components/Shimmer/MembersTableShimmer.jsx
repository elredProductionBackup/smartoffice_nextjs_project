const ShimmerRow = () => {
  return (
    <div className="flex flex-col items-stretch gap-3 mx-4 py-4 md:flex-row md:items-center md:justify-between md:gap-0 md:mx-[30px] md:py-[20px] border-b border-[#D4DFF1] animate-pulse">
      {/* LEFT: Avatar + text */}
      <div className="flex items-center gap-4 md:flex-3">
        <div className="w-[48px] h-[48px] shrink-0 rounded-full bg-[#D4DFF1]" />

        <div className="flex flex-col gap-2">
          <div className="h-[16px] w-[140px] md:w-[160px] rounded-full bg-[#D4DFF1]" />
          <div className="h-[14px] w-[180px] md:w-[220px] rounded-full bg-[#E1E8F6]" />
        </div>
      </div>

      {/* RIGHT: Action circles */}
      <div className="flex gap-4 pl-16 md:pl-0 md:flex-1 justify-start">
        <div className="w-10 h-10 rounded-full bg-[#D4DFF1]" />
        <div className="w-10 h-10 rounded-full bg-[#D4DFF1]" />
        <div className="w-10 h-10 rounded-full bg-[#D4DFF1]" />
      </div>
    </div>
  );
};

const MembersTableShimmer = () => {
  return (
    <div className="flex-1 min-h-0 mt-[20px] rounded-[20px] bg-[#F2F7FF] overflow-hidden flex flex-col">
      
      {/* Header shimmer */}
      <div className="hidden md:flex px-[30px] pt-[40px] pb-[14px] items-start">
        <div className="flex-3 flex"><div className="h-[16px] w-[120px] rounded-full bg-[#D4DFF1] animate-pulse"></div></div>
        <div className="flex-1 flex"><div className="h-[16px] w-[120px] rounded-full bg-[#D4DFF1] animate-pulse"></div></div>
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

export default MembersTableShimmer;
