"use client";

import ActionableTabs from "@/_components/ActionableTabs";
import { useSearchParams } from "next/navigation";
import EventsList from "@/_components/EventsComps/EventsList";
import EventsPopups from "@/_components/EventsComps/EventsPopups";
import EventsHeader from "@/_components/EventsComps/EventsHeader";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { fetchEvents } from "@/store/events/eventsThunks";
import { setActiveTab } from "@/store/events/eventsSlice";

const EVENT_TABS = [
  { label: "Upcoming events", value: "upcoming" },
  { label: "Past events", value: "past" },
  { label: "Draft", value: "draft" },
];

export default function EventsPageClient() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "upcoming";

  const dispatch = useDispatch();

  const {
    groupedEvents,
    page,
    limit,
    search,
    activeTab,
    loading,
    error,  
  } = useSelector((state) => state.events);
  
useEffect(() => {
  if (activeTab !== tab) {
    dispatch(setActiveTab(tab));
  }

  dispatch(fetchEvents({ page, limit, search, filterBy: tab }));
}, [tab, page, limit, search, dispatch]);

  return (
    <div className="h-[calc(100vh-120px)] my-5 flex flex-col">
      <EventsHeader />

      <ActionableTabs
        tabs={EVENT_TABS}
        defaultTab="upcoming"
        events={true}
      />

      <div className="flex-1 flex flex-col min-h-0 bg-[#F2F7FF] pt-[30px] mt-[20px] rounded-[20px] overflow-hidden">
        <EventsList
          events={groupedEvents}
          loading={loading}
          error={error}
          showTasks={tab !== "past"}
          isDraft={tab === "draft"}
        />
      </div>

      <EventsPopups />
    </div>
  );
}
