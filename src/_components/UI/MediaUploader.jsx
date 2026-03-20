"use client";
import Image from "next/image";
import { useRef, useState } from "react";

export default function MediaUploader({
  data = [],
  loading = false,
  fetched = false,
  accept = "image/png, image/jpeg, image/jpg",
  onUpload,
}) {

  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files || []);

    const validFiles = selected.filter(
      (file) =>
        file.type === "image/png" || file.type === "image/jpeg" ||
        file.type === "image/jpg"
    );

    const mapped = validFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
    }));

    setFiles((prev) => [...prev, ...mapped]);

    if (onUpload) onUpload(validFiles);
  };

  if (loading && !fetched) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-[35px]">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="aspect-square rounded-[16px] bg-[#E5E7EB] animate-pulse"
        />
      ))}
    </div>
  );
}

  return (
    <div className="w-full max-w-[1600px]">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        hidden
        onChange={handleFiles}
      />

     {fetched && [...data, ...files].length === 0 ?  (
        <div className="flex justify-center items-center py-[50px]">
          <button
            onClick={() => inputRef.current?.click()}
            className="w-[180px] aspect-square border-[1px] border-[#147BFF] rounded-[16px] flex flex-col items-center justify-center text-[#667085] bg-[#F2F7FF] gap-[10px] cursor-pointer"
          >
            <div className="h-[50px] w-[50px] rounded-full bg-[#D3E3FD] text-[#0B57D0] grid place-items-center">
              <span className="solar--add-folder-bold"></span>
            </div>
            <span className="font-[600] px-[10px] text-[#000]">Add media/ documents</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-[35px]">
          {/* Upload Card */}
          <button
            onClick={() => inputRef.current?.click()}
            className="aspect-square border-[1px] border-[#147BFF] rounded-[16px] flex flex-col items-center justify-center text-[#667085] bg-[#F2F7FF] gap-[10px] cursor-pointer"
          >
            <div className="h-[50px] w-[50px] rounded-full bg-[#D3E3FD] text-[#0B57D0] grid place-items-center">
              <span className="solar--add-folder-bold"></span>
            </div>
            <span className="font-[600] px-[15px] text-[#000]">Add media/ documents</span>
          </button>

          {[...data, ...files].map((item, index) => {
            const src =
              item.preview ||
              item.fileURL ||
              item.previewURL;

            if (!src) return null; // safety

            return (
              <div
                key={item.id || index}
                className="relative aspect-square rounded-[16px] overflow-hidden bg-[#F2F4F7]"
              >
                <Image
                  src={src}
                  alt="uploaded"
                  fill
                  className="object-cover"
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}