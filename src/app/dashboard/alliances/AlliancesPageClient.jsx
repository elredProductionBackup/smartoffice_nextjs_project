"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SectionHeader from "@/_components/SectionHeader";
import AlliancesTable from "@/_components/Tables/AlliancesTable";
import AddAllianceModal from "@/_components/AddAllianceModal";
import SuccessPopup from "@/_components/ConfirmationPopups/SuccessPopup";
import ConfirmPopup from "@/_components/ConfirmationPopups/ConfirmPopup";
import useInfiniteScrollObserver from "@/hooks/useInfiniteScroll";
import { addEditVendor, deleteVendor, getVendors } from "@/services/vendor.service";

const VENDOR_PAGE_SIZE = 10;

const TAB_CONFIG = {
  vendors: {
    modalTitle: "Add Vendor",
    subtitleKey: "location",
    subtitleLabel: "Location",
    searchByOptions: ["Name", "Location"],
    fields: [
      { key: "name", label: "Vendor name", placeholder: "Enter vendor name", minLength: 2, maxLength: 100 },
      { key: "location", label: "Location", placeholder: "Enter location", required: false, maxLength: 100 },
      { key: "email", label: "Email", placeholder: "Enter email", type: "email", required: false },
      { key: "phone", label: "Phone", placeholder: "Enter phone number", type: "tel", required: false },
    ],
  },
  resources: {
    modalTitle: "Add Resource",
    subtitleKey: "company",
    subtitleLabel: "Company/University",
    searchByOptions: ["Name", "Email"],
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
  // Success popup after adding or deleting: { title, message } | null
  const [success, setSuccess] = useState(null);

  // Vendor waiting for delete confirmation
  const [vendorToDelete, setVendorToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  // TODO: replace with API once resource endpoints are available
  const [resources, setResources] = useState([]);

  // Vendors come from GET /smartOffice/vendors
  const [vendors, setVendors] = useState([]);
  const [vendorTotal, setVendorTotal] = useState(0);
  const [vendorLoading, setVendorLoading] = useState(true);
  const [vendorLoadingMore, setVendorLoadingMore] = useState(false);
  const [vendorError, setVendorError] = useState(false);
  const requestIdRef = useRef(0); // drops responses from outdated searches

  // Each tab has its own search fields
  useEffect(() => {
    setSearchBy("Name");
  }, [tab]);

  const fetchVendors = useCallback(
    async (reset) => {
      const requestId = ++requestIdRef.current;
      reset ? setVendorLoading(true) : setVendorLoadingMore(true);
      setVendorError(false);

      try {
        const { result, totalCount } = await getVendors({
          searchBy: searchBy === "Location" ? "location" : "name",
          searchKey: search,
          start: reset ? 0 : vendors.length,
          offset: VENDOR_PAGE_SIZE,
        });
        if (requestId !== requestIdRef.current) return;

        const page = result.map((v) => ({ ...v, id: v.vendorId }));
        setVendors((prev) => (reset ? page : [...prev, ...page]));
        setVendorTotal(totalCount);
      } catch {
        if (requestId !== requestIdRef.current) return;
        setVendorError(true);
      } finally {
        if (requestId === requestIdRef.current) {
          setVendorLoading(false);
          setVendorLoadingMore(false);
        }
      }
    },
    [search, searchBy, vendors.length]
  );

  // Fresh list whenever the tab opens or the search changes
  useEffect(() => {
    if (tab === "vendors") fetchVendors(true);
  }, [tab, search, searchBy]);

  const hasMoreVendors = vendors.length < vendorTotal;
  const lastVendorRef = useInfiniteScrollObserver({
    hasMore: tab === "vendors" && hasMoreVendors && !vendorError,
    loading: vendorLoading || vendorLoadingMore,
    onLoadMore: () => fetchVendors(false),
  });

  const rows = useMemo(() => {
    if (tab === "vendors") {
      return vendors.map((item) => ({ ...item, subtitle: item.location }));
    }

    const list = resources.map((item) => ({ ...item, subtitle: item[config.subtitleKey] }));
    if (search.length < 3) return list;
    const field = searchBy === "Email" ? "email" : "name";
    const q = search.toLowerCase();
    return list.filter((item) => item[field]?.toLowerCase().includes(q));
  }, [tab, vendors, resources, config, search, searchBy]);

  // Errors are thrown back to the popup so it can show them and stay open
  const handleAdd = async (values) => {
    if (tab === "vendors") {
      await addEditVendor({ vendorId: "", ...values });
      setIsAddOpen(false);
      setSuccess({
        title: "Vendor added",
        message: `${values.name} has been added to your vendors.`,
      });
      fetchVendors(true); // list is newest first, so the new vendor shows on top
      return;
    }

    // TODO: save through addEditResource once available
    setResources((prev) => [{ id: Date.now(), ...values }, ...prev]);
    setIsAddOpen(false);
  };

  const openDeleteConfirm = (vendor) => {
    setDeleteError("");
    setVendorToDelete(vendor);
  };

  const handleDeleteVendor = async () => {
    if (!vendorToDelete || deleting) return;
    setDeleting(true);
    setDeleteError("");

    try {
      const cleared = await deleteVendor(vendorToDelete.vendorId);
      setVendors((prev) => prev.filter((v) => v.vendorId !== vendorToDelete.vendorId));
      setVendorTotal((prev) => Math.max(prev - 1, 0));

      setSuccess({
        title: "Vendor deleted",
        message: `${vendorToDelete.name} has been deleted. These records no longer have a vendor:`,
        stats: [
          { label: "Expenses", value: cleared.expensesCleared ?? 0 },
          { label: "Event costing lines", value: cleared.eventExpensesCleared ?? 0 },
          { label: "Approvals", value: cleared.approvalsCleared ?? 0 },
        ],
      });
      setVendorToDelete(null);
    } catch (err) {
      setDeleteError(err?.response?.data?.message || err?.message || "Couldn't delete the vendor. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const isVendors = tab === "vendors";

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
        searchByOptions={config.searchByOptions}
        onAdd={() => setIsAddOpen(true)}
      />
      <div className="flex-1 flex flex-col min-h-0">
        <AlliancesTable
          data={rows}
          search={search}
          tab={tab}
          subtitleLabel={config.subtitleLabel}
          loading={isVendors && vendorLoading}
          loadingMore={isVendors && vendorLoadingMore}
          error={isVendors && vendorError}
          onRetry={() => fetchVendors(vendors.length === 0)}
          lastRowRef={isVendors ? lastVendorRef : undefined}
          onDelete={isVendors ? openDeleteConfirm : undefined}
        />
      </div>

      <AddAllianceModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onDone={handleAdd}
        title={config.modalTitle}
        fields={config.fields}
      />

      <ConfirmPopup
        isOpen={!!vendorToDelete}
        title={`Delete ${vendorToDelete?.name ?? "this vendor"}?`}
        message="Any expenses, event costing lines and approvals linked to this vendor will no longer show a vendor."
        confirmText="Delete"
        isLoading={deleting}
        error={deleteError}
        onConfirm={handleDeleteVendor}
        onCancel={() => setVendorToDelete(null)}
      />

      <SuccessPopup
        isOpen={!!success}
        title={success?.title}
        message={success?.message}
        stats={success?.stats}
        onClose={() => setSuccess(null)}
      />
    </div>
  );
}
