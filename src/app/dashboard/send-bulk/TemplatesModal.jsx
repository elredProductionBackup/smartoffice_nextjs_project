"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FiX, FiPlus, FiSearch, FiChevronDown } from "react-icons/fi";

const STATUS_ORDER = ["rejected", "pending", "draft", "approved"];

const STATUS_META = {
  rejected: { label: "Rejected", heading: "REJECTED", pill: "bg-[#FEE2E2] text-[#B91C1C]" },
  pending: { label: "Pending", heading: "PENDING", pill: "bg-[#FEF3C7] text-[#B45309]" },
  draft: { label: "Draft", heading: "DRAFT", pill: "bg-[#E5E7EB] text-[#4B5563]" },
  approved: { label: "Approved", heading: "APPROVED", pill: "bg-[#DCFCE7] text-[#15803D]" },
};

function ChannelPill({ channel }) {
  const isWhatsApp = channel === "whatsapp";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[12px] font-semibold ${
        isWhatsApp ? "bg-[#DCFCE7] text-[#16a34a]" : "bg-[#EFF6FF] text-[#2563eb]"
      }`}
    >
      {isWhatsApp ? "WhatsApp" : "Email"}
    </span>
  );
}

export default function TemplatesModal({ templates, onClose, onNew, onEdit, onClone, onView }) {
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("All channels");
  const [statusFilter, setStatusFilter] = useState("All");
  const [channelOpen, setChannelOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const channelRef = useRef(null);
  const statusRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (channelRef.current && !channelRef.current.contains(e.target)) setChannelOpen(false);
      if (statusRef.current && !statusRef.current.contains(e.target)) setStatusOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const approvedForWhatsApp = templates.filter((t) => t.status === "approved" && t.channels.includes("whatsapp")).length;

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(search.trim().toLowerCase()) ||
        t.code.toLowerCase().includes(search.trim().toLowerCase());
      const matchesChannel = channelFilter === "All channels" || t.channels.includes(channelFilter);
      const matchesStatus = statusFilter === "All" || t.status === statusFilter;
      return matchesSearch && matchesChannel && matchesStatus;
    });
  }, [templates, search, channelFilter, statusFilter]);

  const grouped = STATUS_ORDER.map((status) => ({
    status,
    items: filtered.filter((t) => t.status === status),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-[16px] w-full max-w-[760px] mx-4 shadow-xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-7 pt-6 pb-4 border-b border-[#f1f5f9]">
          <div>
            <h2 className="text-[22px] font-bold text-[#1a1a2e] leading-tight">Templates</h2>
            <p className="text-[13px] text-[#888] mt-0.5">
              {templates.length} templates · {approvedForWhatsApp} approved for WhatsApp
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onNew}
              className="flex items-center gap-1.5 px-4 h-[38px] rounded-[8px] bg-[#2563eb] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] cursor-pointer whitespace-nowrap"
            >
              <FiPlus className="text-[15px]" />
              New template
            </button>
            <button onClick={onClose} className="text-[#999] hover:text-[#333] transition-colors cursor-pointer">
              <FiX className="text-[20px]" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="px-7 pt-4 flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 h-[42px] px-3 rounded-[8px] border border-[#d1d5db] focus-within:border-[#2563eb] transition-colors">
            <FiSearch className="text-[15px] text-[#9ca3af]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates"
              className="flex-1 text-[13px] outline-none placeholder:text-[#9ca3af]"
            />
          </div>

          <div ref={channelRef} className="relative">
            <button
              type="button"
              onClick={() => setChannelOpen((p) => !p)}
              className={`flex items-center gap-2 h-[42px] px-3 rounded-[8px] border text-[13px] bg-white cursor-pointer whitespace-nowrap ${
                channelOpen ? "border-[#2563eb]" : "border-[#d1d5db] hover:border-[#9ca3af]"
              }`}
            >
              {channelFilter}
              <FiChevronDown className={`text-[#6b7280] text-[14px] transition-transform duration-200 ${channelOpen ? "rotate-180" : ""}`} />
            </button>
            {channelOpen && (
              <div className="absolute z-30 right-0 mt-1 w-[160px] bg-white border border-[#e5e7eb] rounded-[10px] shadow-lg py-1.5 px-1.5">
                {["All channels", "whatsapp", "email"].map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setChannelFilter(c);
                      setChannelOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-[13px] rounded-[7px] cursor-pointer capitalize ${
                      channelFilter === c ? "bg-[#eff6ff] text-[#2563eb] font-medium" : "text-[#111] hover:bg-[#f9fafb]"
                    }`}
                  >
                    {c === "whatsapp" ? "WhatsApp" : c === "email" ? "Email" : c}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div ref={statusRef} className="relative">
            <button
              type="button"
              onClick={() => setStatusOpen((p) => !p)}
              className={`flex items-center gap-2 h-[42px] px-3 rounded-[8px] border text-[13px] bg-white cursor-pointer whitespace-nowrap ${
                statusOpen ? "border-[#2563eb]" : "border-[#d1d5db] hover:border-[#9ca3af]"
              }`}
            >
              {statusFilter}
              <FiChevronDown className={`text-[#6b7280] text-[14px] transition-transform duration-200 ${statusOpen ? "rotate-180" : ""}`} />
            </button>
            {statusOpen && (
              <div className="absolute z-30 right-0 mt-1 w-[140px] bg-white border border-[#e5e7eb] rounded-[10px] shadow-lg py-1.5 px-1.5">
                {["All", "rejected", "pending", "draft", "approved"].map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setStatusFilter(s);
                      setStatusOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-[13px] rounded-[7px] cursor-pointer capitalize ${
                      statusFilter === s ? "bg-[#eff6ff] text-[#2563eb] font-medium" : "text-[#111] hover:bg-[#f9fafb]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-7 py-5">
          {grouped.length === 0 && (
            <div className="py-16 text-center text-[13px] text-[#9ca3af]">No templates match your search.</div>
          )}

          {grouped.map(({ status, items }) => (
            <div key={status} className="mb-6 last:mb-0">
              <p className="text-[12px] font-bold tracking-wide text-[#9ca3af] mb-3">
                {STATUS_META[status].heading} · {items.length}
              </p>
              <div className="flex flex-col gap-3">
                {items.map((t) => (
                  <div key={t.id} className="border border-[#e5e7eb] rounded-[12px] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-[15px] font-bold text-[#1a1a2e]">{t.name}</h3>
                        <p className="text-[12px] text-[#9ca3af] font-mono">{t.code}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {status === "rejected" && (
                          <button
                            onClick={() => onClone(t)}
                            className="px-4 h-[36px] rounded-[8px] bg-[#2563eb] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] cursor-pointer whitespace-nowrap"
                          >
                            Clone and fix
                          </button>
                        )}
                        {status === "pending" && (
                          <button
                            onClick={() => onView(t)}
                            className="px-4 h-[36px] rounded-[8px] border border-[#d1d5db] text-[13px] font-semibold text-[#333] hover:bg-[#f9fafb] cursor-pointer whitespace-nowrap"
                          >
                            View
                          </button>
                        )}
                        {status === "draft" && (
                          <>
                            <button
                              onClick={() => onEdit(t)}
                              className="px-4 h-[36px] rounded-[8px] border border-[#d1d5db] text-[13px] font-semibold text-[#333] hover:bg-[#f9fafb] cursor-pointer whitespace-nowrap"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => onEdit(t)}
                              className="px-4 h-[36px] rounded-[8px] bg-[#2563eb] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] cursor-pointer whitespace-nowrap"
                            >
                              Submit to Meta
                            </button>
                          </>
                        )}
                        {status === "approved" && (
                          <button
                            onClick={() => onView(t)}
                            className="px-4 h-[36px] rounded-[8px] border border-[#d1d5db] text-[13px] font-semibold text-[#333] hover:bg-[#f9fafb] cursor-pointer whitespace-nowrap"
                          >
                            View
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap mt-3">
                      {t.channels.map((c) => (
                        <ChannelPill key={c} channel={c} />
                      ))}
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[12px] font-semibold bg-[#F3F4F6] text-[#4B5563]">
                        {t.category}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[12px] font-semibold ${STATUS_META[status].pill}`}>
                        {STATUS_META[status].label}
                      </span>
                    </div>

                    {status === "rejected" && t.rejectionReason && (
                      <p className="text-[13px] text-[#B91C1C] mt-3">{t.rejectionReason}</p>
                    )}
                    {status === "pending" && t.submittedNote && (
                      <p className="text-[13px] text-[#9ca3af] mt-3">{t.submittedNote}</p>
                    )}
                    {(status === "draft" || status === "approved") && t.editedNote && (
                      <p className="text-[13px] text-[#9ca3af] mt-3">{t.editedNote}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
