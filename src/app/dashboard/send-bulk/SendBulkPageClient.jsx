"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiArrowRight,
  FiMessageCircle,
  FiList,
  FiUsers,
  FiChevronDown,
  FiCheck,
  FiPlus,
  FiSearch,
  FiClock,
  FiCheckSquare,
  FiMenu,
} from "react-icons/fi";
import { BsCheckAll } from "react-icons/bs";
import CustomCheckbox from "@/_components/UI/CustomCheckbox";
import GroupsModal from "./GroupsModal";
import ContactsModal from "./ContactsModal";
import TemplatesModal from "./TemplatesModal";
import TemplateFormModal from "./TemplateFormModal";
import ConfirmSendModal from "./ConfirmSendModal";
import { INITIAL_TEMPLATES, humanizeCode, slugify } from "./templatesData";

const TEMPLATES = [
  {
    id: "prive_workshop_registration_confirmation",
    label: "Prive workshop registration confirmation",
    body:
      "Hi {name},\n\nA quick reminder about the {cluster} review meet at {site} on {date}. Please arrive ten minutes early and bring your site checklist.\n\nTeam Smart Networks",
  },
  {
    id: "prive_media",
    label: "Prive media",
    body:
      "Hi {name},\n\nThanks for joining the {cluster} sync today. Notes and action items from the meet at {site} will follow shortly.\n\nTeam Smart Networks",
  },
];

const SAMPLE_VALUES = {
  cluster: "North Cluster",
  site: "Andheri West",
  date: "12 Sep, 6:00 PM",
};

const BUILTIN_VARIABLES = ["name", "cluster", "site", "date"];

const INITIAL_GROUPS = [];

const INITIAL_CONTACTS = [];

const DEFAULT_SELECTED = [];

const GROUPS_STORAGE_KEY = "sendbulk_groups";
const CONTACTS_STORAGE_KEY = "sendbulk_contacts";

function loadFromStorage(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore write failures (e.g. storage disabled or full)
  }
}

