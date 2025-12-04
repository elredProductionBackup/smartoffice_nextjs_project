// 'use client'
// import { useState } from "react";
// import SectionHeader from "@/_components/SectionHeader";
// import { usePathname } from "next/navigation";


// export default function MembersPage() {
//   const [activeTab, setActiveTab] = useState("Members");
//   const URL = usePathname()

//   console.log(URL)

//   return (
//     <h2 className="text-2xl">
//       <div className="">
//         <SectionHeader
//           title="Members"
//           tabs={["Members", "Board"]}
//           activeTab={activeTab}
//           onTabChange={setActiveTab}
//           searchPlaceholder="Search member"
//           onSearch={(val) => console.log("Searching:", val)}
//         />

//         {/* Page Content */}
//         <div className="mt-6">
//           {activeTab === "Members" && <div>Members list appears here</div>}
//           {activeTab === "Board" && <div>Board list appears here</div>}
//         </div>
//       </div>
//     </h2>
//   );
// }

//2nd one
"use client";

import { useSearchParams } from "next/navigation";
import SectionHeader from "@/_components/SectionHeader";
import MembersTable from "@/_components/Tables/MembersTable";

export default function MembersPage() {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "members";

  return (
    <div className="">

      <SectionHeader
        title="Members"
        tabs={[
          { key: "members", label: "Members" },
          { key: "board", label: "Board" },
        ]}
        searchPlaceholder="Search member"
      />

      {/* CONTENT BASED ON TAB */}
      <div className="mt-6">
        {currentTab === "members" && <div><MembersTable/></div>}
        {currentTab === "board" && <div><MembersTable document={false}/></div>}
      </div>

    </div>
  );
}
