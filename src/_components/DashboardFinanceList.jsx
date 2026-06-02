"use client";

import Image from "next/image";
import Link from "next/link";

export default function DashboardFinanceList() {
  return (
    <div className="flex flex-col mt-6 rounded-2xl bg-[#F2F7FF] px-6 py-6 min-h-[450px] max-h-[450px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[20px] font-bold text-[#333]">Finance</h3>
        <Link
          href={`/dashboard/finance`}
          className="text-[14px] font-semibold text-[#0B57D0] border border-[#0B57D0] px-3.5 py-1 rounded-full cursor-pointer"
        >
          Go to finance
        </Link>
      </div>

      {/* List */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto min-mh-0">
        <div className="flex-1 flex flex-col gap-2.5 items-center justify-center">
          <div className="h-[60px] w-[60px] bg-[#D3E3FD] rounded-full mb-2.5 grid place-items-center">
            <Image
              src="/logo/group-checklist.svg"
              alt="Checklist"
              width={24}
              height={24}
              className="object-contain"
            />
          </div>
          <div className="text-[20px] font-semibold text-[#333333] text-center">
            No finance items found
          </div>
          <p className="text-[14px] text-[#666666]">
            Looks like you haven’t added any finance item yet
          </p>
        </div>
      </div>
    </div>
  );
}
