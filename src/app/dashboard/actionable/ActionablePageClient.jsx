"use client";

import { useSearchParams } from "next/navigation";
import SectionHeader from "@/_components/SectionHeader";
import MembersTable from "@/_components/Tables/MembersTable";
import ActionableHeader from "@/_components/ActionableHeader";
import { useDatepicker } from "@/store/useDatePicker";

export default function ActionablePageClient() {
  const openDatepicker = useDatepicker((s) => s.openDatepicker);

  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "members";

  return (
    <div>
      <ActionableHeader
        title="Actionable"
       
        // searchPlaceholder="Search member"
      />

      <div>
      <button
      onClick={() =>
        openDatepicker({
          date: new Date(),
          onConfirm: (date) => {
            console.log("Selected:", date);
          },
        })
      }
      className="px-4 py-2 bg-blue-600 text-white rounded"
    >
      Move
    </button>
      </div>
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
