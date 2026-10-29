"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import SectionHeader from "@/_components/SectionHeader";
import AlliancesTable from "@/_components/Tables/AlliancesTable";
import AddAllianceModal from "@/_components/AddAllianceModal";
import AllianceDetailsModal from "@/_components/AllianceDetailsModal";
import SuccessPopup from "@/_components/ConfirmationPopups/SuccessPopup";
import ConfirmPopup from "@/_components/ConfirmationPopups/ConfirmPopup";
import useInfiniteScrollObserver from "@/hooks/useInfiniteScroll";
import useNotes from "@/hooks/useNotes";
import { addEditVendor, deleteVendor, getVendors } from "@/services/vendor.service";
import { addEditResource, deleteResource, getResources, updateResourceType } from "@/services/resource.service";
import { addToast } from "@/store/toastSlice";

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
    save: (values, id = "") => addEditVendor({ ...values, vendorId: id }),
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
    showLinkedin: true,
    searchBy: { Name: "name", "Company/University": "organization" },
    fields: [
      { key: "name", label: "Resource name", placeholder: "Enter resource name", minLength: 2, maxLength: 100 },
      { key: "organization", label: "Company/University", placeholder: "Enter company or university", required: false, maxLength: 150 },
      { key: "email", label: "Email", placeholder: "Enter email", type: "email", required: false },
      { key: "phone", label: "Phone", placeholder: "Enter phone number", type: "tel", required: false },
      { key: "linkedInUrl", label: "LinkedIn URL", placeholder: "Enter LinkedIn profile URL", type: "linkedin", required: false, maxLength: 300 },
    ],
    fetchList: getResources,
    save: (values, id = "") => addEditResource({ ...values, resourceId: id }),
    remove: deleteResource,
    saveStages: (id, type) => updateResourceType({ resourceId: id, type }),
    deleteWarning: "This resource will be removed from your list.",
    deleteSuccess: (item) => ({ message: `${item.name} has been deleted.` }),
  },
};

