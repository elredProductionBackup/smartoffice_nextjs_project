"use client";

import { useSearchParams } from "next/navigation";
import SectionHeader from "@/_components/SectionHeader";

export default function ResourcesPageClient() {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "hotels"; // default tab

  return (
    <div>

      <SectionHeader
        title="Resources"
        // Enable tabs whenever needed
        // tabs={[
        //   { key: "hotels", label: "Hotels" },
        //   { key: "transports", label: "Transports" },
        //   { key: "it-services", label: "IT Services" },
        //   { key: "beverage", label: "Beverage" },
        // ]}
        searchPlaceholder="Search resources"
      />

      <div className="mt-6">
        {currentTab === "hotels" && <div>Hotel List Component</div>}
        {currentTab === "transports" && <div>Transports Component</div>}
        {currentTab === "it-services" && <div>IT Services Component</div>}
        {currentTab === "beverage" && <div>Beverages Component</div>}
      </div>

    </div>
  );
}
