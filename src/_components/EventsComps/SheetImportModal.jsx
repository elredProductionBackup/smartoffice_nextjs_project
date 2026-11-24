"use client";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { FiAlertTriangle, FiArrowLeft, FiCheck, FiCheckCircle, FiLink, FiTrash2 } from "react-icons/fi";
import { parseSheet } from "@/utils/parseSheet";
import { fieldForReason, toApiPhone, validateAttendee } from "@/utils/attendeeContact";

// Same fields as the Add attendee popup; only name is required
const FIELDS = [
  { key: "name", label: "Name", required: true, aliases: ["name", "fullname", "attendee", "attendeename", "membername"] },
  { key: "company", label: "Company name", aliases: ["company", "companyname", "organisation", "organization", "org", "firm", "business"] },
  { key: "designation", label: "Designation", aliases: ["designation", "title", "jobtitle", "role", "position"] },
  { key: "whatsapp", label: "WhatsApp number", aliases: ["whatsapp", "whatsappnumber", "mobile", "mobilenumber", "phone", "phonenumber", "contact", "contactnumber"] },
  { key: "email", label: "Email", aliases: ["email", "emailaddress", "emailid", "mail"] },
];

// Fix popup puts the fields most likely to need fixing first
const FIX_FIELDS = ["name", "whatsapp", "email", "company", "designation"].map((k) => FIELDS.find((f) => f.key === k));

const PREVIEW_ROWS = 5;

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

const norm = (s = "") => s.toLowerCase().replace(/[^a-z0-9]/g, "");

// Header index per field: exact alias first, then a header that contains an alias; each header used once
function autoMatch(headers) {
  const keys = headers.map(norm);
  const used = new Set();
  const pick = (test) => {
    const i = keys.findIndex((k, idx) => !used.has(idx) && k && test(k));
    if (i !== -1) used.add(i);
    return i;
  };
  const match = {};
  FIELDS.forEach((f) => (match[f.key] = pick((k) => f.aliases.includes(k))));
  FIELDS.forEach((f) => {
    if (match[f.key] === -1) match[f.key] = pick((k) => f.aliases.some((a) => k.includes(a)));
  });
  return match;
}

const btnFill =
  "inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-[#1D72E8] text-white text-[14px] font-bold hover:bg-[#0B57D0] transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-45";
const btnWarn =
  "inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-[#F59E0B] text-white text-[14px] font-bold hover:bg-[#D97706] transition cursor-pointer";
const btnGhost =
  "rounded-full px-3 py-1.5 font-bold text-[#475569] hover:bg-[#F1F5F9] hover:text-[#1E293B] cursor-pointer disabled:cursor-not-allowed";

