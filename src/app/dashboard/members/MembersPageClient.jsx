"use client";

import { useSearchParams } from "next/navigation";
import SectionHeader from "@/_components/SectionHeader";
import MembersTable from "@/_components/Tables/MembersTable";

export default function MembersPageClient() {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "members";

  return (
    <div>
      <SectionHeader
        title="Members"
        tabs={[
          { key: "members", label: "Members" },
          { key: "board", label: "Board" },
        ]}
        searchPlaceholder="Search member"
      />

      <div className="mt-6">
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
      </div>
    </div>
  );
}
