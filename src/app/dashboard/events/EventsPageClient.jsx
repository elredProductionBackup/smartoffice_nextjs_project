"use client";

import ActionableHeader from "@/_components/ActionableHeader";
import ActionableTabs from "@/_components/ActionableTabs";
import { useSearchParams } from "next/navigation";
import EventsList from "@/_components/EventsComps/EventsList";
import { DRAFT_EVENTS, PAST_EVENTS, UPCOMING_EVENTS } from "@/assets/helpers/sampleEvents";
import EventsPopups from "@/_components/EventsComps/EventsPopups";
import EventsHeader from "@/_components/EventsComps/EventsHeader";

const EVENT_TABS = [
  { label: "Upcoming events", value: "upcoming" },
  { label: "Past events", value: "past" },
  { label: "Draft", value: "draft" },
];

export default function EventsPageClient() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "upcoming";

  return (
    <div className="h-[calc(100vh-120px)] my-5 flex flex-col">
      <EventsHeader/>

      <ActionableTabs
        tabs={EVENT_TABS}
        defaultTab="upcoming"
        events={true}
      />

      <div className="flex-1 flex flex-col min-h-0 bg-[#F2F7FF] pt-[30px] mt-[20px] rounded-[20px] overflow-hidden">
        {tab === "upcoming" && (
          <EventsList events={UPCOMING_EVENTS} showTasks />
        )}

        {tab === "past" && (
          <EventsList events={PAST_EVENTS} showTasks={false} />
        )}

        {tab === "draft" && (
          <EventsList events={DRAFT_EVENTS} showTasks isDraft />
        )}
      </div>
      <EventsPopups/>
    </div>
  );
}
