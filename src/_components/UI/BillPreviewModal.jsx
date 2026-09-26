"use client";

import { useEffect, useState } from "react";
import {
  FiX,
  FiDownload,
  FiChevronLeft,
  FiChevronRight,
  FiFileText,
  FiExternalLink,
} from "react-icons/fi";

const IMAGE_EXTS = ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg", "avif"];

function getPath(url) {
  try {
    return new URL(url).pathname;
  } catch {
    return String(url || "");
  }
}

export function getFileName(url) {
  return decodeURIComponent(getPath(url).split("/").pop() || "bill");
}

function getKind(url) {
  const ext = (getPath(url).split(".").pop() || "").toLowerCase();
  if (IMAGE_EXTS.includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  return "other";
}

/** Goes through our own /api/download route, which forces a real download. */
export function getDownloadHref(url) {
  return `/api/download?fileUrl=${encodeURIComponent(url)}`;
}

export default function BillPreviewModal({ urls = [], title, onClose }) {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  // If the list changes (e.g. after an edit) keep the index in range.
  const safeIndex = Math.min(index, Math.max(0, urls.length - 1));
  const url = urls[safeIndex];
  const kind = url ? getKind(url) : "other";
  const hasMany = urls.length > 1;

  useEffect(() => {
    setFailed(false);
  }, [url]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (hasMany && e.key === "ArrowRight") setIndex((i) => (i + 1) % urls.length);
      if (hasMany && e.key === "ArrowLeft") setIndex((i) => (i - 1 + urls.length) % urls.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, hasMany, urls.length]);

  if (!url) return null;

  const btn =
    "text-[#333] bg-[#EEEEEE] hover:bg-white cursor-pointer flex items-center justify-center rounded-full h-[35px] w-[35px] border-0 transition-colors";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-[20px]"
      onClick={onClose}
    >
      <div
        className="flex flex-col bg-[#111] w-full max-w-[760px] h-full max-h-[90vh] rounded-[20px] relative p-[28px] md:p-[36px] overflow-hidden font-nunito"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4 mb-5 shrink-0">
          <div className="min-w-0 text-white">
            <p className="text-[16px] font-bold truncate capitalize">{title || "Bill"}</p>
            <p className="text-[13px] text-[#9CA3AF] font-medium truncate">
              {getFileName(url)}
              {hasMany && ` · ${safeIndex + 1} of ${urls.length}`}
            </p>
          </div>

          <div className="flex items-center gap-[12px] shrink-0">
            <a href={getDownloadHref(url)} className={btn} title="Download bill" aria-label="Download bill">
              <FiDownload className="w-4 h-4" />
            </a>
            <button type="button" onClick={onClose} className={btn} title="Close" aria-label="Close">
              <FiX className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Preview area */}
        <div className="relative flex-1 min-h-0 flex items-center justify-center rounded-[12px] bg-black/40 overflow-hidden">
          {kind === "image" && !failed && (
            // Plain <img> so this works without adding the assets domain to next.config images.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt={getFileName(url)}
              onError={() => setFailed(true)}
              className="max-w-full max-h-full object-contain"
            />
          )}

          {kind === "pdf" && !failed && (
            <iframe key={url} src={url} title={getFileName(url)} className="w-full h-full bg-white" />
          )}

          {(kind === "other" || failed) && (
            <div className="flex flex-col items-center gap-3 text-center px-6 text-white">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                <FiFileText className="w-7 h-7" />
              </div>
              <p className="text-[15px] font-bold">
                {failed ? "This file couldn't be loaded here" : "Preview isn't available for this file type"}
              </p>
              <p className="text-[13px] text-[#9CA3AF]">Download it to view on your device.</p>
              <div className="flex gap-3 mt-2">
                <a
                  href={getDownloadHref(url)}
                  className="inline-flex items-center gap-2 bg-[#2B7FFF] hover:bg-[#1a6fe6] text-white text-[13px] font-semibold px-4 py-2 rounded-lg"
                >
                  <FiDownload className="w-4 h-4" /> Download
                </a>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-[13px] font-semibold px-4 py-2 rounded-lg"
                >
                  <FiExternalLink className="w-4 h-4" /> Open in new tab
                </a>
              </div>
            </div>
          )}

          {hasMany && (
            <>
              <button
                type="button"
                onClick={() => setIndex((i) => (i - 1 + urls.length) % urls.length)}
                className={`${btn} absolute left-3 top-1/2 -translate-y-1/2`}
                aria-label="Previous file"
              >
                <FiChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setIndex((i) => (i + 1) % urls.length)}
                className={`${btn} absolute right-3 top-1/2 -translate-y-1/2`}
                aria-label="Next file"
              >
                <FiChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnails when there are several attachments */}
        {hasMany && (
          <div className="flex gap-3 mt-4 overflow-x-auto shrink-0 pb-1">
            {urls.map((u, i) => (
              <button
                key={u}
                type="button"
                onClick={() => setIndex(i)}
                className={`w-[64px] h-[64px] shrink-0 rounded-[10px] overflow-hidden border-2 bg-white/10 flex items-center justify-center cursor-pointer ${
                  i === safeIndex ? "border-[#2B7FFF]" : "border-transparent opacity-70 hover:opacity-100"
                }`}
                aria-label={`Show file ${i + 1}`}
              >
                {getKind(u) === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u} alt="" className="w-full h-full object-cover" />
                ) : (
                  <FiFileText className="w-6 h-6 text-white" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}