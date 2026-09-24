"use client";

import { useEffect, useRef, useState } from "react";
import { FiX, FiChevronDown, FiTrash2, FiAlertTriangle } from "react-icons/fi";

function initials(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function AddMemberControl({ groupName, contacts, onAddMember }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const available = contacts
    .filter((c) => !c.groups?.includes(groupName))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div ref={ref} className="relative mt-3">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between h-[38px] px-3 rounded-[8px] border border-dashed border-[#93c5fd] text-[13px] font-semibold text-[#2563eb] hover:bg-[#eff6ff] cursor-pointer transition-colors"
      >
        Add member
        <FiChevronDown className={`text-[14px] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-30 w-full mt-1 bg-white border border-[#e5e7eb] rounded-[10px] shadow-lg py-1.5 px-1.5 max-h-[220px] overflow-y-auto">
          {available.length === 0 && (
            <div className="px-3 py-2.5 text-[13px] text-[#9ca3af]">Everyone is already in this group.</div>
          )}
          {available.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                onAddMember(groupName, c.id);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-left rounded-[7px] hover:bg-[#f9fafb] cursor-pointer"
            >
              <div className="w-6 h-6 min-w-[24px] rounded-full bg-[#E5E7EB] text-[#555] grid place-items-center text-[10px] font-bold">
                {initials(c.name)}
              </div>
              <span className="truncate">{c.name}</span>
              {c.groups?.length > 0 && (
                <span className="text-[11px] text-[#9ca3af] ml-auto whitespace-nowrap">in {c.groups.join(", ")}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GroupsModal({
  contacts,
  groups,
  onClose,
  onCreateGroup,
  onAddMember,
  onRemoveMember,
  onDeleteGroup,
}) {
  const [newGroupName, setNewGroupName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [pendingRemove, setPendingRemove] = useState(null); // { groupName, member }

  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState("");

  const openRemove = (groupName, member) => {
    setRemoveError("");
    setPendingRemove({ groupName, member });
  };

  const closeRemove = () => {
    if (removing) return;
    setPendingRemove(null);
  };

  const confirmRemove = async () => {
    if (!pendingRemove || removing) return;
    setRemoving(true);
    setRemoveError("");
    try {
      await onRemoveMember(pendingRemove.groupName, pendingRemove.member.id);
      setPendingRemove(null);
    } catch (error) {
      setRemoveError(error?.response?.data?.message || error?.message || "Failed to remove member");
    } finally {
      setRemoving(false);
    }
  };

  const [pendingDeleteGroup, setPendingDeleteGroup] = useState(null); // { groupName, memberCount }
  const [deletingGroup, setDeletingGroup] = useState(false);
  const [deleteGroupError, setDeleteGroupError] = useState("");

  const openDeleteGroup = (groupName, memberCount) => {
    setDeleteGroupError("");
    setPendingDeleteGroup({ groupName, memberCount });
  };

  const closeDeleteGroup = () => {
    if (deletingGroup) return;
    setPendingDeleteGroup(null);
  };

  const confirmDeleteGroup = async () => {
    if (!pendingDeleteGroup || deletingGroup) return;
    setDeletingGroup(true);
    setDeleteGroupError("");
    try {
      await onDeleteGroup(pendingDeleteGroup.groupName);
      setPendingDeleteGroup(null);
    } catch (error) {
      setDeleteGroupError(error?.response?.data?.message || error?.message || "Failed to delete group");
    } finally {
      setDeletingGroup(false);
    }
  };

  const handleCreate = async () => {
    const trimmed = newGroupName.trim();
    if (!trimmed || creating) return;

    setCreating(true);
    setCreateError("");
    try {
      await onCreateGroup(trimmed);
      setNewGroupName("");
    } catch (error) {
      setCreateError(error?.response?.data?.message || error?.message || "Failed to create group");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-[16px] w-full max-w-[620px] mx-4 shadow-xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-7 pt-6 pb-4 border-b border-[#f1f5f9]">
          <div>
            <h2 className="text-[22px] font-bold text-[#1a1a2e] leading-tight">Groups</h2>
            <p className="text-[13px] text-[#888] mt-0.5">
              {groups.length} groups · {contacts.length} contacts
            </p>
          </div>
          <button onClick={onClose} className="text-[#999] hover:text-[#333] transition-colors cursor-pointer mt-1">
            <FiX className="text-[20px]" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-7 py-5">
          {/* Create a group */}
          <div className="bg-[#eff6ff] rounded-[12px] p-4 mb-5">
            <label className="block text-[14px] font-bold text-[#2563eb] mb-2">Create a group</label>
            <div className="flex items-center gap-2">
              <input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="e.g., Cluster3 Network"
                className="flex-1 h-[42px] px-3 rounded-[8px] border border-[#d1d5db] bg-white text-[13px] text-[#111] outline-none focus:border-[#2563eb] transition-colors placeholder:text-[#9ca3af]"
              />
              <button
                onClick={handleCreate}
                disabled={!newGroupName.trim() || creating}
                className={`px-5 h-[42px] rounded-[8px] text-[13px] font-semibold whitespace-nowrap transition-colors ${
                  newGroupName.trim() && !creating
                    ? "bg-[#2563eb] text-white hover:bg-[#1d4ed8] cursor-pointer"
                    : "bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed"
                }`}
              >
                {creating ? "Creating…" : "Create group"}
              </button>
            </div>
            {createError && <p className="text-[12px] text-red-600 mt-2">{createError}</p>}
          </div>

          {/* Group list */}
          <div className="flex flex-col gap-4">
            {groups.map((groupName) => {
              const members = contacts
                .filter((c) => c.groups?.includes(groupName))
                .sort((a, b) => a.name.localeCompare(b.name));
              return (
                <div key={groupName} className="border border-[#e5e7eb] rounded-[12px] p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[15px] font-bold text-[#1a1a2e]">{groupName}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] text-[#9ca3af]">
                        {members.length} member{members.length === 1 ? "" : "s"}
                      </span>
                      <button
                        onClick={() => openDeleteGroup(groupName, members.length)}
                        title="Delete group"
                        className="text-red-500 hover:bg-red-50 rounded-[6px] p-1.5 cursor-pointer transition-colors"
                      >
                        <FiTrash2 className="text-[15px]" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {members.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-1.5 bg-[#eff6ff] rounded-full pl-1 pr-2 py-1 text-[13px] font-medium text-[#1a1a2e]"
                      >
                        <div className="w-6 h-6 min-w-[24px] rounded-full bg-[#6366F1] text-white grid place-items-center text-[10px] font-bold">
                          {initials(m.name)}
                        </div>
                        {m.name}
                        <button
                          onClick={() => openRemove(groupName, m)}
                          title="Remove from group"
                          className="text-[#6b7280] hover:text-red-500 cursor-pointer ml-0.5"
                        >
                          <FiX className="text-[13px]" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <AddMemberControl groupName={groupName} contacts={contacts} onAddMember={onAddMember} />
                </div>
              );
            })}

            {groups.length === 0 && (
              <div className="py-10 text-center text-[13px] text-[#9ca3af]">
                No groups yet. Create one above to get started.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-7 py-4 border-t border-[#f1f5f9]">
          <button
            onClick={onClose}
            className="px-6 h-[42px] rounded-[8px] bg-[#2563eb] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>

      {pendingRemove && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40"
          onClick={(e) => {
            e.stopPropagation();
            closeRemove();
          }}
        >
          <div
            className="bg-white rounded-[16px] w-full max-w-[360px] mx-4 shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[16px] font-bold text-[#1a1a2e] mb-1.5">Remove from group?</h3>
            <p className="text-[13px] text-[#666] mb-5">
              <span className="font-semibold text-[#1a1a2e]">{pendingRemove.member.name}</span> will be removed from{" "}
              <span className="font-semibold text-[#1a1a2e]">{pendingRemove.groupName}</span>. They&apos;ll stay in
              your contacts and any other groups.
            </p>
            {removeError && <p className="text-[12px] text-red-600 mb-3">{removeError}</p>}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={closeRemove}
                disabled={removing}
                className="px-5 h-[38px] rounded-[8px] border border-[#d1d5db] text-[13px] font-semibold text-[#333] hover:bg-[#f9fafb] cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemove}
                disabled={removing}
                className="px-5 h-[38px] rounded-[8px] bg-red-500 text-white text-[13px] font-semibold hover:bg-red-600 cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {removing ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingDeleteGroup && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40"
          onClick={(e) => {
            e.stopPropagation();
            closeDeleteGroup();
          }}
        >
          <div
            className="bg-white rounded-[16px] w-full max-w-[380px] mx-4 shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <FiAlertTriangle className="text-[18px] text-red-600" />
              <h3 className="text-[16px] font-bold text-[#1a1a2e]">Delete group?</h3>
            </div>
            <p className="text-[13px] text-[#666] mb-5">
              <span className="font-semibold text-[#1a1a2e]">{pendingDeleteGroup.groupName}</span> and all{" "}
              <span className="font-semibold text-[#1a1a2e]">
                {pendingDeleteGroup.memberCount} contact{pendingDeleteGroup.memberCount === 1 ? "" : "s"}
              </span>{" "}
              in it will be deleted. Members of other groups stay in those groups. This can&apos;t be undone.
            </p>
            {deleteGroupError && <p className="text-[12px] text-red-600 mb-3">{deleteGroupError}</p>}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={closeDeleteGroup}
                disabled={deletingGroup}
                className="px-5 h-[38px] rounded-[8px] border border-[#d1d5db] text-[13px] font-semibold text-[#333] hover:bg-[#f9fafb] cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteGroup}
                disabled={deletingGroup}
                className="px-5 h-[38px] rounded-[8px] bg-red-500 text-white text-[13px] font-semibold hover:bg-red-600 cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {deletingGroup ? "Deleting…" : "Delete group"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