// onImport(items) gets popup-shaped rows ({ name, company, designation, whatsapp, email }) and resolves
// to { addedCount, joined[], failed[] } with `index` pointing into items. onBack returns to file picking.
// Nothing is skipped: rows that fail the checks here, or that the server rejects, go to the Fix popup
// to be corrected or removed. onImported({ addedCount, joined[], removedCount }) fires once all are in.
const SheetImportModal = ({ file, onClose, onBack, onImport, onImported }) => {
  const [sheet, setSheet] = useState(null);
  const [parseError, setParseError] = useState("");
  const [match, setMatch] = useState({});
  const [edits, setEdits] = useState({}); // { [line]: values } typed in the Fix popup
  const [removed, setRemoved] = useState(() => new Set()); // lines left out of the import
  const [serverErrors, setServerErrors] = useState({}); // { [line]: { name|whatsapp|email|row: reason } }
  const [saved, setSaved] = useState(() => new Set()); // lines an earlier submit already added
  const [totals, setTotals] = useState({ addedCount: 0, joined: [] });
  const [fixLines, setFixLines] = useState(null); // lines listed in the Fix popup, null = closed
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    parseSheet(file)
      .then((s) => {
        if (cancelled) return;
        setSheet(s);
        setMatch(autoMatch(s.headers));
      })
      .catch((err) => !cancelled && setParseError(err.message || "Couldn't read this sheet."));
    return () => {
      cancelled = true;
    };
  }, [file]);

  // Mapped rows, leaving out ones where every mapped column is empty
  const baseRows = useMemo(() => {
    if (!sheet) return [];
    return sheet.rows
      .map(({ cells, line }) => ({
        line,
        values: Object.fromEntries(
          FIELDS.map((f) => [f.key, match[f.key] >= 0 ? (cells[match[f.key]] || "").replace(/\s+/g, " ") : ""])
        ),
      }))
      .filter(({ values }) => Object.values(values).some(Boolean));
  }, [sheet, match]);

  // Rows still to send, with the user's fixes applied and every problem found
  const items = useMemo(() => {
    const firstByPhone = new Map();
    return baseRows
      .filter(({ line }) => !removed.has(line) && !saved.has(line))
      .map(({ line, values: mapped }) => {
        const values = edits[line] || mapped;
        const errors = { ...validateAttendee(values), ...serverErrors[line] };
        // The same number twice would add one person twice — flag the later row
        if (!errors.whatsapp && values.whatsapp) {
          const phone = toApiPhone(values.whatsapp);
          const first = firstByPhone.get(phone);
          if (first) errors.whatsapp = `Same number as row ${first}`;
          else firstByPhone.set(phone, line);
        }
        return { line, values, errors, ok: Object.keys(errors).length === 0 };
      });
  }, [baseRows, edits, removed, saved, serverErrors]);

  const ready = items.filter((it) => it.ok);
  const issues = items.filter((it) => !it.ok);
  const itemsByLine = useMemo(() => new Map(items.map((it) => [it.line, it])), [items]);
  const nameMapped = match.name >= 0;
  const started = totals.addedCount > 0; // some rows are saved; the mapping is locked from here
  const canSubmit = !submitting && nameMapped && issues.length === 0 && (ready.length > 0 || started);

  const finish = (summary) => {
    const final = { ...summary, removedCount: removed.size };
    setResult(final);
    onImported?.(final);
  };

  // Closing part-way still reports what was saved, so the success popup isn't lost
  const close = () => {
    if (submitting) return;
    if (!result && started) onImported?.({ ...totals, removedCount: removed.size });
    onClose();
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape" || submitting) return;
      if (fixLines) setFixLines(null);
      else close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  const changeMatch = (key, idx) => {
    // Fixes were typed against the old columns — start over with the new mapping
    setEdits({});
    setRemoved(new Set());
    setServerErrors({});
    setMatch((prev) => ({ ...prev, [key]: idx }));
  };

  const editRow = (line, key, value) => {
    setEdits((prev) => ({ ...prev, [line]: { ...(prev[line] || itemsByLine.get(line).values), [key]: value } }));
    // A server rejection is re-checked on the next send, not kept against the edited row
    setServerErrors((prev) => {
      if (!prev[line]) return prev;
      const next = { ...prev };
      delete next[line];
      return next;
    });
  };

  const removeRow = (line) => setRemoved((prev) => new Set(prev).add(line));

  const openFix = () => setFixLines(issues.map((it) => it.line));

  const submit = async () => {
    if (!canSubmit) return;
    setFixLines(null);
    if (!ready.length) return finish(totals);

    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await onImport(ready.map((it) => it.values));
      const lineOf = (index) => ready[index]?.line;
      const failed = (res.failed || []).filter((f) => lineOf(f.index) != null);
      const failedLines = new Set(failed.map((f) => lineOf(f.index)));

      const next = {
        addedCount: totals.addedCount + (res.addedCount || 0),
        joined: [...totals.joined, ...(res.joined || []).map((j) => ({ ...j, line: lineOf(j.index) }))],
      };
      setTotals(next);
      setSaved((prev) => {
        const s = new Set(prev);
        ready.forEach((it) => !failedLines.has(it.line) && s.add(it.line));
        return s;
      });

      if (failed.length) {
        // Rejected rows go back for review with the server's reason under the right field
        setServerErrors((prev) => {
          const n = { ...prev };
          failed.forEach((f) => {
            n[lineOf(f.index)] = { [fieldForReason(f.reason) || "row"]: f.reason || "Couldn't add this row" };
          });
          return n;
        });
        setFixLines([...failedLines]);
      } else {
        finish(next);
      }
    } catch (err) {
      setSubmitError(err?.message || "Couldn't add the attendees. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const title = result ? "Import finished" : "Match columns";
  const subtitle = result
    ? file.name
    : sheet
    ? `${file.name} · ${plural(baseRows.length, "row")}`
    : file.name;

  return (
    <div
      className="fixed inset-0 z-[200] grid place-items-center bg-[rgba(20,30,55,0.35)] p-4 md:p-5"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-import-title"
        className="flex max-h-[calc(100dvh-32px)] md:max-h-full w-full max-w-[880px] flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_20px_50px_rgba(30,50,90,0.12)] font-nunito"
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5 md:px-[30px] md:pt-7">
          <div className="min-w-0">
            <h3 id="sheet-import-title" className="text-[20px] md:text-[24px] font-semibold text-[#1E293B]">
              {title}
            </h3>
            <p className="mt-1 truncate text-[15px] text-[#475569]">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={close}
            disabled={submitting}
            aria-label="Close"
            className="mt-1 grid place-items-center rounded-lg p-1.5 text-[#1E293B] hover:bg-[#F1F5F9] cursor-pointer disabled:cursor-not-allowed"
          >
            <X size={22} strokeWidth={1.8} />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-5 md:px-[30px] pt-5 pb-5">
          {parseError ? (
            <div className="flex items-start gap-2.5 rounded-xl border border-[#FECACA] bg-[#FEF6F6] px-4 py-3 text-[15px] font-semibold text-[#B91C1C]">
              <FiAlertTriangle className="mt-0.5 shrink-0 text-[18px]" />
              {parseError}
            </div>
          ) : !sheet ? (
            <p className="py-10 text-center text-[15px] text-[#64748B]">Reading sheet...</p>
          ) : result ? (
            <ImportResult result={result} />
          ) : (
            <>
              <p className="text-[15px] text-[#64748B]">
                Pick the sheet column for each field. Only Name is required.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {FIELDS.map((f) => (
                  <label key={f.key} className="block">
                    <span className="mb-1.5 flex items-baseline gap-2 text-[13.5px] font-bold text-[#475569]">
                      {f.label}
                      {f.required ? (
                        <span className="text-[#DC2626]">*</span>
                      ) : (
                        <span className="text-[12.5px] font-semibold text-[#94A3B8]">Optional</span>
                      )}
                    </span>
                    {/* Native arrow hidden so the chevron gets the same inset as the text */}
                    <div className="relative">
                      <select
                        value={match[f.key] ?? -1}
                        disabled={started || submitting}
                        onChange={(e) => changeMatch(f.key, Number(e.target.value))}
                        className={`w-full appearance-none rounded-xl border bg-white py-2.5 pl-3 pr-10 text-base md:text-[15px] text-[#1E293B] outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                          f.required && !nameMapped ? "border-[#DC2626]" : "border-[#E2E8F0] focus:border-[#0B57D0]"
                        }`}
                      >
                        <option value={-1}>Don&apos;t import</option>
                        {sheet.headers.map((h, i) => (
                          <option key={i} value={i}>
                            {h || `Column ${i + 1}`}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={18}
                        aria-hidden
                        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748B]"
                      />
                    </div>
                  </label>
                ))}
              </div>

              {!nameMapped && (
                <p className="mt-3 text-[14px] font-bold text-[#DC2626]">Pick the column that has the attendee names.</p>
              )}

              {/* Row status: ready / need fixing / removed / already added */}
              {nameMapped && (
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <Chip className="text-[#137333] bg-[#E6F4EA]">
                    <FiCheckCircle className="text-[14px]" />
                    {ready.length} ready
                  </Chip>
                  {issues.length > 0 && (
                    <button
                      type="button"
                      onClick={openFix}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF3C7] px-3 py-1 text-[13px] font-bold text-[#B45309] hover:bg-[#FDE68A] cursor-pointer transition-colors"
                    >
                      <FiAlertTriangle className="text-[14px]" />
                      {issues.length} need fixing
                      <span className="underline underline-offset-2">Review</span>
                    </button>
                  )}
                  {removed.size > 0 && <Chip className="text-[#475569] bg-[#F1F5F9]">{removed.size} removed</Chip>}
                  {started && <Chip className="text-[#0B57D0] bg-[#E8F0FE]">{totals.addedCount} added</Chip>}
                </div>
              )}

              {/* Preview of the first few rows still to send */}
              <div className="mt-5 flex items-baseline justify-between gap-3">
                <p className="text-[15px] font-bold text-[#1E293B]">Preview</p>
                <p className="text-[13px] text-[#94A3B8]">
                  {items.length > PREVIEW_ROWS ? `First ${PREVIEW_ROWS} of ${items.length} rows` : plural(items.length, "row")}
                </p>
              </div>
              <div className="mt-2 overflow-auto rounded-xl border border-[#E2E8F0]">
                <table className="w-full min-w-[680px] border-collapse text-left text-[14px]">
                  <thead className="bg-[#F2F7FF] text-[#475569]">
                    <tr>
                      <th className="px-3 py-2.5 font-bold w-[60px]">Row</th>
                      {FIELDS.map((f) => (
                        <th key={f.key} className="px-3 py-2.5 font-bold">
                          {f.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.slice(0, PREVIEW_ROWS).map((it) => (
                      <tr key={it.line} className="border-t border-[#E2E8F0]">
                        <td className="px-3 py-2.5 text-[#94A3B8]">{it.line}</td>
                        {FIELDS.map((f) => (
                          <td
                            key={f.key}
                            className={`px-3 py-2.5 truncate max-w-[180px] ${it.errors[f.key] ? "text-[#B45309] font-semibold" : "text-[#1E293B]"}`}
                          >
                            {it.values[f.key] ||
                              (f.required ? (
                                <span className="font-semibold text-[#DC2626]">Missing</span>
                              ) : (
                                <span className="text-[#CBD5E1]">—</span>
                              ))}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={FIELDS.length + 1} className="px-3 py-8 text-center text-[#94A3B8]">
                          No rows left to add.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {submitError && <p className="mt-3 text-[14px] font-bold text-[#DC2626]">{submitError}</p>}
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 border-t border-[#E2E8F0] px-5 md:px-[30px] pt-4 pb-5">
          {result ? (
            <button type="button" onClick={close} className={`${btnFill} ml-auto`}>
              Done
            </button>
          ) : (
            <>
              {!started && (
                <button
                  type="button"
                  onClick={onBack}
                  disabled={submitting}
                  className="mr-auto inline-flex items-center gap-1.5 text-[15px] font-bold text-[#0B57D0] hover:underline cursor-pointer disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <FiArrowLeft className="text-[16px]" />
                  Choose another file
                </button>
              )}
              <button type="button" onClick={close} disabled={submitting} className={`${btnGhost} ${started ? "ml-auto" : ""}`}>
                Cancel
              </button>
              {sheet &&
                (nameMapped && issues.length > 0 ? (
                  <button type="button" onClick={openFix} className={btnWarn}>
                    Fix {issues.length} to import
                  </button>
                ) : (
                  <button type="button" onClick={submit} disabled={!canSubmit} className={btnFill}>
                    {submitting ? "Adding..." : ready.length ? `Add ${plural(ready.length, "attendee")}` : "Done"}
                  </button>
                ))}
            </>
          )}
        </div>
      </div>

      {fixLines && (
        <FixRowsModal
          lines={fixLines}
          itemsByLine={itemsByLine}
          onEdit={editRow}
          onRemove={removeRow}
          onBack={() => setFixLines(null)}
          readyCount={ready.length}
          issueCount={issues.length}
          canSubmit={canSubmit}
          submitting={submitting}
          onSubmit={submit}
        />
      )}
    </div>
  );
};

// Every row that had a problem when the popup opened. Fixed rows stay in place with a check
// so the list doesn't jump while typing; removed rows drop out.
function FixRowsModal({ lines, itemsByLine, onEdit, onRemove, onBack, readyCount, issueCount, canSubmit, submitting, onSubmit }) {
  const rows = lines.map((l) => itemsByLine.get(l)).filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-[210] grid place-items-center bg-[rgba(20,30,55,0.35)] p-4"
      onMouseDown={(e) => e.target === e.currentTarget && !submitting && onBack()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="fix-rows-title"
        className="flex max-h-[calc(100dvh-32px)] md:max-h-[85vh] w-full max-w-[760px] flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_20px_50px_rgba(30,50,90,0.18)] font-nunito"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#E2E8F0] px-5 pt-5 pb-4 md:px-6">
          <div>
            <h3 id="fix-rows-title" className="text-[20px] font-semibold text-[#1E293B]">
              Fix attendees
            </h3>
            <p className="mt-0.5 text-[14px] font-bold">
              {issueCount > 0 ? (
                <span className="text-[#B45309]">{issueCount} left to fix</span>
              ) : (
                <span className="text-[#137333]">All fixed</span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            disabled={submitting}
            aria-label="Close"
            className="grid place-items-center rounded-lg p-1.5 text-[#1E293B] hover:bg-[#F1F5F9] cursor-pointer disabled:cursor-not-allowed"
          >
            <X size={22} strokeWidth={1.8} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-4 md:px-6">
          {rows.map((item) => (
            <div
              key={item.line}
              className={`rounded-xl border p-3 transition-colors ${
                item.ok ? "border-[#B7E1C1] bg-[#F3FAF5]" : "border-[#FCD34D] bg-[#FFFBEB]"
              }`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[13px] font-bold text-[#64748B]">Row {item.line}</span>
                <div className="flex items-center gap-1">
                  {item.ok && (
                    <span className="flex items-center gap-1 text-[12.5px] font-bold text-[#137333]">
                      <FiCheck className="text-[14px]" />
                      Fixed
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemove(item.line)}
                    title="Remove from import"
                    aria-label={`Remove row ${item.line} from import`}
                    className="rounded-md p-2 md:p-1.5 text-[#DC2626] hover:bg-[#FEE2E2] cursor-pointer transition-colors"
                  >
                    <FiTrash2 className="text-[15px]" />
                  </button>
                </div>
              </div>
              {item.errors.row && <p className="mb-2 text-[13px] font-semibold text-[#B91C1C]">{item.errors.row}</p>}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {FIX_FIELDS.map((f) => (
                  <FixField
                    key={f.key}
                    label={f.required ? `${f.label} *` : f.label}
                    value={item.values[f.key]}
                    error={item.errors[f.key]}
                    onChange={(v) => onEdit(item.line, f.key, v)}
                  />
                ))}
              </div>
            </div>
          ))}
          {rows.length === 0 && <p className="py-8 text-center text-[14px] text-[#94A3B8]">Nothing to fix.</p>}
        </div>

        <div className="flex items-center justify-end gap-2.5 border-t border-[#E2E8F0] px-5 pt-4 pb-5 md:px-6">
          <button type="button" onClick={onBack} disabled={submitting} className={btnGhost}>
            Back
          </button>
          <button type="button" onClick={onSubmit} disabled={!canSubmit} className={btnFill}>
            {submitting ? "Adding..." : readyCount ? `Add ${plural(readyCount, "attendee")}` : "Done"}
          </button>
        </div>
      </div>
    </div>
  );
}

const FixField = ({ label, value, error, onChange }) => (
  <label className="block min-w-0">
    <span className="mb-1 block text-[12px] font-bold text-[#64748B]">{label}</span>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={!!error}
      className={`h-[38px] w-full rounded-lg border bg-white px-3 text-base md:text-[14px] text-[#1E293B] outline-none transition-colors ${
        error ? "border-[#F87171] focus:border-[#DC2626]" : "border-[#E2E8F0] focus:border-[#0B57D0]"
      }`}
    />
    {error && <span className="mt-1 block text-[12px] text-[#DC2626]">{error}</span>}
  </label>
);

const Chip = ({ className, children }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-bold ${className}`}>
    {children}
  </span>
);

function ImportResult({ result }) {
  const { addedCount, joined, removedCount = 0 } = result;
  return (
    <>
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        <Stat label="Added" value={addedCount} className="text-[#137333]" />
        <Stat label="Linked to app" value={joined.length} className="text-[#0B57D0]" />
        <Stat label="Removed" value={removedCount} className="text-[#475569]" />
      </div>

      {joined.length > 0 ? (
        <section className="mt-6">
          <p className="flex items-center gap-2 text-[15px] font-bold text-[#1E293B]">
            <FiLink className="text-[#0B57D0]" />
            Linked to app profiles
          </p>
          <p className="mt-0.5 text-[13px] text-[#64748B]">Matched by mobile number. Check none of these are a mistyped number.</p>
          <ul className="mt-2 divide-y divide-[#E2E8F0] rounded-xl border border-[#E2E8F0]">
            {joined.map((j) => (
              <li key={j.line} className="flex flex-wrap md:flex-nowrap items-center gap-x-3 gap-y-0.5 px-4 py-2.5 text-[14px]">
                <span className="w-[64px] shrink-0 text-[#94A3B8]">Row {j.line}</span>
                <span className="font-semibold text-[#1E293B]">{j.name}</span>
                <span className="text-[#94A3B8]">→ linked to</span>
                <span className="font-semibold text-[#0B57D0]">{j.matchedProfileName}</span>
                {j.phoneNumber && <span className="ml-auto text-[#94A3B8]">{j.phoneNumber}</span>}
              </li>
            ))}
          </ul>
        </section>
      ) : (
        removedCount === 0 && (
          <p className="mt-6 flex items-center gap-2 text-[15px] font-semibold text-[#137333]">
            <FiCheckCircle /> Every row was added.
          </p>
        )
      )}
    </>
  );
}

const Stat = ({ label, value, className }) => (
  <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 md:px-4 py-3">
    <p className={`text-[22px] md:text-[26px] font-bold ${className}`}>{value}</p>
    <p className="text-[13px] font-semibold text-[#64748B]">{label}</p>
  </div>
);

export default SheetImportModal;
