"use client";

import { useSearchParams } from "next/navigation";
import SectionHeader from "@/_components/SectionHeader";
import MembersTable from "@/_components/Tables/MembersTable";
import ActionableHeader from "@/_components/ActionableHeader";

export default function ActionablePageClient() {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "members";

  return (
    <div>
      <ActionableHeader
        title="Actionable"
       
        // searchPlaceholder="Search member"
      />

      {/* <div className="mt-6">
        {currentTab === "members" && (
          <div>
            <MembersTable />
          </div>
        )}
        {currentTab === "board" && (
          <div>
            <MembersTable document={false} />
          </div>
        )}
      </div> */}
    </div>
  );
}
