"use client";

// import SectionHeader from "@/_components/SectionHeader";
// import MembersTable from "@/_components/Tables/MembersTable";
import { useSearchParams } from "next/navigation";
import ActionableHeader from "@/_components/ActionableHeader";
import ActionableTabs from "@/_components/ActionableTabs";
import ActionItems from "@/_components/ActionItems";
import { useSelector } from "react-redux";

const ACTION_TABS = [
  { label: "All", value: "all" },
];

export default function ActionablePageClient() {
    const { total } = useSelector((state) => state.actionable);

  return (
   <div className="h-[calc(100vh-120px)] flex flex-col">
      <ActionableHeader
        title="Actionable"
        taskCount={total}
        refresh
      />

      <ActionableTabs tabs={ACTION_TABS}
          defaultTab="all"/>

      <ActionItems />
    </div>
  );
}
