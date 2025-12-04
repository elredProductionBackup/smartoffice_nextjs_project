
// "use client";

// import { useSearchParams } from "next/navigation";
// import SectionHeader from "@/_components/SectionHeader";
// import MembersTable from "@/_components/Tables/MembersTable";

// export default function MembersPage() {
//   const searchParams = useSearchParams();
//   const currentTab = searchParams.get("tab") || "members";

//   return (
//     <div className="">

//       <SectionHeader
//         title="Members"
//         tabs={[
//           { key: "members", label: "Members" },
//           { key: "board", label: "Board" },
//         ]}
//         searchPlaceholder="Search member"
//       />

//       {/* CONTENT BASED ON TAB */}
//       <div className="mt-6">
//         {currentTab === "members" && <div><MembersTable/></div>}
//         {currentTab === "board" && <div><MembersTable document={false}/></div>}
//       </div>

//     </div>
//   );
// }

// app/dashboard/members/page.jsx
import { Suspense } from "react";
import MembersPageClient from "./MembersPageClient";

export default function MembersPage() {
  return (
    <Suspense fallback={<div>Loading members...</div>}>
      <MembersPageClient />
    </Suspense>
  );
}
