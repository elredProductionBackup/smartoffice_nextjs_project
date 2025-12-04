// "use client";

// import { useSearchParams } from "next/navigation";
// import SectionHeader from "@/_components/SectionHeader";

// export default function ResourcesPage() {
//   const searchParams = useSearchParams();
//   const currentTab = searchParams.get("tab") || "members";

//   return (
//     <div className="">

//       <SectionHeader
//         title="Resources"
//         // tabs={[
//         //   { key: "hotels", label: "Hotels" },
//         //   { key: "transports", label: "Transports" },
//         //   { key: "it-services", label: "IT Services" },
//         //   { key: "beverage", label: "Beverage" },
//         // ]}
//         searchPlaceholder="Search resources"
//       />

//       {/* CONTENT BASED ON TAB */}
//       <div className="mt-6">
//         {currentTab === "hotels" && <div>Hotel List Component</div>}
//         {currentTab === "transports" && <div>Transports Component</div>}
//         {currentTab === "it-services" && <div>IT Services Component</div>}
//         {currentTab === "beverage" && <div>Beverages Component</div>}
//       </div>

//     </div>
//   );
// }


import { Suspense } from "react";
import ResourcesPageClient from "./ResourcesPageClient";

export default function ResourcesPage() {
  return (
    <Suspense fallback={<div>Loading resources...</div>}>
      <ResourcesPageClient />
    </Suspense>
  );
}
