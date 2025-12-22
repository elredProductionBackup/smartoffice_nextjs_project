"use client";

// import SectionHeader from "@/_components/SectionHeader";
// import MembersTable from "@/_components/Tables/MembersTable";
import { useSearchParams } from "next/navigation";
import ActionableHeader from "@/_components/ActionableHeader";
import ActionableTabs from "@/_components/ActionableTabs";
import ActionItems from "@/_components/ActionItems";


export default function ActionablePageClient() {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "members";

  return (
   <div className="h-[100%] flex flex-1 flex-col">
      <ActionableHeader
        title="Actionable"
        taskCount={24}
        refresh
      />
      <ActionableTabs />
      <ActionItems />
    </div>
  );
}
