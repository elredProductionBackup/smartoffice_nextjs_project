"use client";

import { useDispatch } from "react-redux";
import { openEventsModal } from "@/store/events/eventsUiSlice";
import { useRouter } from "next/navigation";

export default function EventsHeader() {
  const dispatch = useDispatch();
  const router = useRouter()

  return (
    <div className="flex flex-col gap-3 mb-4 lg:mb-0 lg:gap-0 lg:flex-row lg:items-center justify-between w-full relative">
      <div>
        {/* Title Row */}
        <div className="flex items-center justify-between gap-[20px] lg:mb-[20px]">
          <h2 className="font-heading text-[26px] md:text-[32px] font-semibold">Events</h2>

          {/* Phones only: the tab row's "Create event" button is hidden there */}
          <button
            onClick={() => router.push("/dashboard/events/create")}
            className="md:hidden py-[6px] pr-[14px] pl-[10px] rounded-[100px] bg-[linear-gradient(95.15deg,#5597ED_3.84%,#00449C_96.38%)] cursor-pointer text-white text-[14px] font-[500] flex items-center gap-[4px] whitespace-nowrap"
          >
            <span className="ic--round-plus"></span> Create event
          </button>
        </div>
      </div>

      {/* RIGHT — Buttons */}
      <div className="flex flex-wrap items-center gap-2 md:gap-3 lg:gap-[20px] lg:absolute lg:right-0 lg:bottom-[0px] z-30">
         {/* Point System */}
        <button
          onClick={() =>
            dispatch(
              openEventsModal({
                type: "POINT_SYSTEM",
              })
            )
          }
           className="py-[6px] px-[14px] text-[14px] md:text-[16px] lg:py-[8px] lg:px-[20px] lg:text-[20px] rounded-[100px] border border-[#BCBCD9] font-[500] cursor-pointer flex items-center gap-[4px] whitespace-nowrap"
        >
         Point System <span className="iconamoon--arrow-up-2-duotone full rotate-90"></span>
        </button>

        {/* Master Checklist */}
        <button
          onClick={() =>
            dispatch(
              openEventsModal({
                type: "MASTER_CHECKLIST",
              })
            )
          }
          className="py-[6px] px-[14px] text-[14px] md:text-[16px] lg:py-[8px] lg:px-[20px] lg:text-[20px] rounded-[100px] border border-[#BCBCD9] font-[500] cursor-pointer flex items-center gap-[4px] whitespace-nowrap"
        >
          Master Checklist <span className="iconamoon--arrow-up-2-duotone full rotate-90"></span>

        </button>

        {/* Budget Checklist */}
        <button
          onClick={() => router.push("/dashboard/events/budget-checklist")}
          className="py-[6px] px-[14px] text-[14px] md:text-[16px] lg:py-[8px] lg:px-[20px] lg:text-[20px] rounded-[100px] border border-[#BCBCD9] font-[500] cursor-pointer flex items-center gap-[4px] whitespace-nowrap"
        >
          Budget Checklist <span className="iconamoon--arrow-up-2-duotone full rotate-90"></span>
        </button>
      </div>
    </div>
  );
}