function initials(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function SendBulkPageClient() {
  const router = useRouter();
  const textareaRef = useRef(null);

  const [templateId, setTemplateId] = useState(TEMPLATES[0].id);
  const [templateOpen, setTemplateOpen] = useState(false);
  const templateRef = useRef(null);

  const [channels, setChannels] = useState({ whatsapp: true, email: false });
  const [activeTab, setActiveTab] = useState("whatsapp");

  const [messages, setMessages] = useState({
    whatsapp: TEMPLATES[0].body,
    email: "",
  });
  const [emailSubject, setEmailSubject] = useState(TEMPLATES[0].label);

  const [contacts, setContacts] = useState(() => loadFromStorage(CONTACTS_STORAGE_KEY, INITIAL_CONTACTS));
  const [groupList, setGroupList] = useState(() => loadFromStorage(GROUPS_STORAGE_KEY, INITIAL_GROUPS));
  const [groupsModalOpen, setGroupsModalOpen] = useState(false);
  const [contactsModalMode, setContactsModalMode] = useState(null);
  const [templates, setTemplates] = useState(INITIAL_TEMPLATES);
  const [templatesPanel, setTemplatesPanel] = useState(null);

  const [selectedIds, setSelectedIds] = useState(new Set(DEFAULT_SELECTED));
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("All groups");
  const [showAllContacts, setShowAllContacts] = useState(false);
  const CONTACTS_PAGE_SIZE = 5;
  const [groupFilterOpen, setGroupFilterOpen] = useState(false);
  const groupFilterRef = useRef(null);
  const [sendToMenuOpen, setSendToMenuOpen] = useState(false);
  const sendToMenuRef = useRef(null);
  const [messageMenuOpen, setMessageMenuOpen] = useState(false);
  const messageMenuRef = useRef(null);

  const [notice, setNotice] = useState("");

  const [step, setStep] = useState(1);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(e) {
      if (templateRef.current && !templateRef.current.contains(e.target)) {
        setTemplateOpen(false);
      }
      if (groupFilterRef.current && !groupFilterRef.current.contains(e.target)) {
        setGroupFilterOpen(false);
      }
      if (sendToMenuRef.current && !sendToMenuRef.current.contains(e.target)) {
        setSendToMenuOpen(false);
      }
      if (messageMenuRef.current && !messageMenuRef.current.contains(e.target)) {
        setMessageMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 2500);
    return () => clearTimeout(t);
  }, [notice]);

  useEffect(() => {
    saveToStorage(CONTACTS_STORAGE_KEY, contacts);
  }, [contacts]);

  useEffect(() => {
    saveToStorage(GROUPS_STORAGE_KEY, groupList);
  }, [groupList]);

  const showComingSoon = (label) => setNotice(`${label} — coming soon`);

  const handleTemplateSelect = (tpl) => {
    setTemplateId(tpl.id);
    setTemplateOpen(false);
    setMessages((prev) => ({ ...prev, [activeTab]: tpl.body }));
    setEmailSubject(tpl.label);
  };

  const selectChannel = (key) => {
    setChannels({ whatsapp: key === "whatsapp", email: key === "email" });
    setActiveTab(key);
  };

  const insertVariable = (token) => {
    const el = textareaRef.current;
    const current = messages[activeTab] || "";
    if (!el) {
      setMessages((prev) => ({ ...prev, [activeTab]: current + token }));
      return;
    }
    const start = el.selectionStart ?? current.length;
    const end = el.selectionEnd ?? current.length;
    const next = current.slice(0, start) + token + current.slice(end);
    setMessages((prev) => ({ ...prev, [activeTab]: next }));
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const toggleContact = (contact) => {
    if (!contact.hasWhatsApp && activeTab === "whatsapp" && !channels.email) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(contact.id)) next.delete(contact.id);
      else next.add(contact.id);
      return next;
    });
  };

  const createGroup = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (groupList.some((g) => g.toLowerCase() === trimmed.toLowerCase())) return;
    setGroupList((prev) => [...prev, trimmed]);
  };

  const deleteGroup = (name) => {
    setGroupList((prev) => prev.filter((g) => g !== name));
    setContacts((prev) => prev.map((c) => (c.group === name ? { ...c, group: null } : c)));
    if (groupFilter === name) setGroupFilter("All groups");
  };

  const addMemberToGroup = (name, contactId) => {
    setContacts((prev) => prev.map((c) => (c.id === contactId ? { ...c, group: name } : c)));
  };

  const removeMemberFromGroup = (contactId) => {
    setContacts((prev) => prev.map((c) => (c.id === contactId ? { ...c, group: null } : c)));
  };

  const addContact = (newContact) => {
    const id = `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setContacts((prev) => [...prev, { id, ...newContact }]);
  };

  const importContacts = (newContacts) => {
    setContacts((prev) => [
      ...prev,
      ...newContacts.map((c, i) => ({ id: `c-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 5)}`, ...c })),
    ]);
  };

  const deleteContact = (contactId) => {
    setContacts((prev) => prev.filter((c) => c.id !== contactId));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(contactId);
      return next;
    });
  };

  const deleteAllContacts = () => {
    setContacts([]);
    setSelectedIds(new Set());
  };

  const openTemplatesList = () => setTemplatesPanel({ view: "list" });
  const closeTemplatesPanel = () => setTemplatesPanel(null);
  const openNewTemplate = () => setTemplatesPanel({ view: "form", mode: "new", template: null });
  const openEditTemplate = (t) => setTemplatesPanel({ view: "form", mode: "edit", template: t });
  const openCloneTemplate = (t) => setTemplatesPanel({ view: "form", mode: "clone", template: t });
  const openViewTemplate = (t) => setTemplatesPanel({ view: "form", mode: "view", template: t });

  const upsertTemplate = (payload, status, extra) => {
    const editingId = templatesPanel?.mode === "edit" ? templatesPanel.template.id : null;
    setTemplates((prev) => {
      if (editingId) {
        return prev.map((t) =>
          t.id === editingId
            ? { ...t, ...payload, status, rejectionReason: undefined, submittedNote: undefined, ...extra }
            : t
        );
      }
      const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const code = payload.code || slugify(payload.name) || id;
      return [...prev, { id, ...payload, code, name: payload.name || humanizeCode(code), status, ...extra }];
    });
  };

  const handleSaveTemplateDraft = (payload) => {
    upsertTemplate(payload, "draft", { editedNote: "Edited just now" });
    setNotice("Template saved as draft");
    openTemplatesList();
  };

  const handleSubmitTemplate = (payload) => {
    upsertTemplate(payload, "pending", { submittedNote: "Submitted just now · usually approved within an hour" });
    setNotice("Template submitted to Meta for review");
    openTemplatesList();
  };

  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(search.trim().toLowerCase());
      const matchesGroup = groupFilter === "All groups" || c.group === groupFilter;
      return matchesSearch && matchesGroup;
    });
  }, [contacts, search, groupFilter]);

  const visibleContacts = showAllContacts ? filteredContacts : filteredContacts.slice(0, CONTACTS_PAGE_SIZE);

  const selectableInFilter = filteredContacts.filter((c) => c.hasWhatsApp || channels.email);
  const allFilteredSelected =
    selectableInFilter.length > 0 && selectableInFilter.every((c) => selectedIds.has(c.id));

  const handleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        selectableInFilter.forEach((c) => next.delete(c.id));
      } else {
        selectableInFilter.forEach((c) => next.add(c.id));
      }
      return next;
    });
  };

  const selectedContacts = contacts.filter((c) => selectedIds.has(c.id));
  const firstSelectedName = selectedContacts[0]?.name || "there";

  const previewText = (messages[activeTab] || "")
    .replaceAll("{name}", firstSelectedName)
    .replaceAll("{cluster}", SAMPLE_VALUES.cluster)
    .replaceAll("{site}", SAMPLE_VALUES.site)
    .replaceAll("{date}", SAMPLE_VALUES.date);

  const charCount = (messages[activeTab] || "").length;
  const activeTemplate = TEMPLATES.find((t) => t.id === templateId);

  const whatsappCount = selectedContacts.filter((c) => c.hasWhatsApp).length;
  const emailCount = selectedContacts.length;

  const now = new Date();
  const previewTime = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  const activeChannelLabels = [channels.whatsapp && "WhatsApp", channels.email && "Email"]
    .filter(Boolean)
    .join(", ");
  const deliverableContacts = selectedContacts.filter(
    (c) => (channels.whatsapp && c.hasWhatsApp) || channels.email
  );
  const sendingLabel = "Immediately";

  const handleGoToReview = () => {
    setStep(2);
  };

  const handleConfirmSend = (payload) => {
    // TODO: send { attendeeName, workshopName, workshopDate, sessionTime, arrivalTime, venue } to backend
    console.log("Confirm send payload", payload);
    setConfirmModalOpen(false);
    setNotice("Details confirmed");
  };

  return (
    <div className="pt-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-xl bg-white shadow-[0px_2px_6px_rgba(0,0,0,0.08)] flex items-center justify-center cursor-pointer text-[#333]"
        >
          <FiArrowLeft className="text-[18px]" />
        </button>
        <h1 className="text-2xl font-bold text-[#1a1a2e]">New broadcast</h1>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setStep(1)}
          className={`flex items-center gap-2 cursor-pointer ${step !== 1 ? "" : "pointer-events-none"}`}
        >
          <div
            className={`w-7 h-7 rounded-full border-2 grid place-items-center text-[13px] font-bold ${
              step > 1
                ? "bg-[#2563eb] border-[#2563eb] text-white"
                : "border-[#2563eb] text-[#2563eb]"
            }`}
          >
            {step > 1 ? <FiCheck className="text-[14px]" /> : 1}
          </div>
          <span className={`text-[15px] font-semibold ${step === 1 ? "text-[#2563eb]" : "text-[#2563eb]"}`}>
            Compose and recipients
          </span>
        </button>
        <div className={`w-10 h-[2px] ${step === 2 ? "bg-[#2563eb]" : "bg-[#d1d5db]"}`} />
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full border-2 grid place-items-center text-[13px] font-bold ${
              step === 2 ? "border-[#2563eb] text-[#2563eb]" : "border-[#d1d5db] text-[#9ca3af]"
            }`}
          >
            2
          </div>
          <span className={`text-[15px] font-semibold ${step === 2 ? "text-[#2563eb]" : "text-[#9ca3af]"}`}>
            Review and send
          </span>
        </div>
      </div>

      {notice && (
        <div className="mb-4 inline-block px-4 py-2 rounded-[10px] bg-[#eff6ff] text-[#2563eb] text-[13px] font-semibold">
          {notice}
        </div>
      )}

      {step === 1 && (
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6 items-stretch">
        {/* LEFT: Message card */}
        <div className="bg-white rounded-2xl p-6 shadow-[0px_2px_10px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] grid place-items-center text-[#2563eb]">
                <FiMessageCircle className="text-[20px]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#1a1a2e]">Message</h2>
                <p className="text-[13px] text-[#888]">Pick a template or write your own</p>
              </div>
            </div>

            <div ref={messageMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setMessageMenuOpen((p) => !p)}
                title="Message options"
                className={`w-9 h-9 rounded-[8px] flex items-center justify-center text-[#333] cursor-pointer transition-colors ${
                  messageMenuOpen ? "bg-[#eff6ff] text-[#2563eb]" : "hover:bg-[#f3f4f6]"
                }`}
              >
                <FiMenu className="text-[18px]" />
              </button>

              {messageMenuOpen && (
                <div className="absolute z-30 right-0 mt-2 w-[200px] bg-white border border-[#e5e7eb] rounded-[10px] shadow-lg py-1.5 px-1.5">
                  <button
                    onClick={() => {
                      openTemplatesList();
                      setMessageMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium text-[#333] hover:bg-[#f9fafb] rounded-[7px] cursor-pointer"
                  >
                    <FiList className="text-[14px] text-[#2563eb]" />
                    Manage templates
                  </button>
                  <button
                    onClick={() => {
                      setGroupsModalOpen(true);
                      setMessageMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium text-[#333] hover:bg-[#f9fafb] rounded-[7px] cursor-pointer"
                  >
                    <FiUsers className="text-[14px] text-[#2563eb]" />
                    Manage groups
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Template + Channels */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-[13px] font-semibold text-[#333] mb-1.5">Template</label>
              <div ref={templateRef} className="relative">
                <button
                  type="button"
                  onClick={() => setTemplateOpen((p) => !p)}
                  className={`w-full flex items-center justify-between h-[42px] px-3 rounded-[8px] border text-[13px] bg-white transition-colors cursor-pointer ${
                    templateOpen ? "border-[#2563eb] ring-1 ring-[#2563eb]/30" : "border-[#d1d5db] hover:border-[#9ca3af]"
                  }`}
                >
                  <span className="text-[#111]">{activeTemplate?.label}</span>
                  <FiChevronDown
                    className={`text-[#6b7280] text-[16px] transition-transform duration-200 ${
                      templateOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {templateOpen && (
                  <div className="absolute z-30 w-full mt-1 bg-white border border-[#e5e7eb] rounded-[10px] shadow-lg py-1.5 px-1.5">
                    {TEMPLATES.map((tpl) => {
                      const isSelected = tpl.id === templateId;
                      return (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => handleTemplateSelect(tpl)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 text-[13px] text-left rounded-[7px] cursor-pointer ${
                            isSelected ? "bg-[#eff6ff] text-[#2563eb] font-medium" : "text-[#111] hover:bg-[#f9fafb]"
                          }`}
                        >
                          {tpl.label}
                          {isSelected && <FiCheck className="text-[#2563eb] text-[13px]" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#333] mb-1.5">Channels</label>
              <div className="flex items-center gap-2 h-[42px]">
                <button
                  type="button"
                  role="radio"
                  aria-checked={channels.whatsapp}
                  onClick={() => selectChannel("whatsapp")}
                  className={`flex items-center gap-2 h-full px-4 rounded-full border text-[13px] font-semibold cursor-pointer transition-colors ${
                    channels.whatsapp
                      ? "border-[#16a34a] bg-[#f0fdf4] text-[#16a34a]"
                      : "border-[#d1d5db] text-[#9ca3af] hover:border-[#9ca3af]"
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full border-2 grid place-items-center ${
                      channels.whatsapp ? "border-[#16a34a]" : "border-[#9ca3af]"
                    }`}
                  >
                    {channels.whatsapp && <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />}
                  </span>
                  WhatsApp
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={channels.email}
                  onClick={() => selectChannel("email")}
                  className={`flex items-center gap-2 h-full px-4 rounded-full border text-[13px] font-semibold cursor-pointer transition-colors ${
                    channels.email
                      ? "border-[#2563eb] bg-[#eff6ff] text-[#2563eb]"
                      : "border-[#d1d5db] text-[#9ca3af] hover:border-[#9ca3af]"
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full border-2 grid place-items-center ${
                      channels.email ? "border-[#2563eb]" : "border-[#9ca3af]"
                    }`}
                  >
                    {channels.email && <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" />}
                  </span>
                  Email
                </button>
              </div>
            </div>
          </div>

          {/* Channel tabs */}
          <div className="flex items-center gap-6 border-b border-[#e5e7eb] mb-4">
            {channels.whatsapp && (
              <button
                onClick={() => setActiveTab("whatsapp")}
                className={`pb-2.5 text-[14px] font-semibold cursor-pointer border-b-2 -mb-px transition-colors ${
                  activeTab === "whatsapp" ? "border-[#16a34a] text-[#16a34a]" : "border-transparent text-[#9ca3af]"
                }`}
              >
                WhatsApp
              </button>
            )}
            {channels.email && (
              <button
                onClick={() => setActiveTab("email")}
                className={`pb-2.5 text-[14px] font-semibold cursor-pointer border-b-2 -mb-px transition-colors ${
                  activeTab === "email" ? "border-[#2563eb] text-[#2563eb]" : "border-transparent text-[#9ca3af]"
                }`}
              >
                Email
              </button>
            )}
          </div>

          {/* Subject (email only) */}
          {activeTab === "email" && (
            <div className="mb-4">
              <label className="block text-[13px] font-semibold text-[#333] mb-1.5">Subject</label>
              <input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Enter email subject"
                className="w-full h-[42px] px-3 rounded-[8px] border border-[#d1d5db] bg-white text-[13px] text-[#111] outline-none focus:border-[#2563eb] transition-colors placeholder:text-[#9ca3af]"
              />
            </div>
          )}

          {/* Message textarea */}
          <textarea
            ref={textareaRef}
            value={messages[activeTab] || ""}
            onChange={(e) => setMessages((prev) => ({ ...prev, [activeTab]: e.target.value }))}
            maxLength={4096}
            rows={7}
            placeholder="Write your message..."
            className="w-full border border-[#d1d5db] rounded-[10px] px-4 py-3 text-[14px] text-[#111] outline-none focus:border-[#2563eb] transition-colors placeholder:text-[#9ca3af] resize-none"
          />

          <div className="flex items-center justify-between mt-3 mb-6">
            <div className="flex items-center gap-2 flex-wrap">
              {BUILTIN_VARIABLES.map((v) => (
                <button
                  key={v}
                  onClick={() => insertVariable(`{${v}}`)}
                  className="px-3 py-1 rounded-full border border-[#d1d5db] text-[12px] font-medium text-[#555] hover:border-[#2563eb] hover:text-[#2563eb] cursor-pointer transition-colors"
                >
                  {`{${v}}`}
                </button>
              ))}
            </div>

            <span className="text-[13px] text-[#9ca3af] whitespace-nowrap shrink-0 ml-3">
              {charCount.toLocaleString()} / 4,096
            </span>
          </div>

          {/* Preview */}
          <h3 className="text-[15px] font-bold text-[#1a1a2e] mb-2">Preview</h3>
          {activeTab === "email" ? (
            <div className="rounded-2xl border border-[#e5e7eb] bg-white overflow-hidden">
              <div className="px-5 py-4 border-b border-[#f1f5f9] flex flex-col gap-1.5">
                <div className="flex items-center text-[13px]">
                  <span className="w-16 shrink-0 text-[#9ca3af]">From</span>
                  <span className="text-[#111] font-medium truncate">
                    Team Smart Networks &lt;noreply@smartnetworks.in&gt;
                  </span>
                </div>
                <div className="flex items-center text-[13px]">
                  <span className="w-16 shrink-0 text-[#9ca3af]">To</span>
                  <span className="text-[#111] truncate">
                    {firstSelectedName} &lt;{selectedContacts[0]?.email || "name@company.in"}&gt;
                  </span>
                </div>
                <div className="flex items-center text-[13px]">
                  <span className="w-16 shrink-0 text-[#9ca3af]">Subject</span>
                  <span className="text-[#1a1a2e] font-semibold truncate">{emailSubject}</span>
                </div>
              </div>
              <div className="px-5 py-5 text-[14px] text-[#111] whitespace-pre-wrap leading-relaxed">
                {previewText || "Your message preview will appear here."}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-[#EFE6DA] p-6">
              <div className="max-w-[420px] bg-[#DCFCE7] rounded-2xl px-4 py-3 text-[14px] text-[#111] whitespace-pre-wrap leading-relaxed">
                {previewText || "Your message preview will appear here."}
                <div className="flex items-center justify-end gap-1 mt-2 text-[11px] text-[#6b7280]">
                  {previewTime}
                  <BsCheckAll className="text-[#53bdeb] text-[14px]" />
                </div>
              </div>
            </div>
          )}
          <p className="text-[12px] text-[#9ca3af] mt-3">
            Variables are filled per contact. Shown here with sample values.
          </p>
        </div>

        {/* RIGHT: Send To + delivery summary */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-[0px_2px_10px_rgba(0,0,0,0.04)] flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] grid place-items-center text-[#2563eb]">
                  <FiUsers className="text-[20px]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#1a1a2e]">Send To</h2>
                  <p className="text-[13px] text-[#888]">
                    {selectedContacts.length} of {contacts.length} contacts selected
                  </p>
                </div>
              </div>

              <div ref={sendToMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setSendToMenuOpen((p) => !p)}
                  title="Contact options"
                  className={`w-9 h-9 rounded-[8px] flex items-center justify-center text-[#333] cursor-pointer transition-colors ${
                    sendToMenuOpen ? "bg-[#eff6ff] text-[#2563eb]" : "hover:bg-[#f3f4f6]"
                  }`}
                >
                  <FiMenu className="text-[18px]" />
                </button>

                {sendToMenuOpen && (
                  <div className="absolute z-30 right-0 mt-2 w-[200px] bg-white border border-[#e5e7eb] rounded-[10px] shadow-lg py-1.5 px-1.5">
                    <button
                      onClick={() => {
                        setContactsModalMode("contact");
                        setSendToMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium text-[#333] hover:bg-[#f9fafb] rounded-[7px] cursor-pointer"
                    >
                      <FiPlus className="text-[14px] text-[#2563eb]" />
                      Add contact
                    </button>
                    <button
                      onClick={() => {
                        setContactsModalMode("manage");
                        setSendToMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium text-[#333] hover:bg-[#f9fafb] rounded-[7px] cursor-pointer"
                    >
                      <FiUsers className="text-[14px] text-[#2563eb]" />
                      Manage contacts ({contacts.length})
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 flex items-center gap-2 h-[42px] px-3 rounded-[8px] border border-[#d1d5db] focus-within:border-[#2563eb] transition-colors">
                <FiSearch className="text-[15px] text-[#9ca3af]" />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setShowAllContacts(false);
                  }}
                  placeholder="Search name, email or number"
                  className="flex-1 text-[13px] outline-none placeholder:text-[#9ca3af]"
                />
              </div>

              <div ref={groupFilterRef} className="relative">
                <button
                  type="button"
                  onClick={() => setGroupFilterOpen((p) => !p)}
                  className={`flex items-center gap-2 h-[42px] px-3 rounded-[8px] border text-[13px] bg-white cursor-pointer whitespace-nowrap ${
                    groupFilterOpen ? "border-[#2563eb]" : "border-[#d1d5db] hover:border-[#9ca3af]"
                  }`}
                >
                  {groupFilter}
                  <FiChevronDown
                    className={`text-[#6b7280] text-[14px] transition-transform duration-200 ${
                      groupFilterOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {groupFilterOpen && (
                  <div className="absolute z-30 right-0 mt-1 w-[180px] bg-white border border-[#e5e7eb] rounded-[10px] shadow-lg py-1.5 px-1.5">
                    {["All groups", ...groupList].map((g) => (
                      <button
                        key={g}
                        onClick={() => {
                          setGroupFilter(g);
                          setGroupFilterOpen(false);
                          setShowAllContacts(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-[13px] rounded-[7px] cursor-pointer ${
                          groupFilter === g ? "bg-[#eff6ff] text-[#2563eb] font-medium" : "text-[#111] hover:bg-[#f9fafb]"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleSelectAll}
              className="text-[13px] font-semibold text-[#2563eb] hover:underline cursor-pointer mb-2"
            >
              {allFilteredSelected ? "Deselect all" : `Select all ${selectableInFilter.length}`}
            </button>

            <div className="flex-1 min-h-[120px] overflow-y-auto -mx-2 pr-1 space-y-1">
              {visibleContacts.map((contact) => {
                const isSelected = selectedIds.has(contact.id);
                const disabled = !contact.hasWhatsApp && !channels.email;
                return (
                  <div
                    key={contact.id}
                    onClick={() => toggleContact(contact)}
                    className={`flex items-center gap-3 px-2 py-2.5 rounded-[10px] transition-colors ${
                      disabled ? "opacity-70 cursor-not-allowed" : "cursor-pointer hover:bg-[#f9fafb]"
                    } ${isSelected ? "bg-[#eff6ff]" : ""}`}
                  >
                    <CustomCheckbox
                      checked={isSelected}
                      disabled={disabled}
                      onChange={() => toggleContact(contact)}
                    />
                    <div
                      className={`w-10 h-10 min-w-[40px] rounded-full grid place-items-center text-[13px] font-bold ${
                        isSelected ? "bg-[#6366F1] text-white" : "bg-[#E5E7EB] text-[#555]"
                      }`}
                    >
                      {initials(contact.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-[#1a1a2e] truncate">{contact.name}</p>
                      <p className="text-[12px] text-[#888] truncate">{contact.group || "Ungrouped"}</p>
                    </div>
                    {!contact.hasWhatsApp && (
                      <span className="inline-flex items-center px-3 py-0.5 rounded-md text-[12px] font-semibold bg-[#FEF7E0] text-[#B06000] whitespace-nowrap">
                        No WhatsApp
                      </span>
                    )}
                  </div>
                );
              })}

              {filteredContacts.length === 0 && (
                <div className="py-10 text-center text-[13px] text-[#9ca3af]">
                  {contacts.length === 0 ? "No contacts yet. Add one to get started." : "No contacts match your search."}
                </div>
              )}

              {filteredContacts.length > CONTACTS_PAGE_SIZE && (
                <button
                  onClick={() => setShowAllContacts((p) => !p)}
                  className="w-full text-center text-[13px] font-semibold text-[#2563eb] hover:underline cursor-pointer py-2"
                >
                  {showAllContacts ? "Show less" : `Show more (${filteredContacts.length - CONTACTS_PAGE_SIZE})`}
                </button>
              )}
            </div>
          </div>

          {/* Will be delivered to */}
          <div className="bg-white rounded-2xl p-6 shadow-[0px_2px_10px_rgba(0,0,0,0.04)]">
            <h3 className="text-[15px] font-bold text-[#1a1a2e] mb-4">Will be delivered to</h3>

            <div className="flex flex-col gap-3 mb-5">
              {channels.whatsapp && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#dcfce7] text-[#16a34a] grid place-items-center text-[12px] font-bold">
                      W
                    </div>
                    <span className="text-[14px] font-medium text-[#333]">WhatsApp</span>
                  </div>
                  <span className="text-[15px] font-bold text-[#1a1a2e]">{whatsappCount}</span>
                </div>
              )}
              {channels.email && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#eff6ff] text-[#2563eb] grid place-items-center text-[12px] font-bold">
                      E
                    </div>
                    <span className="text-[14px] font-medium text-[#333]">Email</span>
                  </div>
                  <span className="text-[15px] font-bold text-[#1a1a2e]">{emailCount}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleGoToReview}
              className="w-full flex items-center justify-center gap-2 h-[46px] rounded-[10px] text-[14px] font-semibold transition-colors bg-[#2563eb] text-white hover:bg-[#1d4ed8] cursor-pointer"
            >
              Review
              <FiArrowRight className="text-[15px]" />
            </button>
          </div>
        </div>
      </div>
      )}

      {step === 2 && (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6 items-start">
          {/* LEFT: Check before sending */}
          <div className="bg-white rounded-2xl p-6 shadow-[0px_2px_10px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] grid place-items-center text-[#2563eb]">
                <FiCheckSquare className="text-[20px]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#1a1a2e]">Check before sending</h2>
                <p className="text-[13px] text-[#888]">Nothing goes out until you confirm</p>
              </div>
            </div>

            <div className="divide-y divide-[#f1f5f9]">
              <div className="flex items-center justify-between py-3">
                <span className="text-[14px] text-[#666]">Template</span>
                <span className="text-[14px] font-semibold text-[#1a1a2e]">{activeTemplate?.label}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-[14px] text-[#666]">Channels</span>
                <span className="text-[14px] font-semibold text-[#1a1a2e]">{activeChannelLabels}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-[14px] text-[#666]">Recipients</span>
                <span className="text-[14px] font-semibold text-[#1a1a2e]">
                  {deliverableContacts.length} deliverable
                </span>
              </div>
              {channels.whatsapp && (
                <div className="flex items-center justify-between py-3">
                  <span className="text-[14px] text-[#666]">WhatsApp</span>
                  <span className="text-[14px] font-semibold text-[#1a1a2e]">{whatsappCount} contacts</span>
                </div>
              )}
              {channels.email && (
                <div className="flex items-center justify-between py-3">
                  <span className="text-[14px] text-[#666]">Email</span>
                  <span className="text-[14px] font-semibold text-[#1a1a2e]">{emailCount} contacts</span>
                </div>
              )}
              <div className="flex items-center justify-between py-3">
                <span className="text-[14px] text-[#666]">Sending</span>
                <span className="text-[14px] font-semibold text-[#1a1a2e]">{sendingLabel}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 mt-4 bg-[#eff6ff] rounded-[12px] px-4 py-3">
              <span className="text-[13px] font-medium text-[#2563eb]">Confirm attendee details before sending</span>
              <button
                onClick={() => setConfirmModalOpen(true)}
                className="px-4 h-[34px] rounded-[8px] bg-[#2563eb] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] cursor-pointer whitespace-nowrap"
              >
                Confirm
              </button>
            </div>
          </div>

          {/* RIGHT: Schedule + Message preview + actions */}
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-[0px_2px_10px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] grid place-items-center text-[#2563eb]">
                  <FiClock className="text-[20px]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#1a1a2e]">Schedule</h2>
                  <p className="text-[13px] text-[#888]">This broadcast sends immediately</p>
                </div>
              </div>

              <div className="flex items-center h-[42px] px-4 rounded-[8px] border border-[#2563eb] bg-[#eff6ff] text-[#2563eb] text-[13px] font-semibold">
                Send now
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-[0px_2px_10px_rgba(0,0,0,0.04)]">
              <h3 className="text-[15px] font-bold text-[#1a1a2e] mb-4">Message going out</h3>
              <div className="flex flex-col gap-3">
                {[
                  channels.whatsapp && { key: "whatsapp", label: "WhatsApp", color: "#16a34a", bg: "#dcfce7" },
                  channels.email && { key: "email", label: "Email", color: "#2563eb", bg: "#eff6ff" },
                ]
                  .filter(Boolean)
                  .map((ch) => {
                    const chBody = (messages[ch.key] || "")
                      .replaceAll("{name}", firstSelectedName)
                      .replaceAll("{cluster}", SAMPLE_VALUES.cluster)
                      .replaceAll("{site}", SAMPLE_VALUES.site)
                      .replaceAll("{date}", SAMPLE_VALUES.date);
                    const [firstLine, ...rest] = chBody.split("\n").filter(Boolean);
                    return (
                      <div key={ch.key} className="border border-[#f1f5f9] rounded-[10px] p-4">
                        <div className="flex items-start gap-3">
                          <div
                            className="w-8 h-8 min-w-[32px] rounded-full grid place-items-center text-[12px] font-bold"
                            style={{ backgroundColor: ch.bg, color: ch.color }}
                          >
                            {ch.label[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-bold" style={{ color: ch.color }}>
                              {ch.label}
                            </p>
                            <p className="text-[14px] text-[#1a1a2e] font-medium mt-0.5">
                              {firstLine || "No message written yet"}
                            </p>
                            {rest.length > 0 && (
                              <p className="text-[13px] text-[#888] mt-1 truncate">{rest.join(" ")}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-5 h-[46px] rounded-[10px] border border-[#d1d5db] text-[14px] font-semibold text-[#333] hover:bg-[#f9fafb] cursor-pointer"
              >
                <FiArrowLeft className="text-[15px]" />
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {groupsModalOpen && (
        <GroupsModal
          contacts={contacts}
          groups={groupList}
          onClose={() => setGroupsModalOpen(false)}
          onCreateGroup={createGroup}
          onDeleteGroup={deleteGroup}
          onAddMember={addMemberToGroup}
          onRemoveMember={removeMemberFromGroup}
        />
      )}

      {contactsModalMode && (
        <ContactsModal
          mode={contactsModalMode}
          contacts={contacts}
          groups={groupList}
          onClose={() => setContactsModalMode(null)}
          onAddContact={addContact}
          onImportContacts={importContacts}
          onDeleteContact={deleteContact}
          onDeleteAllContacts={deleteAllContacts}
        />
      )}

      {templatesPanel?.view === "list" && (
        <TemplatesModal
          templates={templates}
          onClose={closeTemplatesPanel}
          onNew={openNewTemplate}
          onEdit={openEditTemplate}
          onClone={openCloneTemplate}
          onView={openViewTemplate}
        />
      )}

      {templatesPanel?.view === "form" && (
        <TemplateFormModal
          mode={templatesPanel.mode}
          template={templatesPanel.template}
          onBack={openTemplatesList}
          onSaveDraft={handleSaveTemplateDraft}
          onSubmit={handleSubmitTemplate}
        />
      )}

      {confirmModalOpen && (
        <ConfirmSendModal
          contacts={contacts}
          templateId={templateId}
          onClose={() => setConfirmModalOpen(false)}
          onConfirm={handleConfirmSend}
        />
      )}
    </div>
  );
}
