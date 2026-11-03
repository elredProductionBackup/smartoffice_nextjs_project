"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useDispatch } from "react-redux";
import { FiRefreshCw, FiTrash2, FiUploadCloud } from "react-icons/fi";
import { addToast } from "@/store/toastSlice";

const MAX_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg"];

// Cover picker that shows the chosen image, with replace/remove actions
export const EventCoverPreview = ({ value, onChange, error }) => {
  const inputRef = useRef(null);
  const dispatch = useDispatch();
  const [dragging, setDragging] = useState(false);

  const pickFile = (file) => {
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      dispatch(addToast({
        message: { title: "Invalid Image Type", descrip: "Only JPG/PNG files are allowed" },
        type: "error",
      }));
      return;
    }

    if (file.size > MAX_SIZE) {
      dispatch(addToast({
        message: { title: "Maximum File Size Exceeded", descrip: "The file is too large. Allowed maximum size is 2MB." },
        type: "error",
      }));
      return;
    }

    onChange({ file, previewUrl: URL.createObjectURL(file) });
  };

  const openGallery = () => inputRef.current?.click();

  useEffect(() => {
    return () => {
      if (value?.previewUrl) URL.revokeObjectURL(value.previewUrl);
    };
  }, [value]);

  const imageSrc = value?.previewUrl;
  const hasImage = !!imageSrc;

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer.files?.[0]);
  };

  return (
    <div className="flex flex-col" data-error="image">
      {hasImage ? (
        <div className="relative w-full aspect-[4/3] lg:aspect-[4/5] overflow-hidden rounded-[18px] bg-[#EAF2FE]">
          <Image src={imageSrc} alt="Event cover" fill sizes="(min-width: 1024px) 400px, 100vw" className="object-cover" />

          <div className="absolute top-3 right-3 flex gap-1.5">
            <button
              type="button"
              onClick={openGallery}
              aria-label="Upload a different image"
              title="Change image"
              className="w-9 h-9 rounded-full bg-white/90 text-[#1B2230] flex items-center justify-center cursor-pointer hover:bg-white"
            >
              <FiRefreshCw className="text-[16px]" />
            </button>
            <button
              type="button"
              onClick={() => onChange({ file: null, previewUrl: null })}
              aria-label="Remove cover image"
              title="Remove image"
              className="w-9 h-9 rounded-full bg-white/90 text-[#E0242F] flex items-center justify-center cursor-pointer hover:bg-white"
            >
              <FiTrash2 className="text-[16px]" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={openGallery}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`group w-full aspect-[4/3] lg:aspect-[4/5] flex flex-col items-center justify-center text-center rounded-[18px] border-[1.5px] border-dashed cursor-pointer transition-colors ${
            error
              ? "border-red-500 bg-[#FDEEEE]"
              : dragging
                ? "border-[#0B57D0] bg-[#EAF2FE]"
                : "border-[#B3CDF4] bg-[#EAF2FE] hover:border-[#0B57D0]"
          }`}
        >
          <span className="w-[72px] h-[72px] rounded-full bg-white text-[#0B57D0] flex items-center justify-center mb-3.5 shadow-[0_6px_18px_-8px_rgba(31,99,214,0.4)] transition-transform group-hover:scale-105">
            <FiUploadCloud className="text-[30px]" />
          </span>
          <span className="block text-[16px] font-semibold text-[#333333]">
            Upload cover<span className="text-red-500 ml-0.5">*</span>
          </span>
          <span className="block text-[12.5px] text-[#8C95A5]">JPG or PNG, 2MB</span>
        </button>
      )}

      {error && <p className="text-[12px] text-red-500 mt-1.5">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg"
        hidden
        onChange={(e) => {
          pickFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
};
