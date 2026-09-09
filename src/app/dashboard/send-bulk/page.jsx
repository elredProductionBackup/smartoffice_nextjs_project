import { Suspense } from "react";
import SendBulkPageClient from "./SendBulkPageClient";

export default function SendBulkPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 grid place-items-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SendBulkPageClient />
    </Suspense>
  );
}
