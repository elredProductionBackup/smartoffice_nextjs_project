"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FiX, FiChevronDown, FiCheckCircle, FiAlertTriangle, FiArrowRight, FiCheck, FiTrash2 } from "react-icons/fi";
import { CSV_FIELDS, buildContacts, guessMapping } from "./csvImport";

const PREVIEW_ROWS = 3;

// Column picker: each option shows the CSV header plus a sample value from that column.
function ColumnSelect({ value, headers, samples, usedBy, required, invalid, disabled, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (idx) => {
    onChange(idx);
    setOpen(false);
  };

  const emptyLabel = required ? "Select column" : "Don't import";
  const selected = value >= 0 ? headers[value] : "";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((p) => !p)}
        className={`w-full flex items-center justify-between gap-2 h-[40px] px-3 rounded-[8px] border bg-white text-[13px] transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
          open
            ? "border-[#2563eb] ring-2 ring-[#2563eb]/15"
            : invalid
              ? "border-red-400"
              : "border-[#d1d5db] hover:border-[#9ca3af]"
        }`}
      >
        <span className={`truncate ${selected ? "text-[#111] font-medium" : "text-[#9ca3af]"}`}>
          {selected || emptyLabel}
        </span>
        <FiChevronDown className={`shrink-0 text-[#6b7280] text-[16px] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-30 w-full mt-1 bg-white border border-[#e5e7eb] rounded-[10px] shadow-lg p-1.5 max-h-[240px] overflow-y-auto">
          <button
            type="button"
            onClick={() => pick(-1)}
            className={`w-full flex items-center justify-between px-3 py-2 text-[13px] text-left rounded-[7px] cursor-pointer ${
              value < 0 ? "bg-[#eff6ff] text-[#2563eb] font-medium" : "text-[#6b7280] hover:bg-[#f9fafb]"
            }`}
          >
            {emptyLabel}
            {value < 0 && <FiCheck className="text-[14px]" />}
          </button>
          <div className="h-px bg-[#f1f5f9] my-1" />
          {headers.map((h, i) => {
            const active = value === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => pick(i)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left rounded-[7px] cursor-pointer ${
                  active ? "bg-[#eff6ff]" : "hover:bg-[#f9fafb]"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] truncate ${active ? "text-[#2563eb] font-semibold" : "text-[#111] font-medium"}`}>{h}</p>
                  {samples[i] && <p className="text-[11px] text-[#9ca3af] truncate">{samples[i]}</p>}
                </div>
                {usedBy[i] && !active && (
                  <span className="shrink-0 text-[10px] font-semibold text-[#6b7280] bg-[#f3f4f6] rounded-full px-2 py-0.5">
                    {usedBy[i]}
                  </span>
                )}
                {active && <FiCheck className="shrink-0 text-[14px] text-[#2563eb]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const SUCCESS_HOLD_MS = 1400;

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

function FixField({ label, value, error, onChange }) {
  return (
    <div className="min-w-0">
      <label className="block text-[11px] font-semibold text-[#6b7280] mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full h-[38px] px-3 rounded-[8px] border bg-white text-base md:text-[13px] text-[#111] outline-none transition-colors ${
          error ? "border-red-400 focus:border-red-500" : "border-[#d1d5db] focus:border-[#2563eb]"
        }`}
      />
      {error && <p className="text-[11px] text-red-600 mt-1">{error}</p>}
    </div>
  );
}

// Lists every row that had a problem when it was opened. Fixed rows stay in
// place with a check so the list doesn't jump while the user types.
function FixIssuesModal({ rowIndexes, itemsByIndex, onEdit, onRemove, onBack, readyCount, issueCount, onImport }) {
  const rows = rowIndexes.map((i) => itemsByIndex.get(i)).filter(Boolean); // removed rows drop out
  const canImport = issueCount === 0 && readyCount > 0;

  return (
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/40"
      onClick={(e) => {
        e.stopPropagation();
        onBack();
      }}
    >
      <div
        className="bg-white rounded-[16px] w-full max-w-[680px] mx-4 shadow-xl flex flex-col max-h-[90dvh] md:max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5 md:px-6 pb-4 border-b border-[#f1f5f9]">
          <div>
            <h3 className="text-[18px] font-bold text-[#1a1a2e] leading-tight">Fix contacts</h3>
            <p className="text-[12px] mt-0.5">
              {issueCount > 0 ? (
                <span className="text-amber-700 font-semibold">{issueCount} left to fix</span>
              ) : (
                <span className="text-green-700 font-semibold">All fixed</span>
              )}
            </p>
          </div>
          <button onClick={onBack} aria-label="Close" className="text-[#999] hover:text-[#333] cursor-pointer mt-0.5 max-md:p-2 max-md:-m-2">
            <FiX className="text-[20px]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 md:px-6 py-4 flex flex-col gap-3">
          {rows.map((item) => (
            <div
              key={item.index}
              className={`rounded-[12px] border p-3 transition-colors ${
                item.ok ? "border-green-200 bg-green-50/50" : "border-amber-200 bg-amber-50/40"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[12px] font-semibold text-[#6b7280]">Row {item.rowNumber}</span>
                <div className="flex items-center gap-1">
                  {item.ok && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-green-700">
                      <FiCheck className="text-[13px]" />
                      Fixed
                    </span>
                  )}
                  <button
                    onClick={() => onRemove(item.index)}
                    title="Remove from import"
                    className="text-red-500 hover:bg-red-50 rounded-[6px] p-2 md:p-1.5 cursor-pointer transition-colors"
                  >
                    <FiTrash2 className="text-[14px]" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {CSV_FIELDS.map((f) => (
                  <FixField
                    key={f.key}
                    label={f.required ? `${f.label} *` : f.label}
                    value={item.values[f.key]}
                    error={item.errors[f.key]}
                    onChange={(v) => onEdit(item.index, f.key, v)}
                  />
                ))}
              </div>
            </div>
          ))}
          {rows.length === 0 && <p className="py-8 text-center text-[13px] text-[#9ca3af]">Nothing to fix.</p>}
        </div>

        <div className="flex items-center justify-end gap-3 px-5 md:px-6 py-4 border-t border-[#f1f5f9]">
          <button
            onClick={onBack}
            className="px-5 h-[40px] rounded-[8px] border border-[#d1d5db] text-[13px] font-semibold text-[#333] hover:bg-[#f9fafb] cursor-pointer"
          >
            Back
          </button>
          <button
            onClick={onImport}
            disabled={!canImport}
            className={`px-5 h-[40px] rounded-[8px] text-[13px] font-semibold transition-colors ${
              canImport ? "bg-[#2563eb] text-white hover:bg-[#1d4ed8] cursor-pointer" : "bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed"
            }`}
          >
            Import {readyCount}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CsvMappingModal({ fileName, headers, rows, rowNumbers, group, onCancel, onImport, onDone }) {
  const [mapping, setMapping] = useState(() => guessMapping(headers));
  const [edits, setEdits] = useState({}); // { [rowIndex]: { name, phone, email } }
  const [removed, setRemoved] = useState(() => new Set());
  const [fixRows, setFixRows] = useState(null); // row indexes shown in the fix popup, null = closed
  const [status, setStatus] = useState("idle"); // idle | importing | imported
  const [importedCount, setImportedCount] = useState(0);
  const [error, setError] = useState("");

  const missingRequired = CSV_FIELDS.filter((f) => f.required && mapping[f.key] < 0);
  const { items, ready, issues } = useMemo(
    () => buildContacts(rows, rowNumbers, mapping, edits, removed),
    [rows, rowNumbers, mapping, edits, removed]
  );
  const itemsByIndex = useMemo(() => new Map(items.map((it) => [it.index, it])), [items]);
  const mappingDone = missingRequired.length === 0;
  const canImport = mappingDone && ready.length > 0 && issues.length === 0 && status === "idle";

  // First non-empty value in each column, shown as a hint
  const samples = useMemo(() => headers.map((_, i) => rows.find((r) => r[i])?.[i] || ""), [headers, rows]);
  const sampleFor = (idx) => (idx < 0 ? "" : samples[idx]);

  // Column index → label of the field currently using it ("Phone"), to flag taken columns
  const usedBy = useMemo(() => {
    const map = {};
    CSV_FIELDS.forEach((f) => {
      if (mapping[f.key] >= 0) map[mapping[f.key]] = f.label;
    });
    return map;
  }, [mapping]);

  const setField = (key, idx) => {
    setError("");
    // Fixes were typed against the old columns — start over with the new mapping
    setEdits({});
    setRemoved(new Set());
    // A column feeds one field only: take it away from any other field using it
    setMapping((prev) => {
      const next = { ...prev, [key]: idx };
      if (idx >= 0) {
        Object.keys(next).forEach((k) => {
          if (k !== key && next[k] === idx) next[k] = -1;
        });
      }
      return next;
    });
  };

  const editRow = (index, key, value) => {
    setEdits((prev) => ({ ...prev, [index]: { ...(prev[index] || itemsByIndex.get(index).values), [key]: value } }));
  };

  const removeRow = (index) => setRemoved((prev) => new Set(prev).add(index));

  const openFix = () => setFixRows(issues.map((it) => it.index));

  const handleImport = async () => {
    if (!canImport) return;
    setFixRows(null);
    setStatus("importing");
    setError("");
    try {
      await onImport(ready);
      setImportedCount(ready.length);
      setStatus("imported");
      setTimeout(() => onDone(ready.length), SUCCESS_HOLD_MS);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Import failed");
      setStatus("idle");
    }
  };

  const close = () => status === "idle" && onCancel();

  if (status !== "idle") {
    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40" onClick={(e) => e.stopPropagation()}>
        <div className="bg-white rounded-[16px] w-full max-w-[360px] mx-4 shadow-xl p-5 md:p-6">
          {status === "importing" ? (
            <div className="flex flex-col items-center py-3 gap-3">
              <div className="w-8 h-8 border-[3px] border-[#2563eb] border-t-transparent rounded-full animate-spin" />
              <p className="text-[13px] font-semibold text-[#333]">Importing {plural(ready.length, "contact")}…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center py-3 gap-2">
              <FiCheckCircle className="text-[32px] text-green-500" />
              <p className="text-[14px] font-semibold text-[#1a1a2e]">{plural(importedCount, "contact")} imported</p>
              <p className="text-[12px] text-[#888]">
                into <span className="font-semibold text-[#2563eb]">{group}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40"
      onClick={(e) => {
        e.stopPropagation();
        close();
      }}
    >
      <div
        className="bg-white rounded-[16px] w-full max-w-[560px] mx-4 shadow-xl flex flex-col max-h-[90dvh] md:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-5 md:px-6 pb-4 border-b border-[#f1f5f9]">
          <div className="min-w-0">
            <h3 className="text-[18px] font-bold text-[#1a1a2e] leading-tight">Map columns</h3>
            <p className="text-[12px] text-[#888] mt-0.5 truncate">
              {fileName} · {plural(rows.length, "row")} → <span className="font-semibold text-[#2563eb]">{group}</span>
            </p>
          </div>
          <button onClick={close} aria-label="Close" className="text-[#999] hover:text-[#333] cursor-pointer mt-0.5 max-md:p-2 max-md:-m-2">
            <FiX className="text-[20px]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 md:px-6 py-4">
          {/* Field → column */}
          <div className="flex flex-col gap-3">
            {CSV_FIELDS.map((field) => {
              const idx = mapping[field.key];
              const unmapped = idx < 0;
              const sample = sampleFor(idx);
              return (
                <div key={field.key} className="grid grid-cols-[88px_16px_1fr] sm:grid-cols-[110px_20px_1fr] items-start gap-2">
                  <div className="h-[40px] flex items-center text-[13px] font-semibold text-[#333]">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-0.5">*</span>}
                  </div>
                  <div className="h-[40px] flex items-center text-[#9ca3af]">
                    <FiArrowRight className="text-[14px]" />
                  </div>
                  <div className="min-w-0">
                    <ColumnSelect
                      value={idx}
                      headers={headers}
                      samples={samples}
                      usedBy={usedBy}
                      required={field.required}
                      invalid={unmapped && field.required}
                      disabled={status !== "idle"}
                      onChange={(i) => setField(field.key, i)}
                    />
                    {sample && <p className="text-[11px] text-[#9ca3af] mt-1 truncate">e.g. {sample}</p>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Result */}
          {mappingDone && (
            <>
              <div className="flex flex-wrap items-center gap-2 mt-5">
                <span className="flex items-center gap-1.5 text-[12px] font-semibold text-green-700 bg-green-50 rounded-full px-2.5 py-1">
                  <FiCheckCircle className="text-[13px]" />
                  {ready.length} ready
                </span>
                {issues.length > 0 && (
                  <button
                    onClick={openFix}
                    className="flex items-center gap-1.5 text-[12px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-full px-2.5 py-1 cursor-pointer transition-colors"
                  >
                    <FiAlertTriangle className="text-[13px]" />
                    {issues.length} need fixing
                    <span className="underline underline-offset-2">Review</span>
                  </button>
                )}
                {removed.size > 0 && (
                  <span className="text-[12px] font-semibold text-[#6b7280] bg-[#f3f4f6] rounded-full px-2.5 py-1">
                    {removed.size} removed
                  </span>
                )}
              </div>

              {ready.length > 0 && (
                <div className="mt-3 border border-[#e5e7eb] rounded-[10px] overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <thead className="bg-[#f9fafb] text-[#6b7280]">
                      <tr>
                        {CSV_FIELDS.map((f) => (
                          <th key={f.key} className="text-left font-semibold px-3 py-2 whitespace-nowrap">
                            {f.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ready.slice(0, PREVIEW_ROWS).map((c) => (
                        <tr key={c.phone} className="border-t border-[#f1f5f9] text-[#111]">
                          {CSV_FIELDS.map((f) => (
                            <td key={f.key} className="px-3 py-2 max-w-[180px] truncate">
                              {c[f.key] || <span className="text-[#cbd5e1]">—</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {error && <p className="text-[12px] text-red-600 mt-3">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 md:px-6 py-4 border-t border-[#f1f5f9]">
          <button
            onClick={close}
            className="px-5 h-[40px] rounded-[8px] border border-[#d1d5db] text-[13px] font-semibold text-[#333] hover:bg-[#f9fafb] cursor-pointer"
          >
            Cancel
          </button>
          {mappingDone && issues.length > 0 ? (
            <button
              onClick={openFix}
              className="px-5 h-[40px] rounded-[8px] text-[13px] font-semibold bg-amber-500 text-white hover:bg-amber-600 cursor-pointer transition-colors"
            >
              Fix {issues.length} to import
            </button>
          ) : (
            <button
              onClick={handleImport}
              disabled={!canImport}
              className={`px-5 h-[40px] rounded-[8px] text-[13px] font-semibold transition-colors ${
                canImport ? "bg-[#2563eb] text-white hover:bg-[#1d4ed8] cursor-pointer" : "bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed"
              }`}
            >
              Import {ready.length || ""}
            </button>
          )}
        </div>
      </div>

      {fixRows && (
        <FixIssuesModal
          rowIndexes={fixRows}
          itemsByIndex={itemsByIndex}
          onEdit={editRow}
          onRemove={removeRow}
          onBack={() => setFixRows(null)}
          readyCount={ready.length}
          issueCount={issues.length}
          onImport={handleImport}
        />
      )}
    </div>
  );
}
