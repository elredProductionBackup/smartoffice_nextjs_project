"use client";

import { useRouter } from "next/navigation";
import { Inbox } from "lucide-react";

// Events requested by learning officers. No API yet, so the page only shows the empty state.
export default function EventRequests() {
  const router = useRouter();

  return (
    <div className="h-[calc(100vh-120px)] my-5 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-5 mb-6">
        <span
          className="maki--arrow rotate-180 cursor-pointer"
          onClick={() => router.push("/dashboard/events")}
        />
        <div>
          <h2 className="font-heading text-[32px] font-semibold">Event Requests</h2>
          <p className="text-[18px] text-[#666666]">Events requested by learning officers</p>
        </div>
      </div>

      {/* Empty state */}
      <div className="flex-1 flex flex-col items-center justify-center gap-[20px] bg-[#F2F7FF] rounded-[20px] px-6 text-center">
        <div className="h-[80px] w-[80px] bg-[#D3E3FD] rounded-full mb-[10px] grid place-items-center">
          <Inbox size={32} strokeWidth={1.75} className="text-[#0B57D0]" />
        </div>
        <div className="text-[24px] font-[600]">No requested events</div>
        <div className="text-[20px] text-[#666]">
          Events requested by learning officers will appear here for your review
        </div>
      </div>
    </div>
  );
}
