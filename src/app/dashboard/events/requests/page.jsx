import { Suspense } from "react";
import EventRequests from "@/_components/EventsComps/EventRequests";

// Suspense: EventRequests reads ?id= (opened from a notification) with useSearchParams
export default function EventRequestsPage() {
  return (
    <Suspense fallback={null}>
      <EventRequests />
    </Suspense>
  );
}
