"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  HiChevronDown,
  HiEllipsisVertical,
  HiOutlineLightBulb,
  HiOutlinePencilSquare,
  HiOutlinePlus,
  HiOutlineTrash,
} from "react-icons/hi2";
import MembersTableShimmer from "@/_components/Shimmer/MembersTableShimmer";
import MultiStatusSelect from "@/_components/UI/MultiStatusSelect";

// Outreach stages for each resource (several can be ticked); only shown on the Resources tab. Saved as the resource's `type`
const RESOURCE_STAGE_OPTIONS = [
  { value: "initial_mail_sent", label: "Initial mail sent", dotClassName: "bg-slate-400" },
  { value: "reminder_mail_sent", label: "Reminder mail sent", dotClassName: "bg-amber-500" },
  { value: "connected_agreed", label: "Connected / agreed for practice", dotClassName: "bg-sky-500" },
  { value: "connected_vc", label: "Connected via VC", dotClassName: "bg-blue-600" },
  { value: "whatsapp_group_created", label: "WhatsApp group created", dotClassName: "bg-emerald-500" },
  { value: "pd_asked", label: "Practice details asked", dotClassName: "bg-violet-500" },
  { value: "pd_received", label: "Practice details received", dotClassName: "bg-green-600" },
  { value: "pd_reminded", label: "Reminded for PD", dotClassName: "bg-orange-500" },
];

