"use client";

import ActionableTabs from "@/_components/ActionableTabs";
import { useRouter, useSearchParams } from "next/navigation";
import EventsList from "@/_components/EventsComps/EventsList";
import EventsPopups from "@/_components/EventsComps/EventsPopups";
import EventsHeader from "@/_components/EventsComps/EventsHeader";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { fetchEvents } from "@/store/events/eventsThunks";
import { setActiveTab,setPage  } from "@/store/events/eventsSlice";
import Pagination from "@/_components/UI/Pagination";

const EVENT_TABS = [
  { label: "Past", value: "past" },
  { label: "Upcoming", value: "upcomming" },
  { label: "Draft", value: "draft" },
];

export default function EventsPageClient() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || 'upcomming';
  const urlPage = Number(searchParams.get("page")) || 1;
  const dispatch = useDispatch();

  const {
    groupedEvents, page, limit, search, activeTab, loading, error
  } = useSelector((state) => state.events);
  const total = useSelector((state) => state.events.total);

  useEffect(() => {
    if (activeTab !== tab) {
      dispatch(setActiveTab(tab));
    }

    if (page !== urlPage) {
      dispatch(setPage(urlPage));
    }

    dispatch(fetchEvents({ page: urlPage, limit, search, filterBy: tab }));
  }, [tab, urlPage, limit, search, dispatch]);


  return (
    <div className="mt-4 mb-20 md:my-5 md:h-[calc(100vh-120px)] flex flex-col">
      <EventsHeader />

      {/* Phones: tabs scroll sideways and the tab-row "Create event" button is
          swapped for the one in EventsHeader, so it never scrolls off-screen */}
      <div className="max-md:overflow-x-auto max-md:overflow-y-hidden max-md:pb-px max-md:whitespace-nowrap max-md:[scrollbar-width:none] max-md:[&>.action-tabs]:w-max max-md:[&>.action-tabs]:min-w-full max-md:[&_.tab-item]:text-[17px] max-md:[&_.tab-item]:px-[12px] max-md:[&_.action-tabs>button:not(.tab-item)]:hidden">
        <ActionableTabs
          tabs={EVENT_TABS}
          defaultTab="upcomming"
          events={true}
          labelClassName="font-heading font-normal"
        />
      </div>

      <div className="min-h-[60dvh] md:min-h-0 flex-1 flex flex-col bg-[#F2F7FF] pt-4 md:pt-[30px] mt-4 md:mt-[20px] rounded-[20px] overflow-hidden">
        <EventsList
          events={groupedEvents}
          loading={loading}
          error={error}
          showTasks={tab !== "past"}
          isDraft={tab === "draft"}
        />
         <Pagination
          total={total}
          currentPage={urlPage}
          perPage={limit}
          itemLength={groupedEvents.length===0}
        />
      </div>

      <EventsPopups />
    </div>
  );
}
