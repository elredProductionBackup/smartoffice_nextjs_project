"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import SectionHeader from "@/_components/SectionHeader";
import AlliancesTable from "@/_components/Tables/AlliancesTable";
import AddAllianceModal from "@/_components/AddAllianceModal";

const TAB_CONFIG = {
  vendors: {
    modalTitle: "Add Vendor",
    subtitleKey: "location",
    subtitleLabel: "Location",
    fields: [
      { key: "name", label: "Vendor name", placeholder: "Enter vendor name" },
      { key: "location", label: "Location", placeholder: "Enter location" },
      { key: "email", label: "Email", placeholder: "Enter email", type: "email" },
      { key: "phone", label: "Phone", placeholder: "Enter phone number", type: "tel" },
    ],
  },
  resources: {
    modalTitle: "Add Resource",
    subtitleKey: "company",
    subtitleLabel: "Company/University",
    fields: [
      { key: "name", label: "Resource name", placeholder: "Enter resource name" },
      { key: "company", label: "Company/University", placeholder: "Enter company or university" },
      { key: "email", label: "Email", placeholder: "Enter email", type: "email" },
      { key: "phone", label: "Phone", placeholder: "Enter phone number", type: "tel" },
    ],
  },
};

export default function AlliancesPageClient() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab = TAB_CONFIG[tabParam] ? tabParam : "vendors";
  const config = TAB_CONFIG[tab];

  const [search, setSearch] = useState("");
  const [searchBy, setSearchBy] = useState("Name");
  const [isAddOpen, setIsAddOpen] = useState(false);
  // TODO: replace with API once vendor/resource endpoints are available
  const [items, setItems] = useState({ vendors: [], resources: [] });

  const rows = useMemo(() => {
    const list = items[tab].map((item) => ({
      ...item,
      subtitle: item[config.subtitleKey],
    }));
    if (search.length < 3) return list;
    const field = searchBy === "Email" ? "email" : "name";
    const q = search.toLowerCase();
    return list.filter((item) => item[field]?.toLowerCase().includes(q));
  }, [items, tab, config, search, searchBy]);

  const handleAdd = (values) => {
    setItems((prev) => ({
      ...prev,
      [tab]: [{ id: Date.now(), ...values }, ...prev[tab]],
    }));
    setIsAddOpen(false);
  };

  return (
    <div className="h-[calc(100vh-120px)] my-5 flex flex-col">
      <SectionHeader
        title="Vendor/Resources"
        tabs={[
          { key: "vendors", label: "Vendors" },
          { key: "resources", label: "Resources" },
        ]}
        search={search}
        onSearch={setSearch}
        searchBy={searchBy}
        setSearchBy={setSearchBy}
        searchByOptions={["Name", "Email"]}
        onAdd={() => setIsAddOpen(true)}
      />
      <div className="flex-1 flex flex-col min-h-0">
        <AlliancesTable
          data={rows}
          search={search}
          tab={tab}
          subtitleLabel={config.subtitleLabel}
        />
      </div>

      <AddAllianceModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onDone={handleAdd}
        title={config.modalTitle}
        fields={config.fields}
      />
    </div>
  );
}
