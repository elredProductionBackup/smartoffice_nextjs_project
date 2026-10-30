"use client";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { FiAlertCircle, FiArrowLeft, FiCheckCircle, FiLink } from "react-icons/fi";
import { parseSheet } from "@/utils/parseSheet";

// Same fields as the Add attendee popup; only name is required
const FIELDS = [
  { key: "name", label: "Name", required: true, aliases: ["name", "fullname", "attendee", "attendeename", "membername"] },
  { key: "company", label: "Company name", aliases: ["company", "companyname", "organisation", "organization", "org", "firm", "business"] },
  { key: "designation", label: "Designation", aliases: ["designation", "title", "jobtitle", "role", "position"] },
  { key: "whatsapp", label: "WhatsApp number", aliases: ["whatsapp", "whatsappnumber", "mobile", "mobilenumber", "phone", "phonenumber", "contact", "contactnumber"] },
  { key: "email", label: "Email", aliases: ["email", "emailaddress", "emailid", "mail"] },
];

const PREVIEW_ROWS = 5;

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

const btnOutline =
  "inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-[#0B57D0] bg-white text-[#0B57D0] text-[14px] font-bold hover:bg-[#D3E3FD]/50 transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-45";
const btnFill =
  "inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-[#1D72E8] text-white text-[14px] font-bold hover:bg-[#0B57D0] transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-45";

