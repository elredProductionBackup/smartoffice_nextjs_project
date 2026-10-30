"use client";

import { useCallback, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { openEventsModal } from "@/store/events/eventsUiSlice";
import { useRouter } from "next/navigation";
import { Award, ChevronDown, Inbox, ListChecks, Plus, Settings2, Wallet } from "lucide-react";
import { useOutsideClick } from "@/hooks/useOutsideClick";

// Event requests raised by learning officers
const EVENT_REQUESTS_ROUTE = "/dashboard/events/requests";

const pillClass =
  "h-[44px] px-[18px] rounded-[100px] border border-[#BCBCD9] bg-white text-[18px] font-[500] cursor-pointer flex items-center gap-[8px] hover:border-[#0B57D0] transition-colors";

export default function EventsHeader() {
  const dispatch = useDispatch();
  const router = useRouter();

  const [setupOpen, setSetupOpen] = useState(false);
  const setupRef = useRef(null);
  const closeSetup = useCallback(() => setSetupOpen(false), []);
  useOutsideClick(setupRef, closeSetup);

  // Setup pages are opened occasionally, so they share one menu instead of three buttons
  const setupItems = [
    {
      label: "Point System",
      description: "Points for event participation",
      icon: Award,
      onClick: () => dispatch(openEventsModal({ type: "POINT_SYSTEM" })),
    },
    {
      label: "Master Checklist",
      description: "Tasks added to every event",
      icon: ListChecks,
      onClick: () => dispatch(openEventsModal({ type: "MASTER_CHECKLIST" })),
    },
    {
      label: "Budget Checklist",
      description: "Budget categories and limits",
      icon: Wallet,
      onClick: () => router.push("/dashboard/events/budget-checklist"),
    },
  ];

  return (
    <div className="flex items-center justify-between w-full relative">
      <div>
        {/* Title Row */}
        <div className="flex items-center gap-[20px] mb-[20px]">
          <h2 className="font-heading text-[32px] font-semibold ">Events</h2>
        </div>
      </div>

      {/* RIGHT — Buttons */}
      <div className="absolute right-0 bottom-[0px] z-30 flex items-center gap-[12px]">
        {/* Event Requests — frequent action, kept as its own button */}
        <button onClick={() => router.push(EVENT_REQUESTS_ROUTE)} className={pillClass}>
          <Inbox size={20} strokeWidth={1.75} className="text-[#0B57D0]" />
          Event Requests
        </button>

        {/* Event setup menu */}
        <div ref={setupRef} className="relative">
          <button
            type="button"
            onClick={() => setSetupOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={setupOpen}
            className={`${pillClass} ${setupOpen ? "border-[#0B57D0]" : ""}`}
          >
            <Settings2 size={20} strokeWidth={1.75} className="text-[#666666]" />
            Event setup
            <ChevronDown
              size={18}
              className={`text-[#777777] transition-transform ${setupOpen ? "rotate-180" : ""}`}
            />
          </button>

          {setupOpen && (
            <ul
              role="menu"
              className="absolute right-0 top-full mt-2 min-w-[280px] rounded-xl bg-white border border-[#EAEEF2] shadow-[0px_4px_16px_0px_#0000001a] py-1.5"
            >
              {setupItems.map(({ label, description, icon: Icon, onClick }) => (
                <li key={label}>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      closeSetup();
                      onClick();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left cursor-pointer hover:bg-[#F2F7FF] transition-colors"
                  >
                    <span className="w-9 h-9 rounded-lg bg-[#F2F7FF] text-[#0B57D0] flex items-center justify-center shrink-0">
                      <Icon size={18} strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[16px] font-semibold text-[#333333]">{label}</span>
                      <span className="block text-[13px] text-[#777777]">{description}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Create event — primary action, last in the row */}
        <button
          onClick={() => router.push("/dashboard/events/create")}
          className="h-[44px] pl-[14px] pr-[20px] rounded-[100px] bg-[linear-gradient(95.15deg,#5597ED_3.84%,#00449C_96.38%)] text-white text-[18px] font-[500] cursor-pointer flex items-center gap-[6px] shadow-[0px_2px_8px_0px_#00449C40] hover:opacity-90 transition"
        >
          <Plus size={20} strokeWidth={2.25} />
          Create event
        </button>
      </div>
    </div>
  );
}