export default function AlliancesPageClient() {
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab = TAB_CONFIG[tabParam] ? tabParam : "vendors";
  const config = TAB_CONFIG[tab];

  const [search, setSearch] = useState("");
  const [searchBy, setSearchBy] = useState("Name");
  // Add/edit popup; editingItem is the row being edited (null when adding)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // List for the active tab
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const requestIdRef = useRef(0); // drops responses from outdated tabs/searches
  const nextStartRef = useRef(0); // where the next page starts on the server (read by fetches)
  const [nextStart, setNextStartState] = useState(0); // same value, for rendering (hasMore)
  const setNextStart = useCallback((value) => {
    nextStartRef.current = value;
    setNextStartState(value);
  }, []);
  const stageRequestRef = useRef({}); // { [rowId]: latest stage save }, so only the newest failure rolls back

  // Success popup after adding or deleting: { title, message, stats? } | null
  const [success, setSuccess] = useState(null);

  // Row whose details popup is open
  const [selectedItem, setSelectedItem] = useState(null);

  // Row waiting for delete confirmation
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Note waiting for delete confirmation: { item, noteId } | null
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [deletingNote, setDeletingNote] = useState(false);
  const [deleteNoteError, setDeleteNoteError] = useState("");

  // Notes kept against each row
  const { notes, loadingNotes, loadNotes, addNote, editNote, deleteNote, clearNotes } =
    useNotes(tab);

  // Each tab has its own search fields: reset them while rendering the new tab
  // (instead of in an effect) so the first fetch for the tab already uses "Name"
  const [prevTab, setPrevTab] = useState(tab);
  if (prevTab !== tab) {
    setPrevTab(tab);
    setSearchBy("Name");
    setSelectedItem(null);
  }

  const fetchItems = useCallback(
    async (reset) => {
      const requestId = ++requestIdRef.current;
      reset ? setLoading(true) : setLoadingMore(true);
      setError(false);
      if (reset) {
        setItems([]);
        setNextStart(0);
      }
      const start = nextStartRef.current;

      try {
        const { result, totalCount } = await config.fetchList({
          searchBy: config.searchBy[searchBy] ?? "name",
          searchKey: search,
          start,
          offset: PAGE_SIZE,
        });
        if (requestId !== requestIdRef.current) return;

        setNextStart(start + result.length);
        const page = result.map((item) => ({ ...item, id: item[config.idKey] }));
        // A row can come back again if the list changed on the server between pages
        setItems((prev) => {
          if (reset) return page;
          const loadedIds = new Set(prev.map((item) => item.id));
          return [...prev, ...page.filter((item) => !loadedIds.has(item.id))];
        });
        setTotal(totalCount);
        // Nothing left to load, even if totalCount says otherwise
        if (!reset && result.length === 0) setTotal(start);
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
    [config, search, searchBy, setNextStart]
  );

  // Fresh list whenever the tab opens or the search changes
  useEffect(() => {
    fetchItems(true);
  }, [tab, search, searchBy]);

  const lastRowRef = useInfiniteScrollObserver({
    hasMore: nextStart < total && !error,
    loading: loading || loadingMore,
    onLoadMore: () => fetchItems(false),
  });

  const rows = useMemo(
    () =>
      items
        .map((item) => ({ ...item, subtitle: item[config.subtitleKey] }))
        // A–Z by name; only sorts the pages loaded so far
        .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "", undefined, { sensitivity: "base" })),
    [items, config]
  );

  const openAdd = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  // Errors are thrown back to the popup so it can show them and stay open
  const handleSave = async (values) => {
    const label = config.modalTitle.replace("Add ", "");

    if (editingItem) {
      const saved = await config.save(values, editingItem.id);
      // Update the row in place so the list keeps its scroll position
      setItems((prev) =>
        prev.map((item) =>
          item.id === editingItem.id ? { ...item, ...values, ...(saved || {}), id: item.id } : item
        )
      );
      setIsFormOpen(false);
      setEditingItem(null);
      setSuccess({ title: `${label} updated`, message: `${values.name} has been updated.` });
      return;
    }

    await config.save(values);
    setIsFormOpen(false);
    setSuccess({
      title: `${label} added`,
      message: `${values.name} has been added to your ${tab}.`,
    });
    fetchItems(true); // list is newest first, so the new row shows on top
  };

  // Ticks show straight away; on failure the row goes back to its previous stages
  const handleStageChange = async (item, type) => {
    const previous = Array.isArray(item.type) ? item.type : [];
    const requestId = (stageRequestRef.current[item.id] ?? 0) + 1;
    stageRequestRef.current[item.id] = requestId;
    const setRowType = (value) =>
      setItems((prev) => prev.map((row) => (row.id === item.id ? { ...row, type: value } : row)));

    setRowType(type);
    try {
      await config.saveStages(item.id, type);
    } catch (err) {
      if (stageRequestRef.current[item.id] !== requestId) return;
      setRowType(previous);
      dispatch(
        addToast({
          message: {
            title: "Couldn't update stages",
            descrip: err?.response?.data?.message || err?.message || "Please try again.",
          },
          type: "error",
        })
      );
    }
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
      setNextStart(Math.max(nextStartRef.current - 1, 0)); // the server list shrank too
      clearNotes(itemToDelete.id);

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

  const openDeleteNoteConfirm = (item, noteId) => {
    setDeleteNoteError("");
    setNoteToDelete({ item, noteId });
  };

  const handleDeleteNote = async () => {
    if (!noteToDelete || deletingNote) return;
    setDeletingNote(true);
    setDeleteNoteError("");

    try {
      await deleteNote(noteToDelete.item.id, noteToDelete.noteId);
      setSuccess({
        title: "Note deleted",
        message: `The note has been removed from ${noteToDelete.item.name}.`,
      });
      setNoteToDelete(null);
    } catch (err) {
      setDeleteNoteError(
        err?.response?.data?.message || err?.message || "Couldn't delete the note. Please try again."
      );
    } finally {
      setDeletingNote(false);
    }
  };

  return (
    <div className="md:h-[calc(100vh-120px)] my-5 pb-20 md:pb-0 flex flex-col">
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
        onAdd={openAdd}
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
          onEdit={openEdit}
          onDelete={openDeleteConfirm}
          onRowClick={setSelectedItem}
          notes={notes}
          loadingNotes={loadingNotes}
          onOpenNotes={(item) => loadNotes(item.id)}
          onAddNote={(item, text) => addNote(item.id, text)}
          onEditNote={(item, noteId, text) => editNote(item.id, noteId, text)}
          onDeleteNote={openDeleteNoteConfirm}
          onStageChange={config.saveStages && handleStageChange}
        />
      </div>

      {selectedItem && (
        <AllianceDetailsModal
          item={selectedItem}
          subtitleLabel={config.subtitleLabel}
          showLinkedin={config.showLinkedin}
          onClose={() => setSelectedItem(null)}
        />
      )}

      <AddAllianceModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingItem(null);
        }}
        onDone={handleSave}
        title={editingItem ? config.modalTitle.replace("Add", "Edit") : config.modalTitle}
        fields={config.fields}
        initialValues={editingItem}
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

      <ConfirmPopup
        isOpen={!!noteToDelete}
        title="Delete this note?"
        message={`This note will be removed from ${noteToDelete?.item.name ?? `this ${config.singular}`}.`}
        confirmText="Delete"
        isLoading={deletingNote}
        error={deleteNoteError}
        onConfirm={handleDeleteNote}
        onCancel={() => setNoteToDelete(null)}
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
