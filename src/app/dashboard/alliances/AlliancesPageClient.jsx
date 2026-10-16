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
import { addEditResource, deleteResource, getResources } from "@/services/resource.service";

const PAGE_SIZE = 10;

// Everything that differs between the two tabs
const TAB_CONFIG = {
  vendors: {
    singular: "vendor",
    idKey: "vendorId",
    modalTitle: "Add Vendor",
    subtitleKey: "location",
    subtitleLabel: "Location",
    // dropdown label -> searchBy sent to the API
    searchBy: { Name: "name", Location: "location" },
    fields: [
      { key: "name", label: "Vendor name", placeholder: "Enter vendor name", minLength: 2, maxLength: 100 },
      { key: "location", label: "Location", placeholder: "Enter location", required: false, maxLength: 100 },
      { key: "email", label: "Email", placeholder: "Enter email", type: "email", required: false },
      { key: "phone", label: "Phone", placeholder: "Enter phone number", type: "tel", required: false },
    ],
    fetchList: getVendors,
    save: (values) => addEditVendor({ vendorId: "", ...values }),
    remove: deleteVendor,
    deleteWarning: "Any expenses, event costing lines and approvals linked to this vendor will no longer show a vendor.",
    // deleteVendor returns how many linked records lost the vendor
    deleteSuccess: (item, cleared) => ({
      message: `${item.name} has been deleted. These records no longer have a vendor:`,
      stats: [
        { label: "Expenses", value: cleared.expensesCleared ?? 0 },
        { label: "Event costing lines", value: cleared.eventExpensesCleared ?? 0 },
        { label: "Approvals", value: cleared.approvalsCleared ?? 0 },
      ],
    }),
  },
  resources: {
    singular: "resource",
    idKey: "resourceId",
    modalTitle: "Add Resource",
    subtitleKey: "organization",
    subtitleLabel: "Company/University",
    searchBy: { Name: "name", "Company/University": "organization" },
    fields: [
      { key: "name", label: "Resource name", placeholder: "Enter resource name", minLength: 2, maxLength: 100 },
      { key: "organization", label: "Company/University", placeholder: "Enter company or university", required: false, maxLength: 150 },
      { key: "email", label: "Email", placeholder: "Enter email", type: "email", required: false },
      { key: "phone", label: "Phone", placeholder: "Enter phone number", type: "tel", required: false },
    ],
    fetchList: getResources,
    save: (values) => addEditResource({ resourceId: "", ...values }),
    remove: deleteResource,
    deleteWarning: "This resource will be removed from your list.",
    deleteSuccess: (item) => ({ message: `${item.name} has been deleted.` }),
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

  // List for the active tab
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const requestIdRef = useRef(0); // drops responses from outdated tabs/searches

  // Success popup after adding or deleting: { title, message, stats? } | null
  const [success, setSuccess] = useState(null);

  // Row waiting for delete confirmation
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Each tab has its own search fields
  useEffect(() => {
    setSearchBy("Name");
  }, [tab]);

  const fetchItems = useCallback(
    async (reset) => {
      const requestId = ++requestIdRef.current;
      reset ? setLoading(true) : setLoadingMore(true);
      setError(false);
      if (reset) setItems([]);

      try {
        const { result, totalCount } = await config.fetchList({
          searchBy: config.searchBy[searchBy] ?? "name",
          searchKey: search,
          start: reset ? 0 : items.length,
          offset: PAGE_SIZE,
        });
        if (requestId !== requestIdRef.current) return;

        const page = result.map((item) => ({ ...item, id: item[config.idKey] }));
        setItems((prev) => (reset ? page : [...prev, ...page]));
        setTotal(totalCount);
      } catch {
        if (requestId !== requestIdRef.current) return;
        setError(true);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [config, search, searchBy, items.length]
  );

  // Fresh list whenever the tab opens or the search changes
  useEffect(() => {
    fetchItems(true);
  }, [tab, search, searchBy]);

  const lastRowRef = useInfiniteScrollObserver({
    hasMore: items.length < total && !error,
    loading: loading || loadingMore,
    onLoadMore: () => fetchItems(false),
  });

  const rows = useMemo(
    () => items.map((item) => ({ ...item, subtitle: item[config.subtitleKey] })),
    [items, config]
  );

  // Errors are thrown back to the popup so it can show them and stay open
  const handleAdd = async (values) => {
    await config.save(values);
    setIsAddOpen(false);
    setSuccess({
      title: `${config.modalTitle.replace("Add ", "")} added`,
      message: `${values.name} has been added to your ${tab}.`,
    });
    fetchItems(true); // list is newest first, so the new row shows on top
  };

  const openDeleteConfirm = (item) => {
    setDeleteError("");
    setItemToDelete(item);
  };

  const handleDelete = async () => {
    if (!itemToDelete || deleting) return;
    setDeleting(true);
    setDeleteError("");

    try {
      const response = await config.remove(itemToDelete.id);
      setItems((prev) => prev.filter((item) => item.id !== itemToDelete.id));
      setTotal((prev) => Math.max(prev - 1, 0));

      setSuccess({
        title: `${config.modalTitle.replace("Add ", "")} deleted`,
        ...config.deleteSuccess(itemToDelete, response),
      });
      setItemToDelete(null);
    } catch (err) {
      setDeleteError(
        err?.response?.data?.message || err?.message || `Couldn't delete the ${config.singular}. Please try again.`
      );
    } finally {
      setDeleting(false);
    }
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
        searchByOptions={Object.keys(config.searchBy)}
        onAdd={() => setIsAddOpen(true)}
      />
      <div className="flex-1 flex flex-col min-h-0">
        <AlliancesTable
          data={rows}
          search={search}
          tab={tab}
          subtitleLabel={config.subtitleLabel}
          loading={loading}
          loadingMore={loadingMore}
          error={error}
          onRetry={() => fetchItems(items.length === 0)}
          lastRowRef={lastRowRef}
          onDelete={openDeleteConfirm}
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
        isOpen={!!itemToDelete}
        title={`Delete ${itemToDelete?.name ?? `this ${config.singular}`}?`}
        message={config.deleteWarning}
        confirmText="Delete"
        isLoading={deleting}
        error={deleteError}
        onConfirm={handleDelete}
        onCancel={() => setItemToDelete(null)}
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
