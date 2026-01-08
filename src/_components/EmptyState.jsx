import Image from "next/image";

export default function EmptyState({searchValue}) {
  return (
    <div className="flex h-[100%] flex-col items-center justify-center gap-[20px] w-[100%]">
      <div className={`h-[80px] w-[80px] ${searchValue? 'bg-[#D8E0ED]':'bg-[#D3E3FD]'} rounded-full mb-[10px] grid place-items-center`}>
       <Image
        src={searchValue?"/logo/no-search-actionable.svg":"/logo/group-checklist.svg"}
        alt="Checklist"
        width={32}
        height={32}
        className="object-contain"
      />
      </div>
      <div className="text-[24px] font-[600]">{searchValue? 'No search result found':'No action items found'}</div>
      <div className="text-[20px] text-[#666]">
        {searchValue?'Try adjusting your search or filters.':'Looks like you haven’t added any action item yet'}
      </div>
    </div>
  );
}
