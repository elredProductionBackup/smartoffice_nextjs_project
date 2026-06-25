import { Suspense } from "react";
import EventsPageClient from "./EventsPageClient";

export default function MembersPage() {
  return (
    <Suspense fallback={
    <div className="flex-1 grid place-items-center">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
    }>
      <EventsPageClient />
    </Suspense>
  );
}