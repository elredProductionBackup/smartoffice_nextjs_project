"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

export const EventImage = ({ value, onChange }) => {
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    onChange({ file, previewUrl });
  };

  const openGallery = () => {
    inputRef.current?.click();
  };

  // Cleanup object URL
  useEffect(() => {
    return () => {
      if (value?.previewUrl) {
        URL.revokeObjectURL(value.previewUrl);
      }
    };
  }, [value]);

  return (
    <div className="sticky top-0 flex flex-col items-center gap-[30px]">
      {/* Image Preview */}
      <div className="relative h-[600px] aspect-[3/4] overflow-hidden rounded-[20px] bg-gray-200">
        {value?.previewUrl ? (
          <Image
            src={value.previewUrl}
            alt="event"
            fill
            sizes="450px"
            className="object-cover border-[1.4px] border-[#EAEAEA] rounded-[20px]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-gray-500">
            Event image preview
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-[20px] items-center">
        <button
          type="button"
          onClick={openGallery}
          className="text-[18px] font-[500] cursor-pointer"
        >
          Change your event image
        </button>

        <div
          onClick={openGallery}
          className="flex flex-col items-center gap-[8px] text-[18px] font-[600] cursor-pointer"
        >
          <span className="h-[40px] w-[40px] rounded-full bg-[#147BFF1A] grid place-items-center">
            <Image
              src="/logo/gallery.svg"
              alt="Gallery Logo"
              height={22}
              width={22}
            />
          </span>
          Gallery
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleFileChange}
      />
    </div>
  );
};
