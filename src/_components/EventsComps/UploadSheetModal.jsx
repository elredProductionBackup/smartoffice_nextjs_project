"use client";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { FiDownload, FiFileText, FiUpload } from "react-icons/fi";

const ACCEPTED = [".xlsx", ".xls", ".csv"];
const MAX_SIZE_MB = 5;

const COLUMNS = [
  { label: "Name", required: true },
  { label: "Company name" },
  { label: "WhatsApp number" },
  { label: "Email" },
  { label: "Designation" },
];

const SAMPLE_ROWS = [
  ["Aarav Mehta", "Mehta Textiles", "+91 98765 43210", "aarav@mehtatextiles.com", "Managing Director"],
  ["Priya Nair", "Nair Logistics", "+91 91234 56789", "priya@nairlogistics.in", "Operations Head"],
  ["Rohan Kapoor", "Kapoor & Sons", "+91 99887 76655", "rohan@kapoorandsons.com", "Partner"],
];

const toCsv = (rows) =>
  rows.map((r) => r.map((v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)).join(",")).join("\n");

const headerRow = COLUMNS.map((c) => c.label);

const linkBtn =
  "inline-flex items-center gap-1.5 text-[15px] font-bold text-[#0B57D0] hover:underline cursor-pointer";

// onSelect(file) receives the chosen sheet; the column mapping step picks it up from there
const UploadSheetModal = ({ onClose, onSelect }) => {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const pickFile = (file) => {
    if (!file) return;
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!ACCEPTED.includes(ext)) {
      return setError(`"${file.name}" isn't a spreadsheet. Use an .xlsx, .xls or .csv file.`);
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return setError(`"${file.name}" is over ${MAX_SIZE_MB} MB. Split it into smaller sheets.`);
    }
    setError("");
    onSelect?.(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer.files?.[0]);
  };

  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob([toCsv([headerRow])], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "attendee-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const trySample = () =>
    pickFile(new File([toCsv([headerRow, ...SAMPLE_ROWS])], "sample-attendees.csv", { type: "text/csv" }));

  return (
    <div
      className="fixed inset-0 z-[200] grid place-items-center bg-[rgba(20,30,55,0.35)] p-4 md:p-5"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-sheet-title"
        className="flex max-h-[calc(100dvh-32px)] md:max-h-full w-full max-w-[820px] flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_20px_50px_rgba(30,50,90,0.12)]"
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5 md:px-[30px] md:pt-7">
          <div>
            <h3 id="upload-sheet-title" className="text-[20px] md:text-[24px] font-semibold text-[#1E293B]">
              Upload attendee sheet
            </h3>
            <p className="mt-1 text-[15px] text-[#475569]">Add everyone from an Excel or CSV file in one go.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="mt-1 grid place-items-center rounded-lg p-1.5 text-[#1E293B] hover:bg-[#F1F5F9] cursor-pointer"
          >
            <X size={22} strokeWidth={1.8} />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-5 md:px-[30px] pt-5 pb-5">
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), inputRef.current?.click())}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center rounded-[16px] border-2 border-dashed px-5 py-8 md:py-12 text-center outline-none transition cursor-pointer focus-visible:border-[#0B57D0] ${
              dragging
                ? "border-[#0B57D0] bg-[#E8F0FE]"
                : error
                ? "border-[#FCA5A5] bg-[#FEF6F6]"
                : "border-[#B6CFF5] bg-[#F5F8FF] hover:border-[#8AB4F8]"
            }`}
          >
            <div className="mb-4 md:mb-5 grid h-16 w-16 md:h-[76px] md:w-[76px] place-items-center rounded-full bg-white text-[#0B57D0] shadow-[0_2px_8px_rgba(30,50,90,0.08)]">
              <FiUpload className="text-[24px]" />
            </div>
            <p className="text-[17px] md:text-[19px] font-bold text-[#1E293B]">
              {dragging ? "Drop it to upload" : (
                <>
                  Drop your sheet here or <span className="text-[#0B57D0] underline underline-offset-4">browse</span>
                </>
              )}
            </p>
            <p className="mt-1.5 text-[15px] text-[#475569]">.xlsx, .xls or .csv with a header row</p>
            {error && <p className="mt-3 text-[14px] font-bold text-[#DC2626]">{error}</p>}
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED.join(",")}
              className="hidden"
              onChange={(e) => {
                pickFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>

          <p className="mt-5 text-[15px] leading-normal text-[#64748B]">
            We read these columns from the header row. The headers don&apos;t have to match exactly. &ldquo;Mobile&rdquo;,
            &ldquo;Organisation&rdquo; or &ldquo;Job title&rdquo; work too, and you can fix any match on the next step.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {COLUMNS.map((c) => (
              <span
                key={c.label}
                className="inline-flex items-center gap-2 h-9 px-3 md:px-4 rounded-full border border-[#E2E8F0] text-[14px] md:text-[15px] font-bold text-[#1E293B]"
              >
                {c.label}
                {c.required && <span className="text-[12.5px] font-bold text-[#0B57D0]">Required</span>}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 md:gap-6 border-t border-[#E2E8F0] px-5 md:px-[30px] pt-4 pb-5">
          <button type="button" onClick={downloadTemplate} className={linkBtn}>
            <FiDownload className="text-[16px]" />
            Download template
          </button>
          <button type="button" onClick={trySample} className={linkBtn}>
            <FiFileText className="text-[16px]" />
            Try a sample sheet
          </button>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-full px-3 py-1.5 text-[16px] font-bold text-[#475569] hover:bg-[#F1F5F9] hover:text-[#1E293B] cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadSheetModal;
