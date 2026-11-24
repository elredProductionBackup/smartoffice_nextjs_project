"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiArrowRight,
  FiMessageCircle,
  FiUsers,
  FiChevronDown,
  FiCheck,
  FiPlus,
  FiSearch,
  FiMenu,
  FiBarChart2,
} from "react-icons/fi";
import CustomCheckbox from "@/_components/UI/CustomCheckbox";
import GroupsModal from "./GroupsModal";
import ContactsModal from "./ContactsModal";
import ConfirmSendModal from "./ConfirmSendModal";
import {
  createContactGroup,
  getContactGroups,
  getContactGroupContacts,
  deleteContactGroupContacts,
  deleteContactGroup,
} from "@/services/contactGroup.service";
import { getWhatsAppTemplates } from "@/services/broadcast.service";
import { PRIVE_WORKSHOP_EMAIL_HTML, PRIVE_MEDIA_EMAIL_HTML } from "./emailTemplates";

// getWhatsAppTemplates only returns { templateName, label } — the message
// bodies below aren't part of that API, so keep known-template previews
// here and fall back to a generic body for any template it adds later.
const TEMPLATE_CONTENT = {
  prive_registration_confirmation: {
    body:
      "Hi {name},\n\nA quick reminder about the {cluster} review meet at {site} on {date}. Please arrive ten minutes early and bring your site checklist.\n\nTeam Smart Networks",
    emailBody: PRIVE_WORKSHOP_EMAIL_HTML,
  },
  prive_directory: {
    body:
      "Hi {name},\n\nThanks for joining the {cluster} sync today. Notes and action items from the meet at {site} will follow shortly.\n\nTeam Smart Networks",
    emailBody: PRIVE_MEDIA_EMAIL_HTML,
  },
};

const DEFAULT_TEMPLATE_CONTENT = {
  body: "Hi {name},\n\n",
  emailBody: PRIVE_WORKSHOP_EMAIL_HTML,
};

const SAMPLE_VALUES = {
  cluster: "North Cluster",
  site: "Andheri West",
  date: "12 Sep, 6:00 PM",
};

