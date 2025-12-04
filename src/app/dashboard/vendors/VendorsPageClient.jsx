"use client";

import { useSearchParams } from "next/navigation";
import SectionHeader from "@/_components/SectionHeader";
import VendorTable from "@/_components/Tables/VendorTable";

export default function VendorsPageClient() {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "hotels"; // default tab matches keys

  return (
    <div>
      <SectionHeader
        title="Vendors"
        tabs={[
          { key: "hotels", label: "Hotels" },
          { key: "transports", label: "Transports" },
          { key: "it-services", label: "IT Services" },
          { key: "beverage", label: "Beverage" },
        ]}
        searchPlaceholder="Search vendor"
      />

      {/* CONTENT BASED ON TAB */}
      <div className="mt-6">
        {currentTab === "hotels" && <VendorTable />}
        {currentTab === "transports" && <div>Transports Component</div>}
        {currentTab === "it-services" && <div>IT Services Component</div>}
        {currentTab === "beverage" && <div>Beverages Component</div>}
      </div>
    </div>
  );
}
