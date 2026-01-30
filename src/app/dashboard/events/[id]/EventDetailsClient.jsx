"use client";

import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
import { UPCOMING_EVENTS, PAST_EVENTS, DRAFT_EVENTS } from "@/assets/helpers/sampleEvents";
import { EVENTS_DETAILS } from "@/assets/helpers/sampleEvents";
import ActionableTabs from "@/_components/ActionableTabs";

export default function EventDetailsClient() {
  const params = useParams();
  const searchParams = useSearchParams();

  const eventId = params?.id;
  const activeTab = searchParams.get("tab") || "attendees";

  const allEvents = [...UPCOMING_EVENTS, ...PAST_EVENTS, ...DRAFT_EVENTS]
    .flatMap(group => group.items);

  const event = allEvents.find(e => e.id === eventId);

  if (!event) return <div className="p-10 text-xl">Event not found</div>;

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col gap-[30px] overflow-y-auto relative ">

      {/* 🔷 Header Section */}
      <div className="bg-white rounded-2xl pt-6 flex gap-6">
        <div className="w-[250px] h-[320px] relative rounded-xl overflow-hidden">
          <Image src={event.image} alt="event" fill className="object-cover" />
        </div>

        <div className="flex-1 space-y-2">
          <h1 className="text-2xl font-semibold">{event.name}</h1>
          <p className="text-gray-500 text-sm">
            Get ready for an incredible experience at {event.name}.
          </p>

          <div className="flex flex-wrap gap-6 text-sm text-gray-600 pt-2">
            <span>📍 {event.location}</span>
            <span>📅 {event.dateRange}</span>
            <span>⏰ {event.time}</span>
            <button className="text-blue-600 font-medium">Additional note</button>
          </div>

          <div className="flex items-center gap-3 pt-3">
            {/* <Image src={event.speaker.avatar} width={40} height={40} alt="" className="rounded-full"/> */}
            <div>
              <p className="font-medium text-sm">{event.speaker.name}</p>
              <p className="text-xs text-gray-500">{event.speaker.bio}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end justify-between">
          <button className="bg-red-500 text-white text-xs px-3 py-1 rounded-full">
            Close event
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Registration</span>
            <div className={`w-10 h-5 rounded-full p-1 ${event.registrationOpen ? "bg-blue-500" : "bg-gray-300"}`}>
              <div className="w-4 h-4 bg-white rounded-full ml-auto" />
            </div>
            <span className="text-sm text-gray-500">{event.registrationOpen ? "Open" : "Closed"}</span>
          </div>
        </div>
      </div>

      {/* 🔷 Tabs */}
      <div className="bg-white rounded-2xl sticky top-[0px]">
        <ActionableTabs tabs={EVENTS_DETAILS} defaultTab="attendees" />
      </div>

      {/* 🔷 Tab Content (URL Controlled) */}
      <div className="bg-white rounded-2xl">
        {activeTab === "attendees" && <div className="pb-[20px]">Attendees content</div>}
        {activeTab === "memberMedia" && <div>Member Media content</div>}
        {activeTab === "documents" && <div>Documents content</div>}
        {activeTab === "logistics" && <div>Logistics content</div>}
        {activeTab === "checklist" && <div>Checklist content</div>}
      </div>

    </div>
  );
}