const DEFAULT_SELECTED = [];

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

  const [whatsappTemplates, setWhatsappTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);

  const [templateId, setTemplateId] = useState("");
  const [templateOpen, setTemplateOpen] = useState(false);
  const templateRef = useRef(null);

  const [channels, setChannels] = useState({ whatsapp: true, email: false });
  const [activeTab, setActiveTab] = useState("whatsapp");

  const [messages, setMessages] = useState({ whatsapp: "", email: "" });
  const [emailSubject, setEmailSubject] = useState("");

  const [contacts, setContacts] = useState([]);
  const [groupList, setGroupList] = useState([]);
  const [groupIds, setGroupIds] = useState({});
  const [groupsModalOpen, setGroupsModalOpen] = useState(false);
  const [contactsModalMode, setContactsModalMode] = useState(null);

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

  const showComingSoon = (label) => setNotice(`${label} — coming soon`);

  const applyTemplate = (tpl) => {
    const content = TEMPLATE_CONTENT[tpl.id] || DEFAULT_TEMPLATE_CONTENT;
    setTemplateId(tpl.id);
    setMessages({ whatsapp: content.body, email: content.emailBody });
    setEmailSubject(tpl.label);
  };

  const handleTemplateSelect = (tpl) => {
    applyTemplate(tpl);
    setTemplateOpen(false);
  };

  useEffect(() => {
    let cancelled = false;

    getWhatsAppTemplates()
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res?.result) ? res.result : [];
        const mapped = list.map((t) => ({ id: t.templateName, label: t.label || t.templateName }));
        setWhatsappTemplates(mapped);
        if (mapped.length > 0) applyTemplate(mapped[0]);
      })
      .catch((error) => {
        console.error("Failed to fetch WhatsApp templates:", error?.response || error);
      })
      .finally(() => {
        if (!cancelled) setTemplatesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectChannel = (key) => {
    setChannels({ whatsapp: key === "whatsapp", email: key === "email" });
    setActiveTab(key);
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

  const toApiContact = (c) => ({ name: c.name || "", phone: c.phone || "", email: c.email || "" });

  // A contact can belong to several groups, so membership lives in a
  // `groups` array. Contacts are deduped by this key across groups.
  const contactKey = (c) => c.phone || c.email || c.name;
  const membersOf = (list, name) => list.filter((c) => c.groups?.includes(name));

  // Mirror of `contacts` so handlers can compute the next list (and fire
  // sync calls with it) outside of a setState updater, which must stay pure.
  const contactsRef = useRef(contacts);
  const updateContacts = (updater) => {
    const next = updater(contactsRef.current);
    contactsRef.current = next;
    setContacts(next);
    return next;
  };

  // Merge `serverGroups` ({ name, id, contacts }) into the local list. This only
  // ever ADDS memberships — loading data (e.g. opening a popup) must never take a
  // contact out of a group, since a server list can be partial. Removals happen
  // only through the delete actions, which update local state themselves.
  // `existingGroupNames` (optional): every group the server has; memberships of
  // groups that no longer exist are dropped.
  const applyServerMembership = (serverGroups, existingGroupNames) => {
    updateContacts((prev) => {
      const byKey = new Map(
        prev.map((c) => [
          contactKey(c),
          existingGroupNames ? { ...c, groups: (c.groups || []).filter((g) => existingGroupNames.has(g)) } : c,
        ])
      );
      serverGroups.forEach((g) => {
        (g.contacts || []).forEach((gc) => {
          const key = contactKey(gc);
          const existing = byKey.get(key);
          const groups = existing?.groups || [];
          byKey.set(key, {
            ...existing,
            id: existing?.id || `c-${g.id}-${key}`,
            name: gc.name,
            phone: gc.phone,
            email: gc.email,
            hasWhatsApp: !!gc.phone,
            groups: groups.includes(g.name) ? groups : [...groups, g.name],
          });
        });
      });
      return Array.from(byKey.values());
    });
  };

  // Full member list of one group, straight from the backend.
  // `complete` is false when the server may have cut the list short.
  const fetchGroupMembers = async (groupId) => {
    const result = await getContactGroupContacts(groupId);
    if (result?.success === false) throw new Error(result?.message || "Failed to load group contacts");
    return { contacts: Array.isArray(result?.result) ? result.result : [], complete: result?.complete !== false };
  };

  // Groups whose server list may be cut short — their counts show as "20+"
  const [partialGroups, setPartialGroups] = useState(() => new Set());
  const markPartial = (name, complete) =>
    setPartialGroups((prev) => {
      if (prev.has(name) === !complete) return prev;
      const next = new Set(prev);
      if (complete) next.delete(name);
      else next.add(name);
      return next;
    });

  // One load at a time: popups opening (and React's dev-mode double effect)
  // reuse the request already in flight instead of starting another.
  const refreshInFlight = useRef(null);
  const refreshGroups = () => {
    if (!refreshInFlight.current) {
      refreshInFlight.current = loadGroups().finally(() => {
        refreshInFlight.current = null;
      });
    }
    return refreshInFlight.current;
  };

  const loadGroups = async () => {
    try {
      const result = await getContactGroups();
      const rawList = Array.isArray(result?.result) ? result.result : Array.isArray(result) ? result : [];

      // The UI treats group name as the unique identifier (used as React
      // keys and as the lookup key for groupIds), but the backend can return
      // more than one group document with the same name. Collapse those down
      // to one entry each — keeping whichever was updated most recently —
      // so we never hand React (or groupIds) a duplicate name.
      const byName = new Map();
      rawList.forEach((g) => {
        const existing = byName.get(g.name);
        if (!existing || new Date(g.updatedAt || 0) >= new Date(existing.updatedAt || 0)) {
          byName.set(g.name, g);
        }
      });
      const list = Array.from(byName.values());

      setGroupList(list.map((g) => g.name));
      setGroupIds(Object.fromEntries(list.map((g) => [g.name, g._id])));

      // getContactGroups embeds only the first few contacts of each group (the
      // same cap for every group). A group whose embedded list is shorter than the
      // longest one isn't cut off, so use it as is. Only groups that may be cut
      // off need their full list from getContactGroupContacts.
      const previewOf = (g) => (Array.isArray(g.contacts) ? g.contacts : []);
      const longestPreview = Math.max(0, ...list.map((g) => previewOf(g).length));
      const fullGroups = await Promise.all(
        list.map(async (g) => {
          const preview = previewOf(g);
          if (preview.length === 0 || preview.length < longestPreview) {
            markPartial(g.name, true);
            return { name: g.name, id: g._id, contacts: preview };
          }
          try {
            const { contacts: members, complete } = await fetchGroupMembers(g._id);
            markPartial(g.name, complete);
            return { name: g.name, id: g._id, contacts: members };
          } catch (error) {
            console.error(`getContactGroupContacts failed for "${g.name}":`, error?.response || error);
            return null; // keep what's on screen for this group rather than guess
          }
        })
      );
      applyServerMembership(fullGroups.filter(Boolean), new Set(list.map((g) => g.name)));
    } catch (error) {
      console.error("getContactGroups API Error:", error?.response || error);
      setNotice("Failed to load groups");
    }
  };

  useEffect(() => {
    refreshGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The group popups always open on fresh data from the backend
  const openGroupsModal = () => {
    setGroupsModalOpen(true);
    refreshGroups();
  };
  const openContactsModal = (mode) => {
    if (mode !== contactsModalMode) refreshGroups();
    setContactsModalMode(mode);
  };

  // Every group's full member list is already loaded with the groups, so
  // picking one in the filter needs no extra request.
  const selectGroupFilter = (g) => setGroupFilter(g);

  const createGroup = async (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (groupList.some((g) => g.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error("A group with this name already exists.");
    }

    const result = await createContactGroup({ groupId: "", name: trimmed, contacts: [] });
    if (result?.success === false) {
      throw new Error(result?.message || "Failed to create group");
    }

    // Backend returns the group document, either as the response body itself
    // or wrapped in { success, result }: { _id, name, contacts, ... }
    const group = result?.result || result;
    const newGroupId = group?._id || "";
    setGroupList((prev) => [...prev, trimmed]);
    setGroupIds((prev) => ({ ...prev, [trimmed]: newGroupId }));
  };

  // Deletes the group (and its contacts) on the backend first; throws on
  // failure so the group stays on-screen. Contacts that were only in this
  // group go with it; members of other groups keep those memberships.
  const deleteGroup = async (name) => {
    const groupId = groupIds[name];
    if (!groupId) {
      throw new Error(`Can't delete "${name}" — group not found. Try reopening the popup.`);
    }
    await deleteContactGroup(groupId);

    setGroupList((prev) => prev.filter((g) => g !== name));
    setGroupIds((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });

    const orphanIds = new Set(
      contactsRef.current.filter((c) => c.groups?.length === 1 && c.groups[0] === name).map((c) => c.id)
    );
    updateContacts((prev) =>
      prev
        .filter((c) => !orphanIds.has(c.id))
        .map((c) => (c.groups?.includes(name) ? { ...c, groups: c.groups.filter((g) => g !== name) } : c))
    );
    setSelectedIds((prev) => new Set([...prev].filter((id) => !orphanIds.has(id))));
    if (groupFilter === name) setGroupFilter("All groups");
  };

  // Saves the group's full member list; throws with a readable message on failure.
  const saveGroupContacts = async (name, members) => {
    const groupId = groupIds[name];
    if (!groupId) {
      throw new Error(`Can't save to "${name}" — group not found. Try reopening the popup.`);
    }
    // This call replaces the group's member list. The page may not have every
    // member loaded, so merge in what the server already has — a save must
    // never drop contacts. Abort if that list can't be loaded.
    let serverMembers;
    let complete;
    try {
      ({ contacts: serverMembers, complete } = await fetchGroupMembers(groupId));
    } catch {
      throw new Error(`Couldn't load the current members of "${name}". Please try again.`);
    }
    markPartial(name, complete);
    // Saving on top of a cut-short list would delete the members we couldn't load
    if (!complete) {
      throw new Error(`"${name}" is too large to update safely right now — no contacts were changed.`);
    }
    const byPhone = new Map();
    // Local entries win so edits to an existing contact's name/email are kept.
    // The backend rejects the whole save if any contact lacks a phone.
    [...serverMembers, ...members].forEach((c) => c.phone && byPhone.set(c.phone, toApiContact(c)));
    const payload = Array.from(byPhone.values());
    const result = await createContactGroup({ groupId, name, contacts: payload });
    if (result?.success === false) {
      // "contacts[3].phone is required" → "Ronak Barot: phone is required"
      const message = result?.message || "Failed to save contacts";
      const match = message.match(/contacts\[(\d+)\]\.(\w+)\s*(.*)/);
      const who = match && payload[Number(match[1])]?.name;
      throw new Error(who ? `${who}: ${match[2]} ${match[3]}`.trim() : message);
    }
    return result;
  };

  // Merge incoming contacts (each carrying an optional single `group` from
  // ContactsModal) into the list. A contact that already exists — same
  // phone/email — just gains the group instead of being duplicated.
  const mergeIncomingContacts = (incoming) =>
    updateContacts((prev) => {
      const byKey = new Map(prev.map((c) => [contactKey(c), c]));
      incoming.forEach(({ group, ...c }, i) => {
        const key = contactKey(c);
        const existing = byKey.get(key);
        const groups = existing?.groups || [];
        byKey.set(key, {
          ...existing,
          ...c,
          id: existing?.id || `c-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
          groups: group && !groups.includes(group) ? [...groups, group] : groups,
        });
      });
      return Array.from(byKey.values());
    });

  // Adds contacts locally, saves their group, and undoes the local add if the
  // save fails. Throws so the calling popup can show the error.
  const addContactsToGroup = async (newContacts) => {
    const snapshot = contactsRef.current;
    const next = mergeIncomingContacts(newContacts);
    // The list is sorted alphabetically and paginated to CONTACTS_PAGE_SIZE —
    // without this the new contacts can silently land past the visible slice.
    setShowAllContacts(true);
    const group = newContacts[0]?.group;
    if (!group) return;
    try {
      await saveGroupContacts(group, membersOf(next, group));
    } catch (error) {
      updateContacts(() => snapshot);
      throw error;
    }
  };

  const addContact = (newContact) => addContactsToGroup([newContact]);
  const importContacts = (newContacts) => addContactsToGroup(newContacts);

  // Manage contacts lists one row per group membership, so a delete targets
  // a single group. The contact itself is only dropped once it's in no group.
  const deleteContact = async (contactId, groupName) => {
    const contact = contactsRef.current.find((c) => c.id === contactId);
    if (contact?.phone) {
      const groupId = (groupName && groupIds[groupName]) || "";
      // Throws on any failure (see deleteContactGroupContacts) — that
      // propagates up to the caller, so a failed delete never reaches the
      // updateContacts call below and the contact stays put on-screen.
      await deleteContactGroupContacts({ groupId, contacts: [{ phone: contact.phone }] });
    }

    const next = updateContacts((prev) =>
      prev
        .map((c) => (c.id === contactId && groupName ? { ...c, groups: (c.groups || []).filter((g) => g !== groupName) } : c))
        .filter((c) => c.id !== contactId || (groupName && c.groups.length > 0))
    );
    if (next.some((c) => c.id === contactId)) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(contactId);
      return next;
    });
  };

  const deleteAllContacts = () => {
    updateContacts(() => []);
    setSelectedIds(new Set());
  };

  const filteredContacts = useMemo(() => {
    return contacts
      .filter((c) => {
        const matchesSearch = c.name.toLowerCase().includes(search.trim().toLowerCase());
        const matchesGroup = groupFilter === "All groups" || c.groups?.includes(groupFilter);
        return matchesSearch && matchesGroup;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
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
  // Matches the Manage contacts list: one entry per group membership.
  const contactEntryCount = contacts.reduce((n, c) => n + Math.max(1, c.groups?.length || 0), 0);
  const firstSelectedName = selectedContacts[0]?.name || "there";

  const previewText = (messages[activeTab] || "")
    .replaceAll("{name}", firstSelectedName)
    .replaceAll("{cluster}", SAMPLE_VALUES.cluster)
    .replaceAll("{site}", SAMPLE_VALUES.site)
    .replaceAll("{date}", SAMPLE_VALUES.date);

  const activeTemplate = whatsappTemplates.find((t) => t.id === templateId);

  const whatsappCount = selectedContacts.filter((c) => c.hasWhatsApp).length;
  const emailCount = selectedContacts.length;

  const handleConfirmSend = () => {
    setConfirmModalOpen(false);
    setNotice("Broadcast sent");
  };

  return (
    <div className="pt-4 pb-24 md:pt-6 md:pb-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 md:gap-4 mb-4 md:mb-6">
        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="w-10 h-10 shrink-0 rounded-xl bg-white shadow-[0px_2px_6px_rgba(0,0,0,0.08)] flex items-center justify-center cursor-pointer text-[#333]"
          >
            <FiArrowLeft className="text-[18px]" />
          </button>
          <h1 className="font-heading text-[24px] md:text-[32px] font-semibold text-[#1a1a2e]">New broadcast</h1>
        </div>
        <button
          onClick={() => router.push("/dashboard/send-bulk/reports")}
          className="flex items-center gap-2 px-4 h-10 rounded-[10px] bg-white border border-[#d1d5db] text-[16px] font-semibold text-[#333] hover:border-[#2563eb] hover:text-[#2563eb] cursor-pointer transition-colors"
        >
          <FiBarChart2 className="text-[16px]" />
          View reports
        </button>
      </div>

      {notice && (
        <div className="mb-4 inline-block px-4 py-2 rounded-[10px] bg-[#eff6ff] text-[#2563eb] text-[16px] font-semibold">
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6 items-stretch">
        {/* LEFT: Message card */}
        <div className="max-xl:min-w-0 bg-white rounded-2xl p-4 md:p-6 shadow-[0px_2px_10px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between gap-3 mb-5 md:mb-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] grid place-items-center text-[#2563eb]">
                <FiMessageCircle className="text-[20px]" />
              </div>
              <div>
                <h2 className="text-[20px] md:text-[22px] font-bold text-[#1a1a2e]">Message</h2>
                <p className="text-[16px] text-[#888]">Pick a template or write your own</p>
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
                      openGroupsModal();
                      setMessageMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[16px] font-medium text-[#333] hover:bg-[#f9fafb] rounded-[7px] cursor-pointer"
                  >
                    <FiUsers className="text-[16px] text-[#2563eb]" />
                    Manage groups
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Template + Channels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-[16px] font-semibold text-[#333] mb-1.5">Template</label>
              <div ref={templateRef} className="relative">
                <button
                  type="button"
                  onClick={() => setTemplateOpen((p) => !p)}
                  className={`w-full flex items-center justify-between h-[42px] px-3 rounded-[8px] border text-[16px] bg-white transition-colors cursor-pointer ${
                    templateOpen ? "border-[#2563eb] ring-1 ring-[#2563eb]/30" : "border-[#d1d5db] hover:border-[#9ca3af]"
                  }`}
                >
                  <span className="min-w-0 truncate text-[#111]">
                    {activeTemplate?.label || (templatesLoading ? "Loading templates…" : "No templates available")}
                  </span>
                  <FiChevronDown
                    className={`text-[#6b7280] text-[16px] transition-transform duration-200 ${
                      templateOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {templateOpen && (
                  <div className="absolute z-30 w-full mt-1 bg-white border border-[#e5e7eb] rounded-[10px] shadow-lg py-1.5 px-1.5">
                    {whatsappTemplates.length === 0 && (
                      <div className="px-3 py-2.5 text-[16px] text-[#9ca3af]">
                        {templatesLoading ? "Loading templates…" : "No templates available"}
                      </div>
                    )}
                    {whatsappTemplates.map((tpl) => {
                      const isSelected = tpl.id === templateId;
                      return (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => handleTemplateSelect(tpl)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 text-[16px] text-left rounded-[7px] cursor-pointer ${
                            isSelected ? "bg-[#eff6ff] text-[#2563eb] font-medium" : "text-[#111] hover:bg-[#f9fafb]"
                          }`}
                        >
                          {tpl.label}
                          {isSelected && <FiCheck className="text-[#2563eb] text-[16px]" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[16px] font-semibold text-[#333] mb-1.5">Channels</label>
              <div className="flex items-center gap-2 h-[42px]">
                <button
                  type="button"
                  role="radio"
                  aria-checked={channels.whatsapp}
                  onClick={() => selectChannel("whatsapp")}
                  className={`flex items-center gap-2 h-full px-4 rounded-full border text-[16px] font-semibold cursor-pointer transition-colors ${
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
                  className={`flex items-center gap-2 h-full px-4 rounded-full border text-[16px] font-semibold cursor-pointer transition-colors ${
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
                className={`pb-2.5 text-[16px] font-semibold cursor-pointer border-b-2 -mb-px transition-colors ${
                  activeTab === "whatsapp" ? "border-[#16a34a] text-[#16a34a]" : "border-transparent text-[#9ca3af]"
                }`}
              >
                WhatsApp
              </button>
            )}
            {channels.email && (
              <button
                onClick={() => setActiveTab("email")}
                className={`pb-2.5 text-[16px] font-semibold cursor-pointer border-b-2 -mb-px transition-colors ${
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
              <label className="block text-[16px] font-semibold text-[#333] mb-1.5">Subject</label>
              <input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Enter email subject"
                className="w-full h-[42px] px-3 rounded-[8px] border border-[#d1d5db] bg-white text-[16px] text-[#111] outline-none focus:border-[#2563eb] transition-colors placeholder:text-[#9ca3af]"
              />
            </div>
          )}

          {activeTab === "email" && (
            <>
              {/* Message content */}
              <div
                className="w-full min-h-[196px] max-h-[320px] overflow-y-auto max-md:overflow-x-auto border border-[#d1d5db] rounded-[10px] px-4 py-3 bg-white text-[16px] text-[#111]"
                dangerouslySetInnerHTML={{ __html: messages.email || "" }}
              />

              {/* Preview */}
              <h3 className="text-[18px] font-bold text-[#1a1a2e] mt-6 mb-2">Preview</h3>
              <div className="rounded-2xl border border-[#e5e7eb] bg-white overflow-hidden">
                <div className="px-4 md:px-5 py-4 border-b border-[#f1f5f9] flex flex-col gap-1.5">
                  <div className="flex items-center text-[16px]">
                    <span className="w-16 shrink-0 text-[#9ca3af]">From</span>
                    <span className="text-[#111] font-medium truncate">
                      Team Smart Networks &lt;noreply@smartnetworks.in&gt;
                    </span>
                  </div>
                  <div className="flex items-center text-[16px]">
                    <span className="w-16 shrink-0 text-[#9ca3af]">To</span>
                    <span className="text-[#111] truncate">
                      {firstSelectedName} &lt;{selectedContacts[0]?.email || "name@company.in"}&gt;
                    </span>
                  </div>
                  <div className="flex items-center text-[16px]">
                    <span className="w-16 shrink-0 text-[#9ca3af]">Subject</span>
                    <span className="text-[#1a1a2e] font-semibold truncate">{emailSubject}</span>
                  </div>
                </div>
                {previewText ? (
                  <div
                    className="px-4 py-4 md:px-5 md:py-5 text-[16px] text-[#111] leading-relaxed max-md:overflow-x-auto max-md:break-words"
                    dangerouslySetInnerHTML={{ __html: previewText }}
                  />
                ) : (
                  <div className="px-5 py-5 text-[16px] text-[#9ca3af]">Your message preview will appear here.</div>
                )}
              </div>
              <p className="text-[14px] text-[#9ca3af] mt-3">
                Variables are filled per contact. Shown here with sample values.
              </p>
            </>
          )}
        </div>

        {/* RIGHT: Send To + delivery summary */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-[0px_2px_10px_rgba(0,0,0,0.04)] flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] grid place-items-center text-[#2563eb]">
                  <FiUsers className="text-[20px]" />
                </div>
                <div>
                  <h2 className="text-[20px] md:text-[22px] font-bold text-[#1a1a2e]">Send To</h2>
                  <p className="text-[16px] text-[#888]">
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
                  <div className="absolute z-30 right-0 mt-2 w-max min-w-[220px] bg-white border border-[#e5e7eb] rounded-[10px] shadow-lg py-1.5 px-1.5">
                    <button
                      onClick={() => {
                        openContactsModal("contact");
                        setSendToMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[16px] font-medium text-[#333] text-left whitespace-nowrap hover:bg-[#f9fafb] rounded-[7px] cursor-pointer"
                    >
                      <FiPlus className="text-[16px] text-[#2563eb] shrink-0" />
                      Add contact
                    </button>
                    <button
                      onClick={() => {
                        openContactsModal("manage");
                        setSendToMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[16px] font-medium text-[#333] text-left whitespace-nowrap hover:bg-[#f9fafb] rounded-[7px] cursor-pointer"
                    >
                      <FiUsers className="text-[16px] text-[#2563eb] shrink-0" />
                      <span className="flex-1">Manage contacts</span>
                      <span className="ml-3 min-w-[22px] h-[22px] px-1.5 rounded-full bg-[#eff6ff] text-[#2563eb] text-[12px] font-semibold flex items-center justify-center">
                        {contactEntryCount}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 min-w-0 flex items-center gap-2 h-[42px] px-3 rounded-[8px] border border-[#d1d5db] focus-within:border-[#2563eb] transition-colors">
                <FiSearch className="text-[18px] text-[#9ca3af] shrink-0" />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setShowAllContacts(false);
                  }}
                  placeholder="Search name, email or number"
                  className="flex-1 min-w-0 text-[16px] outline-none placeholder:text-[#9ca3af]"
                />
              </div>

              <div ref={groupFilterRef} className="relative">
                <button
                  type="button"
                  onClick={() => setGroupFilterOpen((p) => !p)}
                  className={`flex items-center gap-2 h-[42px] px-3 rounded-[8px] border text-[16px] bg-white cursor-pointer whitespace-nowrap ${
                    groupFilterOpen ? "border-[#2563eb]" : "border-[#d1d5db] hover:border-[#9ca3af]"
                  }`}
                >
                  <span className="max-w-[110px] sm:max-w-none truncate">{groupFilter}</span>
                  <FiChevronDown
                    className={`text-[#6b7280] text-[16px] transition-transform duration-200 ${
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
                          selectGroupFilter(g);
                          setGroupFilterOpen(false);
                          setShowAllContacts(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-[16px] rounded-[7px] cursor-pointer ${
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

            <div className="flex items-center justify-between mb-2">
              <button
                onClick={handleSelectAll}
                className="text-[16px] font-semibold text-[#2563eb] hover:underline cursor-pointer"
              >
                {allFilteredSelected ? "Deselect all" : `Select all ${selectableInFilter.length}`}
              </button>
            </div>

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
                      className={`w-10 h-10 min-w-[40px] rounded-full grid place-items-center text-[16px] font-bold ${
                        isSelected ? "bg-[#6366F1] text-white" : "bg-[#E5E7EB] text-[#555]"
                      }`}
                    >
                      {initials(contact.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[18px] font-semibold text-[#1a1a2e] truncate">{contact.name}</p>
                      <p className="text-[14px] text-[#888] truncate">{contact.groups?.length ? contact.groups.join(", ") : "Ungrouped"}</p>
                    </div>
                    {!contact.hasWhatsApp && (
                      <span className="inline-flex items-center px-3 py-0.5 rounded-md text-[14px] font-semibold bg-[#FEF7E0] text-[#B06000] whitespace-nowrap">
                        No WhatsApp
                      </span>
                    )}
                  </div>
                );
              })}

              {filteredContacts.length === 0 && (
                <div className="py-10 text-center text-[16px] text-[#9ca3af]">
                  {contacts.length === 0 ? "No contacts yet. Add one to get started." : "No contacts match your search."}
                </div>
              )}

              {filteredContacts.length > CONTACTS_PAGE_SIZE && (
                <button
                  onClick={() => setShowAllContacts((p) => !p)}
                  className="w-full text-center text-[16px] font-semibold text-[#2563eb] hover:underline cursor-pointer py-2"
                >
                  {showAllContacts ? "Show less" : `Show more (${filteredContacts.length - CONTACTS_PAGE_SIZE})`}
                </button>
              )}
            </div>
          </div>

          {/* Will be delivered to */}
          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-[0px_2px_10px_rgba(0,0,0,0.04)]">
            <h3 className="text-[18px] font-bold text-[#1a1a2e] mb-4">Will be delivered to</h3>

            <div className="flex flex-col gap-3 mb-5">
              {channels.whatsapp && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#dcfce7] text-[#16a34a] grid place-items-center text-[14px] font-bold">
                      W
                    </div>
                    <span className="text-[16px] font-medium text-[#333]">WhatsApp</span>
                  </div>
                  <span className="text-[18px] font-bold text-[#1a1a2e]">{whatsappCount}</span>
                </div>
              )}
              {channels.email && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#eff6ff] text-[#2563eb] grid place-items-center text-[14px] font-bold">
                      E
                    </div>
                    <span className="text-[16px] font-medium text-[#333]">Email</span>
                  </div>
                  <span className="text-[18px] font-bold text-[#1a1a2e]">{emailCount}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setConfirmModalOpen(true)}
              disabled={selectedContacts.length === 0}
              className={`w-full flex items-center justify-center gap-2 h-[46px] rounded-[10px] text-[16px] font-semibold transition-colors ${
                selectedContacts.length === 0
                  ? "bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed"
                  : "bg-[#2563eb] text-white hover:bg-[#1d4ed8] cursor-pointer"
              }`}
            >
              Confirm
              <FiArrowRight className="text-[18px]" />
            </button>
          </div>
        </div>
      </div>

      {groupsModalOpen && (
        <GroupsModal
          contacts={contacts}
          groups={groupList}
          partialGroups={partialGroups}
          onClose={() => setGroupsModalOpen(false)}
          onCreateGroup={createGroup}
          onDeleteGroup={deleteGroup}
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

      {confirmModalOpen && (
        <ConfirmSendModal
          contacts={selectedContacts}
          templateId={templateId}
          messageType={channels.whatsapp ? "whatsapp" : "email"}
          subject={emailSubject}
          onClose={() => setConfirmModalOpen(false)}
          onConfirm={handleConfirmSend}
        />
      )}
    </div>
  );
}
