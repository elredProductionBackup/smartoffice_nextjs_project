"use client";

import { useEffect, useRef, useState } from "react";
import { FiArrowLeft, FiCheck, FiChevronDown, FiX, FiAlertTriangle } from "react-icons/fi";
import { BsCheckAll } from "react-icons/bs";
import {
  TEMPLATE_CATEGORIES,
  CATEGORY_HELP,
  TEMPLATE_LANGUAGES,
  TEMPLATE_BUTTONS,
  PROMO_WORDS,
  EVENT_FIELDS,
  SAMPLE_MAP_VALUES,
  humanizeCode,
  extractPlaceholders,
} from "./templatesData";

function Dropdown({ value, options, onChange, disabled, renderLabel }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((p) => !p)}
        className={`w-full flex items-center justify-between h-[42px] px-3 rounded-[8px] border text-[13px] bg-white transition-colors ${
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
        } ${open ? "border-[#2563eb] ring-1 ring-[#2563eb]/30" : "border-[#d1d5db] hover:border-[#9ca3af]"}`}
      >
        <span className="text-[#111]">{renderLabel ? renderLabel(value) : value}</span>
        <FiChevronDown className={`text-[#6b7280] text-[16px] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && !disabled && (
        <div className="absolute z-30 w-full mt-1 bg-white border border-[#e5e7eb] rounded-[10px] shadow-lg py-1.5 px-1.5 max-h-[200px] overflow-y-auto">
          {options.map((opt) => {
            const isSelected = opt === value;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-[13px] text-left rounded-[7px] cursor-pointer ${
                  isSelected ? "bg-[#eff6ff] text-[#2563eb] font-medium" : "text-[#111] hover:bg-[#f9fafb]"
                }`}
              >
                {renderLabel ? renderLabel(opt) : opt}
                {isSelected && <FiCheck className="text-[#2563eb] text-[13px]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function renderHighlightedBody(body, mapping) {
  const parts = [];
  const regex = /\{\{(\d+)\}\}/g;
  let lastIndex = 0;
  let match;
  let key = 0;
  while ((match = regex.exec(body)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{body.slice(lastIndex, match.index)}</span>);
    }
    const num = match[1];
    const fieldValue = mapping[num];
    const sample = fieldValue ? SAMPLE_MAP_VALUES[fieldValue] : `Sample ${num}`;
    parts.push(
      <span key={key++} className="bg-[#FEF3C7] text-[#92400E] px-1 rounded-[4px] font-semibold">
        {sample}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < body.length) parts.push(<span key={key++}>{body.slice(lastIndex)}</span>);
  return parts;
}

function buildInitialState(template) {
  if (!template) {
    return {
      code: "",
      category: TEMPLATE_CATEGORIES[0],
      language: TEMPLATE_LANGUAGES[0],
      channels: { whatsapp: true, email: false },
      bodies: { whatsapp: "", email: "" },
      subject: "",
      footer: "",
      button: TEMPLATE_BUTTONS[0],
      variableMapping: {},
    };
  }
  return {
    code: template.code,
    category: template.category,
    language: template.language,
    channels: { whatsapp: template.channels.includes("whatsapp"), email: template.channels.includes("email") },
    bodies: { whatsapp: template.bodies.whatsapp || "", email: template.bodies.email || "" },
    subject: template.subject || "",
    footer: template.footer || "",
    button: template.button || TEMPLATE_BUTTONS[0],
    variableMapping: { ...(template.variableMapping || {}) },
  };
}

