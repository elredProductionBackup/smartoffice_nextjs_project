"use client";

import { useState } from "react";
import { FiX, FiTrash2, FiAlertTriangle, FiCheckCircle } from "react-icons/fi";

const DELETED_HOLD_MS = 1200;

export default function GroupsModal({
  contacts,
  groups,
  partialGroups,
  onClose,
  onCreateGroup,
  onDeleteGroup,
}) {
  const [newGroupName, setNewGroupName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [pendingDeleteGroup, setPendingDeleteGroup] = useState(null); // { groupName, memberCount }
  const [deleteGroupStatus, setDeleteGroupStatus] = useState("idle"); // idle | deleting | deleted
  const deletingGroup = deleteGroupStatus !== "idle";
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
    setDeleteGroupStatus("deleting");
    setDeleteGroupError("");
    try {
      await onDeleteGroup(pendingDeleteGroup.groupName);
      setDeleteGroupStatus("deleted");
      setTimeout(() => {
        setPendingDeleteGroup(null);
        setDeleteGroupStatus("idle");
      }, DELETED_HOLD_MS);
    } catch (error) {
      setDeleteGroupError(error?.response?.data?.message || error?.message || "Failed to delete group");
      setDeleteGroupStatus("idle");
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
        className="bg-white rounded-[16px] w-full max-w-[620px] mx-4 shadow-xl flex flex-col max-h-[90dvh] md:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-5 md:px-7 md:pt-6 pb-4 border-b border-[#f1f5f9]">
          <div>
            <h2 className="text-[22px] font-bold text-[#1a1a2e] leading-tight">Groups</h2>
            <p className="text-[13px] text-[#888] mt-0.5">
              {groups.length} groups · {contacts.length} contacts
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-[#999] hover:text-[#333] transition-colors cursor-pointer mt-1 max-md:p-2 max-md:-m-2">
            <FiX className="text-[20px]" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 md:px-7 py-5">
          {/* Create a group */}
          <div className="bg-[#eff6ff] rounded-[12px] p-4 mb-5">
            <label className="block text-[14px] font-bold text-[#2563eb] mb-2">Create a group</label>
            <div className="flex items-center gap-2">
              <input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="e.g., Cluster3 Network"
                className="flex-1 min-w-0 h-[42px] px-3 rounded-[8px] border border-[#d1d5db] bg-white text-[16px] md:text-[13px] text-[#111] outline-none focus:border-[#2563eb] transition-colors placeholder:text-[#9ca3af]"
              />
              <button
                onClick={handleCreate}
                disabled={!newGroupName.trim() || creating}
                className={`px-4 md:px-5 h-[42px] rounded-[8px] text-[13px] font-semibold whitespace-nowrap transition-colors ${
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
          <div className="flex flex-col gap-2.5">
            {groups.map((groupName) => {
              const memberCount = contacts.filter((c) => c.groups?.includes(groupName)).length;
              return (
                <div
                  key={groupName}
                  className="flex items-center justify-between gap-2 border border-[#e5e7eb] rounded-[12px] pl-4 pr-2 py-2.5"
                >
                  <h3 className="min-w-0 truncate text-[15px] font-bold text-[#1a1a2e]">{groupName}</h3>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[13px] text-[#9ca3af]">
                      {memberCount}
                      {/* The server may hold more than it returned */}
                      {partialGroups?.has(groupName) && "+"} member{memberCount === 1 ? "" : "s"}
                    </span>
                    <button
                      onClick={() => openDeleteGroup(groupName, memberCount)}
                      title="Delete group"
                      className="text-red-500 hover:bg-red-50 rounded-[6px] p-2.5 md:p-1.5 cursor-pointer transition-colors"
                    >
                      <FiTrash2 className="text-[15px]" />
                    </button>
                  </div>
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
        <div className="flex items-center justify-end px-5 md:px-7 py-4 border-t border-[#f1f5f9]">
          <button
            onClick={onClose}
            className="px-6 h-[42px] rounded-[8px] bg-[#2563eb] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>

      {pendingDeleteGroup && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40"
          onClick={(e) => {
            e.stopPropagation();
            closeDeleteGroup();
          }}
        >
          <div
            className="bg-white rounded-[16px] w-full max-w-[380px] mx-4 shadow-xl p-5 md:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {deleteGroupStatus === "idle" && (
              <>
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
                    className="px-5 h-[38px] rounded-[8px] border border-[#d1d5db] text-[13px] font-semibold text-[#333] hover:bg-[#f9fafb] cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteGroup}
                    className="px-5 h-[38px] rounded-[8px] bg-red-500 text-white text-[13px] font-semibold hover:bg-red-600 cursor-pointer transition-colors"
                  >
                    Delete group
                  </button>
                </div>
              </>
            )}

            {deleteGroupStatus === "deleting" && (
              <div className="flex flex-col items-center py-3 gap-3">
                <div className="w-8 h-8 border-[3px] border-red-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-[13px] font-semibold text-[#333]">Deleting {pendingDeleteGroup.groupName}…</p>
              </div>
            )}

            {deleteGroupStatus === "deleted" && (
              <div className="flex flex-col items-center py-3 gap-2">
                <FiCheckCircle className="text-[32px] text-green-500" />
                <p className="text-[14px] font-semibold text-[#1a1a2e]">Group deleted</p>
                <p className="text-[12px] text-[#888] max-w-full truncate">{pendingDeleteGroup.groupName}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
