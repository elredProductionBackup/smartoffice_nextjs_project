"use client";

import { useParams } from "next/navigation";
import { UPCOMING_EVENTS, PAST_EVENTS, DRAFT_EVENTS } from "@/assets/helpers/sampleEvents";

export default function EventDetailsClient() {
  const params = useParams();
  const eventId = params?.id;

  const allEvents = [...UPCOMING_EVENTS, ...PAST_EVENTS, ...DRAFT_EVENTS]
    .flatMap(group => group.items);

  const event = allEvents.find(e => e.id === eventId);

  if (!event) {
    return <div className="p-10 text-xl">Event not found</div>;
  }

  return (
    <div className="h-[calc(100vh-120px)] my-5 flex flex-col">
      <div className="bg-white rounded-2xl p-8">
        <h1 className="text-3xl font-bold mb-2">{event.name}</h1>
        <p className="text-gray-500">{event.date} • {event.location}</p>
        <p className="mt-4">Attendees: {event.attendees}</p>
      </div>
    </div>
  );
}