export default function TemplateFormModal({ mode, template, onBack, onSaveDraft, onSubmit }) {
  const isView = mode === "view";
  const textareaRef = useRef(null);

  const [form, setForm] = useState(() => buildInitialState(mode === "clone" ? { ...template, code: `${template.code}_fix` } : template));
  const [activeTab, setActiveTab] = useState(form.channels.whatsapp ? "whatsapp" : "email");
  const [submitAnyway, setSubmitAnyway] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 2500);
    return () => clearTimeout(t);
  }, [notice]);

  const toggleChannel = (key) => {
    if (isView) return;
    setForm((prev) => {
      const next = { ...prev.channels, [key]: !prev.channels[key] };
      if (!next.whatsapp && !next.email) return prev;
      if (activeTab === key && !next[key]) setActiveTab(next.whatsapp ? "whatsapp" : "email");
      return { ...prev, channels: next };
    });
  };

  const insertVariable = (token) => {
    if (isView) return;
    const el = textareaRef.current;
    const current = form.bodies[activeTab] || "";
    if (!el) {
      setForm((prev) => ({ ...prev, bodies: { ...prev.bodies, [activeTab]: current + token } }));
      return;
    }
    const start = el.selectionStart ?? current.length;
    const end = el.selectionEnd ?? current.length;
    const next = current.slice(0, start) + token + current.slice(end);
    setForm((prev) => ({ ...prev, bodies: { ...prev.bodies, [activeTab]: next } }));
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const body = form.bodies[activeTab] || "";
  const placeholders = extractPlaceholders(body);
  const name = humanizeCode(form.code);
  const validName = /^[a-z0-9_]+$/.test(form.code) && form.code.length > 0;

  const checks = [];
  checks.push({
    label: "Give the template a lowercase, underscored name.",
    status: validName ? "pass" : "fail",
  });
  if (form.channels.whatsapp) {
    checks.push({ label: "Write the WhatsApp body.", status: form.bodies.whatsapp.trim() ? "pass" : "fail" });
    checks.push({
      label: "Body is within the 1024 character limit.",
      status: form.bodies.whatsapp.length <= 1024 ? "pass" : "fail",
    });
  }
  if (form.channels.email) {
    checks.push({ label: "Write the Email subject.", status: form.subject.trim() ? "pass" : "fail" });
    checks.push({ label: "Write the Email body.", status: form.bodies.email.trim() ? "pass" : "fail" });
  }
  const unmapped = placeholders.filter((n) => !form.variableMapping[n]);
  checks.push({
    label: placeholders.length === 0 ? "No placeholders used." : "Every placeholder is mapped to a field.",
    status: unmapped.length === 0 ? "pass" : "fail",
  });
  checks.push({
    label: "Body does not start or end with a placeholder.",
    status: /^\{\{\d+\}\}/.test(body.trim()) || /\{\{\d+\}\}$/.test(body.trim()) ? "fail" : "pass",
  });
  const hasPromoWording = PROMO_WORDS.some((w) => body.toLowerCase().includes(w));
  checks.push({
    label: `Wording matches the ${form.category.toLowerCase()} category.`,
    status: form.category === "Utility" && hasPromoWording ? "fail" : "pass",
  });
  const footerWarn = !form.footer.trim();

  const hasBlockingFail = checks.some((c) => c.status === "fail");
  const canSubmit = !hasBlockingFail || submitAnyway;

  const handleFieldChange = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const toPayload = () => ({
    code: form.code,
    name,
    category: form.category,
    language: form.language,
    channels: [form.channels.whatsapp && "whatsapp", form.channels.email && "email"].filter(Boolean),
    bodies: form.bodies,
    subject: form.subject,
    footer: form.footer,
    button: form.button,
    variableMapping: form.variableMapping,
  });

  const handleSaveDraft = () => {
    onSaveDraft(toPayload());
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(toPayload());
  };

  const title = mode === "new" ? "New template" : mode === "clone" ? "Clone template" : mode === "view" ? "View template" : "Edit template";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={onBack}>
      <div
        className="bg-white rounded-[16px] w-full max-w-[900px] mx-4 shadow-xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-7 pt-6 pb-4 border-b border-[#f1f5f9]">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-[8px] hover:bg-[#f3f4f6] flex items-center justify-center text-[#333] cursor-pointer"
          >
            <FiArrowLeft className="text-[18px]" />
          </button>
          <h2 className="text-[20px] font-bold text-[#1a1a2e]">{title}</h2>
        </div>

        {notice && (
          <div className="mx-7 mt-4 inline-block w-fit px-4 py-2 rounded-[10px] bg-[#eff6ff] text-[#2563eb] text-[13px] font-semibold">
            {notice}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-7 py-5">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
            {/* LEFT: form fields */}
            <div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[#333] mb-1.5">Template name</label>
                  <input
                    value={form.code}
                    disabled={isView}
                    onChange={(e) => handleFieldChange({ code: e.target.value })}
                    placeholder="event_reminder_v2"
                    className="w-full h-[42px] px-3 rounded-[8px] border border-[#d1d5db] bg-white text-[13px] text-[#111] outline-none focus:border-[#2563eb] transition-colors placeholder:text-[#9ca3af] disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  <p className="text-[12px] text-[#9ca3af] mt-1.5">Lowercase, underscores, no spaces.</p>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[#333] mb-1.5">Category</label>
                  <Dropdown
                    value={form.category}
                    options={TEMPLATE_CATEGORIES}
                    onChange={(v) => handleFieldChange({ category: v })}
                    disabled={isView}
                  />
                  <p className="text-[12px] text-[#9ca3af] mt-1.5">{CATEGORY_HELP[form.category]}</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-[13px] font-semibold text-[#333] mb-1.5">Language</label>
                <div className="max-w-[240px]">
                  <Dropdown
                    value={form.language}
                    options={TEMPLATE_LANGUAGES}
                    onChange={(v) => handleFieldChange({ language: v })}
                    disabled={isView}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-[13px] font-semibold text-[#333] mb-1.5">Channels</label>
                <div className="flex items-center gap-2 h-[42px]">
                  <button
                    type="button"
                    disabled={isView}
                    onClick={() => toggleChannel("whatsapp")}
                    className={`flex items-center gap-1.5 h-full px-4 rounded-full border text-[13px] font-semibold transition-colors ${
                      isView ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                    } ${
                      form.channels.whatsapp
                        ? "border-[#16a34a] bg-[#f0fdf4] text-[#16a34a]"
                        : "border-[#d1d5db] text-[#9ca3af] hover:border-[#9ca3af]"
                    }`}
                  >
                    {form.channels.whatsapp && <FiCheck className="text-[14px]" />}
                    WhatsApp
                  </button>
                  <button
                    type="button"
                    disabled={isView}
                    onClick={() => toggleChannel("email")}
                    className={`flex items-center gap-1.5 h-full px-4 rounded-full border text-[13px] font-semibold transition-colors ${
                      isView ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                    } ${
                      form.channels.email
                        ? "border-[#2563eb] bg-[#eff6ff] text-[#2563eb]"
                        : "border-[#d1d5db] text-[#9ca3af] hover:border-[#9ca3af]"
                    }`}
                  >
                    {form.channels.email && <FiCheck className="text-[14px]" />}
                    Email
                  </button>
                </div>
                <p className="text-[12px] text-[#9ca3af] mt-1.5">
                  WhatsApp templates need Meta approval before they can send. Email doesn&apos;t.
                </p>
              </div>

              <div className="flex items-center gap-6 border-b border-[#e5e7eb] mb-4">
                {form.channels.whatsapp && (
                  <button
                    onClick={() => setActiveTab("whatsapp")}
                    className={`pb-2.5 text-[14px] font-semibold cursor-pointer border-b-2 -mb-px transition-colors ${
                      activeTab === "whatsapp" ? "border-[#16a34a] text-[#16a34a]" : "border-transparent text-[#9ca3af]"
                    }`}
                  >
                    WhatsApp
                  </button>
                )}
                {form.channels.email && (
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

              {activeTab === "email" && (
                <div className="mb-4">
                  <label className="block text-[13px] font-semibold text-[#333] mb-1.5">Subject</label>
                  <input
                    value={form.subject}
                    disabled={isView}
                    onChange={(e) => handleFieldChange({ subject: e.target.value })}
                    placeholder="e.g., Your event reminder"
                    className="w-full h-[42px] px-3 rounded-[8px] border border-[#d1d5db] bg-white text-[13px] text-[#111] outline-none focus:border-[#2563eb] transition-colors placeholder:text-[#9ca3af] disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              )}

              <div className="mb-1">
                <label className="block text-[13px] font-semibold text-[#333] mb-1.5">Body</label>
                <textarea
                  ref={textareaRef}
                  value={body}
                  disabled={isView}
                  onChange={(e) => setForm((prev) => ({ ...prev, bodies: { ...prev.bodies, [activeTab]: e.target.value } }))}
                  rows={6}
                  placeholder="Write your message..."
                  className="w-full border border-[#d1d5db] rounded-[10px] px-4 py-3 text-[14px] text-[#111] outline-none focus:border-[#2563eb] transition-colors placeholder:text-[#9ca3af] resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap mb-4">
                {["{{1}}", "{{2}}", "{{3}}", "{{4}}"].map((tok) => (
                  <button
                    key={tok}
                    disabled={isView}
                    onClick={() => insertVariable(tok)}
                    className="px-3 py-1 rounded-full border border-[#d1d5db] text-[12px] font-medium text-[#555] hover:border-[#2563eb] hover:text-[#2563eb] cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {tok}
                  </button>
                ))}
              </div>

              <div className="mb-4">
                <label className="block text-[13px] font-semibold text-[#333] mb-1.5">
                  Footer <span className="text-[#9ca3af] font-normal">optional</span>
                </label>
                <input
                  value={form.footer}
                  disabled={isView}
                  onChange={(e) => handleFieldChange({ footer: e.target.value })}
                  placeholder="Reply STOP to opt out"
                  className="w-full h-[42px] px-3 rounded-[8px] border border-[#d1d5db] bg-white text-[13px] text-[#111] outline-none focus:border-[#2563eb] transition-colors placeholder:text-[#9ca3af] disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div className="mb-6">
                <label className="block text-[13px] font-semibold text-[#333] mb-1.5">
                  Button <span className="text-[#9ca3af] font-normal">optional</span>
                </label>
                <div className="max-w-[280px]">
                  <Dropdown value={form.button} options={TEMPLATE_BUTTONS} onChange={(v) => handleFieldChange({ button: v })} disabled={isView} />
                </div>
              </div>

              {/* Variable mapping */}
              <div className="border border-[#e5e7eb] rounded-[12px] p-4">
                <h3 className="text-[14px] font-bold text-[#1a1a2e] mb-1">Variable mapping</h3>
                {placeholders.length === 0 ? (
                  <p className="text-[13px] text-[#9ca3af]">No placeholders in the body yet. Insert one to map it to an event field.</p>
                ) : (
                  <div className="flex flex-col gap-2 mt-2">
                    {placeholders.map((n) => (
                      <div key={n} className="flex items-center gap-3">
                        <span className="text-[13px] font-semibold text-[#333] w-12 shrink-0">{`{{${n}}}`}</span>
                        <div className="flex-1">
                          <Dropdown
                            value={EVENT_FIELDS.find((f) => f.value === form.variableMapping[n])?.label || "Choose a field"}
                            options={EVENT_FIELDS.map((f) => f.label)}
                            disabled={isView}
                            onChange={(label) => {
                              const field = EVENT_FIELDS.find((f) => f.label === label);
                              setForm((prev) => ({
                                ...prev,
                                variableMapping: { ...prev.variableMapping, [n]: field?.value },
                              }));
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: preview + checks */}
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="text-[15px] font-bold text-[#1a1a2e] mb-2">Preview</h3>
                {activeTab === "email" ? (
                  <div className="rounded-2xl border border-[#e5e7eb] bg-white overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#f1f5f9] flex flex-col gap-1">
                      <div className="flex items-center text-[12px]">
                        <span className="w-12 shrink-0 text-[#9ca3af]">To</span>
                        <span className="text-[#111] truncate">Sample Contact &lt;sample@company.in&gt;</span>
                      </div>
                      <div className="flex items-center text-[12px]">
                        <span className="w-12 shrink-0 text-[#9ca3af]">Subj</span>
                        <span className="text-[#1a1a2e] font-semibold truncate">
                          {form.subject || name || "Untitled template"}
                        </span>
                      </div>
                    </div>
                    <div className="px-4 py-4 text-[14px] text-[#111] whitespace-pre-wrap leading-relaxed">
                      {body ? renderHighlightedBody(body, form.variableMapping) : "Your email body will appear here."}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-[#EFE6DA] p-5">
                    <div className="bg-[#DCFCE7] rounded-2xl px-4 py-3 text-[14px] text-[#111] whitespace-pre-wrap leading-relaxed">
                      {body ? renderHighlightedBody(body, form.variableMapping) : "Your WhatsApp body will appear here."}
                      <div className="flex items-center justify-end gap-1 mt-2 text-[11px] text-[#6b7280]">
                        6:42 PM
                        <BsCheckAll className="text-[#53bdeb] text-[14px]" />
                      </div>
                    </div>
                  </div>
                )}
                <p className="text-[12px] text-[#9ca3af] mt-2">Highlighted parts are placeholders, shown with their sample values.</p>
              </div>

              <div className="border border-[#e5e7eb] rounded-[12px] p-4">
                <h3 className="text-[14px] font-bold text-[#1a1a2e] mb-3">Pre-submit checks</h3>
                <div className="flex flex-col gap-2">
                  {checks.map((c, i) => (
                    <div key={i} className="flex items-start gap-2 text-[13px]">
                      {c.status === "pass" ? (
                        <FiCheck className="text-green-600 text-[15px] mt-0.5 shrink-0" />
                      ) : (
                        <FiX className="text-red-600 text-[15px] mt-0.5 shrink-0" />
                      )}
                      <span className={c.status === "pass" ? "text-green-700" : "text-red-700"}>{c.label}</span>
                    </div>
                  ))}
                  {footerWarn && (
                    <div className="flex items-start gap-2 text-[13px]">
                      <FiAlertTriangle className="text-amber-500 text-[15px] mt-0.5 shrink-0" />
                      <span className="text-amber-700">No footer. An opt-out line reduces negative feedback.</span>
                    </div>
                  )}
                </div>

                {hasBlockingFail && !isView && (
                  <label className="flex items-center gap-2 mt-4 text-[13px] text-[#333] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={submitAnyway}
                      onChange={(e) => setSubmitAnyway(e.target.checked)}
                      className="w-4 h-4 accent-[#2563eb] cursor-pointer"
                    />
                    Submit anyway
                  </label>
                )}
              </div>

              {!isView && (
                <div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSaveDraft}
                      className="px-5 h-[42px] rounded-[8px] border border-[#d1d5db] text-[13px] font-semibold text-[#333] hover:bg-[#f9fafb] cursor-pointer whitespace-nowrap"
                    >
                      Save as draft
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={!canSubmit}
                      className={`flex-1 h-[42px] rounded-[8px] text-[13px] font-semibold transition-colors ${
                        canSubmit
                          ? "bg-[#2563eb] text-white hover:bg-[#1d4ed8] cursor-pointer"
                          : "bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed"
                      }`}
                    >
                      Submit to Meta
                    </button>
                  </div>
                  <p className="text-[12px] text-[#9ca3af] mt-2">One submission per template per 24 hours.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
