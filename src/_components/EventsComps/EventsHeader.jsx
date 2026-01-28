"use client";

import { useDispatch } from "react-redux";
import { openEventsModal } from "@/store/events/eventsUiSlice";
import { useRouter } from "next/navigation";

export default function EventsHeader() {
  const dispatch = useDispatch();
  const router = useRouter()

  return (
    <div className="flex items-center justify-between w-full relative">
      <div>
        {/* Title Row */}
        <div className="flex items-center gap-[20px] mb-[20px]">
          <h2 className="text-[32px] font-semibold ">Events</h2>
        </div>
      </div>

      {/* RIGHT — Buttons */}
      <div className="absolute right-0 bottom-[0px] z-30 flex items-center gap-[20px]">
         {/* Point System */}
        <button
          onClick={() =>
            dispatch(
              openEventsModal({
                type: "POINT_SYSTEM",
              })
            )
          }
           className="py-[8px] px-[20px] rounded-[100px] border border-[#BCBCD9] text-[20px] font-[500] cursor-pointer flex items-center gap-[4px]"
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
          className="py-[8px] px-[20px] rounded-[100px] border border-[#BCBCD9] text-[20px] font-[500] cursor-pointer flex items-center gap-[4px]"
        >
          Master Checklist <span className="iconamoon--arrow-up-2-duotone full rotate-90"></span>

        </button>
      </div>
    </div>
  );
}
