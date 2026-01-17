"use client";

import { useDispatch } from "react-redux";
import { openEventsModal } from "@/store/events/eventsUiSlice";

export default function EventsHeader() {
  const dispatch = useDispatch();

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
         {/* Create Event */}
        <button
          onClick={() => console.log('redirection')}
          className="py-[8px] px-[20px] text-[20px] rounded-[100px] bg-[linear-gradient(95.15deg,#5597ED_3.84%,#00449C_96.38%)] cursor-pointer text-white font-[500] flex items-center gap-[4px]"
        >
         <span className="ic--round-plus full"></span> Create event
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
