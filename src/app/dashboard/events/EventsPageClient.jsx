"use client";

import { Suspense } from "react";
import ActionableHeader from "@/_components/ActionableHeader";
import ActionableTabs from "@/_components/ActionableTabs";
import { useSearchParams } from "next/navigation";
import UpcomingEvents from "@/_components/EventsComps/UpcomingEvents";

const EVENT_TABS = [
  { label: "Upcoming events", value: "upcoming" },
  { label: "Past events", value: "past" },
  { label: "Draft", value: "draft" },
];

export default function EventsPageClient() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "upcoming";

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      <ActionableHeader title="Events" />

        <ActionableTabs
          tabs={EVENT_TABS}
          defaultTab="upcoming"
        />

      <div className="flex-1 flex flex-col min-h-0 bg-[#F2F7FF] pt-[30px] mt-[20px] rounded-[20px] overflow-hidden">
        {tab === "upcoming" && <UpcomingEvents/>}
        {tab === "past" && <>Past Events</>}
        {tab === "draft" && <>Draft Events</>}
      </div>
    </div>
  );
}
