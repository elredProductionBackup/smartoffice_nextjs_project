"use client";

import { useSearchParams, useRouter } from "next/navigation";
import SectionHeader from "@/_components/SectionHeader";
import MembersTable from "@/_components/Tables/MembersTable";
import { useMembersData } from "@/hooks/useMembersData";
import { useState } from "react";
import MemberDetailsModal from "@/_components/MemberDetailsModal";

export default function MembersPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [searchBy, setSearchBy] = useState("Name");
  const tab = searchParams.get("tab") || "members";
  const page = Number(searchParams.get("page")) || 1;
  // const search = searchParams.get("search") || "";

  const [selectedMember, setSelectedMember] = useState(null);

  const openMember = (member) => {
    setSelectedMember(member);
  };

  const closeMember = () => {
    setSelectedMember(null);
  };

  const updateParams = (params) => {
    const q = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([k, v]) => q.set(k, v));
    router.replace(`?${q.toString()}`);
  };

  const { data, total, loading } = useMembersData({
    tab,
    page,
    search,
    searchBy,
    limit: 10,
  });

  return (
    <div className="h-[calc(100vh-120px)] my-5 flex flex-col">
      <SectionHeader
        title="Members"
        tabs={[
          { key: "members", label: "Members" },
          { key: "board", label: "Board" },
        ]}
        activeTab={tab}
        onTabChange={(key) =>
          updateParams({ tab: key, page: 1 })
        }
        search={search}
        onSearch={setSearch}
        searchBy={searchBy}
        setSearchBy={setSearchBy}
      />
      <div className="flex-1 flex flex-col min-h-0">
        <MembersTable
          data={data}
          total={total}
          currentPage={page}
          loading={loading}
          onPageChange={(p) => updateParams({ page: p })}
          onRowClick={openMember}
          search = {search}
          tab={tab}
        />
      </div>
        {selectedMember && (
        <MemberDetailsModal
          member={selectedMember}
          onClose={closeMember}
        />
      )}
    </div>
  );
}
