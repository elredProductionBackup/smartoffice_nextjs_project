export default function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-[8px]">
      <div className="h-[80px] w-[80px] bg-[#D3E3FD] rounded-full" />
      <div className="text-[24px] font-[600]">No action items found</div>
      <div className="text-[20px] text-[#666]">
        Looks like you haven’t added any action item yet
      </div>
    </div>
  );
}
