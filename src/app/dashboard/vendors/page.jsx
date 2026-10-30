import { Suspense } from "react";
import VendorsPageClient from "./VendorsPageClient";

export default function VendorsPage() {
  return (
    <Suspense fallback={<div>Loading vendors...</div>}>
      <VendorsPageClient />
    </Suspense>
  );
}