// Three-dot menu at the end of a row. Opens upwards near the bottom of the list.
const RowMenu = ({ onEdit, onAddNote, onDelete, openUp }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div
      className="relative ml-auto"
      ref={menuRef}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-10 h-10 grid place-items-center rounded-full hover:bg-[#D4DFF1] transition-colors cursor-pointer"
        aria-label="More actions"
      >
        <HiEllipsisVertical className="text-2xl text-[#333]" />
      </button>

      {open && (
        <div
          className={`absolute right-0 z-20 w-[220px] rounded-[20px] bg-white p-3 ${
            openUp ? "bottom-full mb-2" : "top-full mt-2"
          }`}
          style={{ boxShadow: "0px 4px 4px 0px #99999940" }}
        >
          {onEdit && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
              className="w-full flex items-center gap-3 rounded-[8px] px-2 py-2 text-[18px] font-medium text-[#333] hover:bg-[#F2F7FF] cursor-pointer"
            >
              <HiOutlinePencilSquare className="text-2xl" />
              Edit
            </button>
          )}
          {onAddNote && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onAddNote();
              }}
              className="w-full flex items-center gap-3 rounded-[8px] px-2 py-2 text-[18px] font-medium text-[#333] hover:bg-[#F2F7FF] cursor-pointer"
            >
              <HiOutlineLightBulb className="text-2xl" />
              Add note
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="w-full flex items-center gap-3 rounded-[8px] px-2 py-2 text-[18px] font-medium text-red-600 hover:bg-red-50 cursor-pointer"
          >
            <HiOutlineTrash className="text-2xl" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

// Add/edit-note form; mounted fresh each time it opens, so it starts from initialText
const NoteForm = ({ initialText = "", onCancel, onSave }) => {
  const [text, setText] = useState(initialText);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const trimmed = text.trim();
  const unchanged = trimmed === initialText.trim();

  const save = async () => {
    if (!trimmed || saving) return;
    if (unchanged) return onCancel();
    setSaving(true);
    setError("");
    try {
      await onSave(trimmed);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Couldn't save the note. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="rounded-[12px] bg-white border border-[#D4DFF1] p-4">
      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) save();
        }}
        maxLength={1000}
        rows={3}
        placeholder="Write a note…"
        className="w-full resize-none text-[18px] text-[#333] placeholder:text-[#999] outline-none"
      />
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
      <div className="flex items-center justify-between gap-3 mt-2">
        <span className="text-sm text-[#999]">{text.length}/1000</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="px-5 py-2 rounded-full border border-[#BCBCD9] text-[16px] font-medium text-[#333] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!trimmed || unchanged || saving}
            className="px-5 py-2 rounded-full bg-gradient-to-r from-[#5597ED] to-[#00449C] text-[16px] font-medium text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Expanded area under a row: the add form and the saved notes (newest first)
const NotesPanel = ({
  notes,
  loading,
  isAdding,
  onStartAdd,
  onCancelAdd,
  onSave,
  onEdit, // (noteId, text) => Promise; shows the edit icon when passed
  onDelete,
}) => {
  const [editingId, setEditingId] = useState(null); // note being edited in place

  return (
    <div
      className="pl-[94px] pr-[30px] pb-[20px] flex flex-col gap-3"
      onClick={(e) => e.stopPropagation()}
    >
      {isAdding && <NoteForm onCancel={onCancelAdd} onSave={onSave} />}

      {loading && notes.length === 0 && (
        <p className="text-[16px] text-[#999]">Loading notes...</p>
      )}
      {!loading && !isAdding && notes.length === 0 && (
        <p className="text-[16px] text-[#999]">No notes yet</p>
      )}

      {notes.map((t) =>
        editingId === t.id ? (
          <NoteForm
            key={t.id}
            initialText={t.text}
            onCancel={() => setEditingId(null)}
            onSave={async (text) => {
              await onEdit(t.id, text);
              setEditingId(null);
            }}
          />
        ) : (
          <div
            key={t.id}
            className="group flex items-start gap-3 rounded-[12px] bg-white px-4 py-3"
          >
            <HiOutlineLightBulb className="mt-1 shrink-0 text-xl text-[#F59E0B]" />
            <div className="flex-1 min-w-0">
              <p className="text-[18px] text-[#333] whitespace-pre-wrap break-words">
                {t.text}
              </p>
              <p className="text-sm text-[#999] mt-1">{formatDate(t.createdAt)}</p>
            </div>
            {onEdit && (
              <button
                type="button"
                onClick={() => setEditingId(t.id)}
                className="shrink-0 w-8 h-8 grid place-items-center rounded-full text-[#999] hover:text-[#00449C] hover:bg-[#F2F7FF] cursor-pointer"
                aria-label="Edit note"
                title="Edit note"
              >
                <HiOutlinePencilSquare className="text-lg" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onDelete(t.id)}
              className="shrink-0 w-8 h-8 grid place-items-center rounded-full text-[#999] hover:text-red-600 hover:bg-red-50 cursor-pointer"
              aria-label="Delete note"
              title="Delete note"
            >
              <HiOutlineTrash className="text-lg" />
            </button>
          </div>
        )
      )}

      {!isAdding && (
        <button
          type="button"
          onClick={onStartAdd}
          className="self-start flex items-center gap-2 text-[16px] font-semibold text-[#00449C] cursor-pointer"
        >
          <HiOutlinePlus className="text-lg" />
          Add note
        </button>
      )}
    </div>
  );
};

export default function AlliancesTable({
  data = [],
  search = "",
  tab,
  subtitleLabel = "",
  loading = false,
  loadingMore = false,
  error = false,
  onRetry = () => {},
  lastRowRef,
  onEdit, // (item) => void; adds Edit to the row menu
  onDelete, // (item) => void; the row menu only shows when this is passed
  onRowClick, // (item) => void; opens the details popup
  notes = {}, // { [rowId]: [{ id, text, createdAt }] }
  loadingNotes = {}, // { [rowId]: true } while that row's notes load
  onOpenNotes, // (item) => void; called when a row's notes are opened
  onAddNote, // (item, text) => void; adds "Add note" to the row menu
  onEditNote, // (item, noteId, text) => Promise; adds an edit icon to each note
  onDeleteNote, // (item, noteId) => void
  onStageChange, // (item, stages) => void; shows the stage menu on the Resources tab
}) {
  const isSearching = search?.length >= 3;
  const isEmpty = data.length === 0;
  const showStage = tab === "resources" && !!onStageChange;
  // Room for the stage menu icon (40px + 16px gap) next to the other actions
  const actionsWidth = showStage ? "w-[276px]" : "w-[220px]";
  const [expanded, setExpanded] = useState({}); // { [rowId]: true } for rows showing their notes
  const [addingFor, setAddingFor] = useState(null); // row whose add-note form is open

  const toggleExpanded = (item) => {
    if (!expanded[item.id]) onOpenNotes?.(item);
    setExpanded((prev) => ({ ...prev, [item.id]: !prev[item.id] }));
    if (addingFor === item.id) setAddingFor(null);
  };

  const startAdding = (item) => {
    onOpenNotes?.(item);
    setExpanded((prev) => ({ ...prev, [item.id]: true }));
    setAddingFor(item.id);
  };

  if (loading) return <MembersTableShimmer />;

  return (
    <div className="flex-1 min-h-0 mt-[20px] rounded-[20px] bg-[#F2F7FF] overflow-y-auto relative flex flex-col">
      {/* Table Header */}
      <div className="flex items-center font-bold text-lg text-[#333333] px-[30px] sticky top-0 bg-[#F2F7FF] py-3 pt-6 z-10">
        <div className="flex-1">Name/{subtitleLabel}</div>
        <div className={`${actionsWidth} shrink-0`}>Actions</div>
      </div>

      {/* Error State (nothing loaded yet) */}
      {isEmpty && error && (
        <div className="flex flex-col justify-center items-center h-[calc(100vh-340px)] text-center">
          <div className="mb-3 text-2xl font-semibold text-[#333333]">
            Couldn&apos;t load {tab}
          </div>
          <div className="text-base font-normal text-[#666666] mb-6">
            Something went wrong. Please try again.
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-full bg-gradient-to-r from-[#5597ED] to-[#00449C] px-6 py-2 text-white cursor-pointer"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty State */}
      {isEmpty && !error && (
        <div className="flex flex-col justify-center items-center h-[calc(100vh-340px)] text-center">
          <div className="h-[80px] w-[80px] rounded-full bg-[#D3E3FD] grid place-items-center mb-[30px]">
            <Image
              src={isSearching ? "/logo/no-search.svg" : "/logo/no-member.svg"}
              alt="Fallback logo"
              width={50}
              height={50}
            />
          </div>

          {isSearching ? (
            <>
              <div className="mb-3 text-2xl font-semibold text-[#333333]">
                No search result found
              </div>
              <div className="text-base font-normal text-[#666666]">
                Try adjusting your search or filters.
              </div>
            </>
          ) : (
            <>
              <div className="mb-3 text-2xl font-semibold text-[#333333]">
                No {tab} yet
              </div>
              <div className="text-base font-normal text-[#666666]">
                Looks like you haven’t added any {tab} yet
              </div>
            </>
          )}
        </div>
      )}

      {/* Rows */}
      <div className="flex-1">
        {data.map((item, index) => {
          const rowNotes = notes[item.id] || [];
          const isAdding = addingFor === item.id;
          const isExpanded = !!expanded[item.id];

          return (
            <div
              key={item.id}
              ref={index === data.length - 1 ? lastRowRef : undefined}
              className={`
              transition-colors duration-200
              ${isExpanded ? "bg-[#E7F0FF]" : "bg-[#F2F7FF]"}
              ${index !== data.length - 1 ? "border-b border-b-[#D4DFF1]" : ""}
            `}
            >
              <div
                onClick={() => onRowClick?.(item)}
                className={`
              flex flex-1 items-center py-[20px] px-[30px] ${onRowClick ? "cursor-pointer" : ""}
              transition-all duration-200
              hover:bg-[#E7F0FF]
              hover:shadow-[0px_4px_4px_0px_#C7C7C740]
            `}
              >
                {/* LEFT - Name + subtitle */}
                <div className="flex flex-1 min-w-0 items-center gap-4">
                  <div className="min-w-[48px] h-[48px] bg-[#D4DFF1] grid place-items-center text-[22px] font-[600] rounded-full uppercase">
                    {item.name?.slice(0, 1)}
                  </div>
                  {/* Text is kept narrow: long descriptions wrap onto more lines (making the row taller), then are cut off */}
                  <div className="min-w-0 max-w-[600px]">
                    <p
                      className="font-semibold text-xl text-[#333333] line-clamp-2 break-words"
                      title={item.name}
                    >
                      {item.name}
                    </p>
                    <p
                      className="text-[20px] text-[#666666] font-[500] capitalize line-clamp-3 break-words"
                      title={item.subtitle}
                    >
                      {item.subtitle}
                    </p>

                    {/* Shows / hides the notes under the row */}
                    {onAddNote && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpanded(item);
                        }}
                        aria-expanded={isExpanded}
                        className="mt-2 flex items-center gap-1.5 rounded-full bg-[#FEF3C7] px-3 py-1 text-[14px] font-semibold text-[#92400E] cursor-pointer hover:bg-[#FDE68A]"
                      >
                        <HiOutlineLightBulb className="text-base" />
                        Notes
                        <HiChevronDown
                          className={`text-base transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </button>
                    )}
                  </div>
                </div>

                {/* RIGHT - Action Icons */}
                <div
                  className={`flex ${actionsWidth} shrink-0 items-center gap-4 text-[#666666]`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Stage menu (resources only) */}
                  {showStage && (
                    <MultiStatusSelect
                      value={Array.isArray(item.type) ? item.type : []}
                      onChange={(value) => onStageChange(item, value)}
                      options={RESOURCE_STAGE_OPTIONS}
                      label="Outreach stages"
                      openUp={data.length > 3 && index >= data.length - 2}
                    />
                  )}

                  <Link
                    href={`https://wa.me/${item.phone?.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-[#E6EBF2] rounded-full flex items-center justify-center cursor-pointer"
                    title="Chat on WhatsApp"
                  >
                    <span className="ic--baseline-whatsapp"></span>
                  </Link>

                  <Link
                    href={`mailto:${item.email}`}
                    className="w-10 h-10 bg-[#E6EBF2] rounded-full flex items-center justify-center cursor-pointer"
                    title={item.email}
                  >
                    <span className="oui--email"></span>
                  </Link>

                  <Link
                    href={`tel:${item.phone}`}
                    className="w-10 h-10 bg-[#E6EBF2] rounded-full flex items-center justify-center cursor-pointer"
                    title={item.phone}
                  >
                    <span className="proicons--call"></span>
                  </Link>

                  {onDelete && (
                    <RowMenu
                      onEdit={onEdit && (() => onEdit(item))}
                      onAddNote={
                        onAddNote && (() => startAdding(item))
                      }
                      onDelete={() => onDelete(item)}
                      openUp={data.length > 3 && index >= data.length - 2}
                    />
                  )}
                </div>
              </div>

              {isExpanded && (
                <NotesPanel
                  notes={rowNotes}
                  loading={!!loadingNotes[item.id]}
                  isAdding={isAdding}
                  onStartAdd={() => setAddingFor(item.id)}
                  onCancelAdd={() => setAddingFor(null)}
                  onSave={async (text) => {
                    await onAddNote(item, text);
                    setAddingFor(null);
                  }}
                  onEdit={onEditNote && ((noteId, text) => onEditNote(item, noteId, text))}
                  onDelete={(noteId) =>
                    onDeleteNote?.(item, noteId)
                  }
                />
              )}
            </div>
          );
        })}

        {/* Next page */}
        {loadingMore && (
          <div className="py-4 text-center text-[#666666]">Loading more...</div>
        )}
        {!isEmpty && error && !loadingMore && (
          <div className="py-4 text-center text-[#666666]">
            Couldn&apos;t load more {tab}.{" "}
            <button
              type="button"
              onClick={onRetry}
              className="text-[#00449C] font-semibold cursor-pointer"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