// onImport(items) gets popup-shaped rows ({ name, company, designation, whatsapp, email }) and resolves
// to { addedCount, joined[], failed[] } with `index` pointing into items. onBack returns to file picking.
// onImported(summary) fires once the import finishes, with failed[] including rows skipped for no name.
const SheetImportModal = ({ file, onClose, onBack, onImport, onImported }) => {
  const [sheet, setSheet] = useState(null);
  const [parseError, setParseError] = useState("");
  const [match, setMatch] = useState({});
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

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !submitting && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, submitting]);

  // Mapped rows, skipping ones where every mapped column is empty
  const items = useMemo(() => {
    if (!sheet) return [];
    return sheet.rows
      .map(({ cells, line }) => {
        const values = Object.fromEntries(
          FIELDS.map((f) => [f.key, match[f.key] >= 0 ? (cells[match[f.key]] || "").replace(/\s+/g, " ") : ""])
        );
        return { values, line };
      })
      .filter(({ values }) => Object.values(values).some(Boolean));
  }, [sheet, match]);

  const missingName = items.filter((it) => !it.values.name).length;
  const nameMapped = match.name >= 0;

  const submit = async () => {
    setSubmitting(true);
    setSubmitError("");
    // Nameless rows never reach the API; they're listed with the API's own skipped rows
    const toSend = items.filter((it) => it.values.name);
    const noName = items
      .filter((it) => !it.values.name)
      .map((it) => ({ index: `local-${it.line}`, line: it.line, name: "", reason: "name is required" }));
    try {
      const res = await onImport(toSend.map((it) => it.values));
      const lineOf = (index) => toSend[index]?.line;
      const summary = {
        addedCount: res.addedCount || 0,
        joined: (res.joined || []).map((j) => ({ ...j, line: lineOf(j.index) })),
        failed: [...(res.failed || []).map((f) => ({ ...f, line: lineOf(f.index) })), ...noName].sort(
          (a, b) => a.line - b.line
        ),
      };
      setResult(summary);
      onImported?.(summary);
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
    ? `${file.name} · ${items.length} ${items.length === 1 ? "row" : "rows"}`
    : file.name;

  return (
    <div
      className="fixed inset-0 z-[200] grid place-items-center bg-[rgba(20,30,55,0.35)] p-4 md:p-5"
      onMouseDown={(e) => e.target === e.currentTarget && !submitting && onClose()}
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
            onClick={onClose}
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
              <FiAlertCircle className="mt-0.5 shrink-0 text-[18px]" />
              {parseError}
            </div>
          ) : !sheet ? (
            <p className="py-10 text-center text-[15px] text-[#64748B]">Reading sheet...</p>
          ) : result ? (
            <ImportResult result={result} />
          ) : (
            <>
              <p className="text-[15px] text-[#64748B]">
                Pick the sheet column for each field. Only Name is required; leave the rest as
                &ldquo;Don&apos;t import&rdquo; if the sheet doesn&apos;t have them.
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
                        onChange={(e) => setMatch((prev) => ({ ...prev, [f.key]: Number(e.target.value) }))}
                        className={`w-full appearance-none rounded-xl border bg-white py-2.5 pl-3 pr-10 text-base md:text-[15px] text-[#1E293B] outline-none cursor-pointer ${
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

              {/* Preview of the first few mapped rows */}
              <div className="mt-6 flex items-baseline justify-between gap-3">
                <p className="text-[15px] font-bold text-[#1E293B]">Preview</p>
                <p className="text-[13px] text-[#94A3B8]">
                  {items.length > PREVIEW_ROWS ? `First ${PREVIEW_ROWS} of ${items.length} rows` : `${items.length} rows`}
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
                          <td key={f.key} className="px-3 py-2.5 text-[#1E293B] truncate max-w-[180px]">
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
                          No rows with data under the matched columns.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {nameMapped && missingName > 0 && (
                <p className="mt-3 text-[14px] font-semibold text-[#B06000]">
                  {missingName} {missingName === 1 ? "row has" : "rows have"} no name and will be skipped.
                </p>
              )}
              {submitError && <p className="mt-3 text-[14px] font-bold text-[#DC2626]">{submitError}</p>}
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 border-t border-[#E2E8F0] px-5 md:px-[30px] pt-4 pb-5">
          {result ? (
            <button type="button" onClick={onClose} className={`${btnFill} ml-auto`}>
              Done
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onBack}
                disabled={submitting}
                className="mr-auto inline-flex items-center gap-1.5 text-[15px] font-bold text-[#0B57D0] hover:underline cursor-pointer disabled:cursor-not-allowed disabled:opacity-45"
              >
                <FiArrowLeft className="text-[16px]" />
                Choose another file
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-full px-3 py-1.5 font-bold text-[#475569] hover:bg-[#F1F5F9] hover:text-[#1E293B] cursor-pointer disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              {sheet && (
                <button
                  type="button"
                  onClick={submit}
                  disabled={submitting || !nameMapped || items.length === missingName}
                  className={btnFill}
                >
                  {submitting
                    ? "Adding..."
                    : `Add ${items.length - missingName} ${items.length - missingName === 1 ? "attendee" : "attendees"}`}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

function ImportResult({ result }) {
  const { addedCount, joined, failed } = result;
  return (
    <>
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        <Stat label="Added" value={addedCount} className="text-[#137333]" />
        <Stat label="Linked to app" value={joined.length} className="text-[#0B57D0]" />
        <Stat label="Skipped" value={failed.length} className={failed.length ? "text-[#B91C1C]" : "text-[#475569]"} />
      </div>

      {joined.length > 0 && (
        <section className="mt-6">
          <p className="flex items-center gap-2 text-[15px] font-bold text-[#1E293B]">
            <FiLink className="text-[#0B57D0]" />
            Linked to app profiles
          </p>
          <p className="mt-0.5 text-[13px] text-[#64748B]">Matched by mobile number. Check none of these are a mistyped number.</p>
          <ul className="mt-2 divide-y divide-[#E2E8F0] rounded-xl border border-[#E2E8F0]">
            {joined.map((j) => (
              <li key={j.index} className="flex flex-wrap md:flex-nowrap items-center gap-x-3 gap-y-0.5 px-4 py-2.5 text-[14px]">
                <span className="w-[64px] shrink-0 text-[#94A3B8]">Row {j.line}</span>
                <span className="font-semibold text-[#1E293B]">{j.name}</span>
                <span className="text-[#94A3B8]">→ linked to</span>
                <span className="font-semibold text-[#0B57D0]">{j.matchedProfileName}</span>
                {j.phoneNumber && <span className="ml-auto text-[#94A3B8]">{j.phoneNumber}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {failed.length > 0 && (
        <section className="mt-6">
          <p className="flex items-center gap-2 text-[15px] font-bold text-[#1E293B]">
            <FiAlertCircle className="text-[#DC2626]" />
            Skipped rows
          </p>
          <p className="mt-0.5 text-[13px] text-[#64748B]">Fix these in the sheet and upload just those rows again.</p>
          <ul className="mt-2 divide-y divide-[#E2E8F0] rounded-xl border border-[#E2E8F0]">
            {failed.map((f) => (
              <li key={f.index} className="flex flex-wrap md:flex-nowrap items-start gap-x-3 gap-y-0.5 px-4 py-2.5 text-[14px]">
                <span className="w-[64px] shrink-0 text-[#94A3B8]">Row {f.line}</span>
                <span className="w-[calc(100%-76px)] md:w-[180px] shrink-0 truncate font-semibold text-[#1E293B]">{f.name || "No name"}</span>
                <span className="text-[#B91C1C]">{f.reason}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {joined.length === 0 && failed.length === 0 && (
        <p className="mt-6 flex items-center gap-2 text-[15px] font-semibold text-[#137333]">
          <FiCheckCircle /> Every row was added.
        </p>
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
