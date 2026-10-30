import { Suspense } from "react";
import ResourcesPageClient from "./ResourcesPageClient";

export default function ResourcesPage() {
  return (
    <Suspense fallback={<div>Loading resources...</div>}>
      <ResourcesPageClient />
    </Suspense>
  );
}
