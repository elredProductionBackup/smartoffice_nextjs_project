"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { addToast } from "@/store/toastSlice";
import { useDispatch } from "react-redux";
import { FiRefreshCw, FiTrash2, FiUploadCloud } from "react-icons/fi";

// Portrait (3:4) cover image picker
export const EventImage = ({ value, onChange, required = false }) => {
  const inputRef = useRef(null);
  const dispatch = useDispatch();

  const MAX_SIZE = 2 * 1024 * 1024;
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg"];

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      dispatch(addToast({
        message: {
          title: "Invalid Image Type",
          descrip: "Only JPG/PNG files are allowed",
        },
        type: "error",
      }));
      e.target.value = "";
      return;
    }

    if (file.size > MAX_SIZE) {
      dispatch(addToast({
        message: {
          title: "Maximum File Size Exceeded",
          descrip: "The file is too large. Allowed maximum size is 2MB.",
        },
        type: "error",
      }));
      e.target.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    onChange({ file, previewUrl });
  };

  const openGallery = () => {
    inputRef.current?.click();
  };

  const removeImage = () => {
    onChange({ file: null, previewUrl: null });
    if (inputRef.current) inputRef.current.value = "";
  };

  useEffect(() => {
    return () => {
      if (value?.previewUrl) {
        URL.revokeObjectURL(value.previewUrl);
      }
    };
  }, [value]);

  const isValidPreview =
    (value?.file &&
      ALLOWED_TYPES.includes(value.file.type) &&
      value.file.size <= MAX_SIZE) ||
    (!value?.file && typeof value?.previewUrl === "string");

  const imageSrc = value?.previewUrl;
  const hasImage = !!(imageSrc && isValidPreview);

  return (
    <div className="flex flex-col">
      <label className="text-[14px] mb-[6px] block text-[#333333] font-[700]">
        Cover image
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      <div className="relative w-full aspect-[3/4] overflow-hidden rounded-[16px]">
        {hasImage ? (
          <Image
            src={imageSrc}
            alt="Event cover"
            fill
            sizes="240px"
            className="object-cover"
          />
        ) : (
          <button
            type="button"
            onClick={openGallery}
            className="group h-full w-full flex flex-col items-center justify-center gap-3 px-4 text-center rounded-[16px] border-[1.6px] border-dashed border-[#BFD3F2] bg-[linear-gradient(160deg,#F7FAFF_0%,#E6EFFC_100%)] cursor-pointer transition-colors hover:border-[#0B57D0]"
          >
            <span className="w-[52px] h-[52px] rounded-full bg-white shadow-[0px_4px_16px_0px_#0B57D01f] text-[#0B57D0] flex items-center justify-center transition-transform group-hover:scale-105">
              <FiUploadCloud className="text-[24px]" />
            </span>
            <span>
              <span className="block text-[15px] font-bold text-[#333333]">Upload cover</span>
              <span className="block mt-0.5 text-[12px] text-[#777777]">JPG or PNG, up to 2MB</span>
            </span>
          </button>
        )}
      </div>

      {hasImage && (
        <div className="flex gap-2 mt-2.5">
          <button
            type="button"
            onClick={openGallery}
            className="flex-1 h-[36px] inline-flex items-center justify-center gap-1.5 rounded-full bg-[#F2F7FF] text-[#0B57D0] text-[14px] font-semibold cursor-pointer transition-colors hover:bg-[#D3E3FD]"
          >
            <FiRefreshCw className="text-[13px]" />
            Replace
          </button>
          <button
            type="button"
            onClick={removeImage}
            aria-label="Remove cover image"
            className="w-[36px] h-[36px] shrink-0 inline-flex items-center justify-center rounded-full bg-[#FFEBEB] text-[#E40000] cursor-pointer transition-colors hover:bg-[#FFD9D9]"
          >
            <FiTrash2 className="text-[14px]" />
          </button>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg"
        hidden
        onChange={handleFileChange}
      />
    </div>
  );
};
