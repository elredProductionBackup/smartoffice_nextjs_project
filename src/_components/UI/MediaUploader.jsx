"use client";
import { openEventsModal } from "@/store/events/eventsUiSlice";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function MediaUploader({
  data = [],
  loading = false,
  fetched = false,
  accept = "image/png, image/jpeg, image/jpg, application/pdf",
  onUpload,
  eventId,
  type,
}) {
  const inputRef = useRef(null);
  const dispatch = useDispatch();

  const uploadingCount = useSelector((state) =>
    type === "document"
      ? state.events.documentsUploadingCount?.[eventId] || 0
      : state.events.membersMediaUploadingCount?.[eventId] || 0
  );

  const [files, setFiles] = useState([]);

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files || []);

    const validFiles = selected.filter((file) =>
      [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "application/pdf",
      ].includes(file.type)
    );

    if (!validFiles.length) return;

    setFiles((prev) => [...prev, ...validFiles]);

    if (onUpload) {
      onUpload(validFiles)
        .then(() => {
          setFiles([]);
        })
        .catch(() => {
          setFiles([]);
        });
    }
  };

  const handleDelete = (item) => {
    dispatch(
      openEventsModal({
        type: "DELETE_MEDIA_CONFIRM",
        payload: {
          item: {
            ...item,
            eventId,
            type,
          },
        },
      })
    );
  };

  const displayList = [
    ...Array(uploadingCount).fill({ isShimmer: true }),
    ...data,
  ];

  if (!fetched && data.length === 0 && uploadingCount === 0) {
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

      {fetched && displayList.length === 0 ? (
        <div className="flex justify-center items-center pt-[50px] pb-[20px]">
          <button
            onClick={() => inputRef.current?.click()}
            className="w-[180px] aspect-square border-[1px] border-[#147BFF] rounded-[16px] flex flex-col items-center justify-center text-[#667085] bg-[#F2F7FF] gap-[10px]"
          >
            <div className="h-[50px] w-[50px] rounded-full bg-[#D3E3FD] text-[#0B57D0] grid place-items-center">
              <span className="solar--add-folder-bold"></span>
            </div>
            <span className="font-[600] px-[10px] text-[#000]">
              Add media/ documents
            </span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-[35px]">
          {/* Upload Card */}
          <button
            onClick={() => inputRef.current?.click()}
            className="aspect-square border-[1px] border-[#147BFF] rounded-[16px] flex flex-col items-center justify-center text-[#667085] bg-[#F2F7FF] gap-[10px]"
          >
            <div className="h-[50px] w-[50px] rounded-full bg-[#D3E3FD] text-[#0B57D0] grid place-items-center">
              <span className="solar--add-folder-bold"></span>
            </div>
            <span className="font-[600] px-[15px] text-[#000]">
              Add media/ documents
            </span>
          </button>

          {displayList.map((item, index) => {
            if (item.isShimmer) {
              return (
                <div
                  key={`shimmer-${index}`}
                  className="aspect-square rounded-[16px] bg-[#E5E7EB] animate-pulse"
                />
              );
            }

            const src = item.fileURL || item.previewURL;
            if (!src) return null;

            return (
              <div
                key={item._id || item.fileURL}
                className="relative aspect-square rounded-[16px] overflow-hidden bg-[#F2F4F7] group"
              >
                <Image
                  src={src}
                  alt="uploaded"
                  fill
                  className="object-cover"
                />

                <button
                  onClick={() => handleDelete(item)}
                  className="absolute bottom-[12px] right-[12px] w-[30px] h-[30px] rounded-[9px] bg-[#8080804D] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition backdrop-blur-[3.7px] cursor-pointer"
                >
                  <span className="fluent--delete-12-filled"></span>
                </button>
              </div>
            );
          })}
        </div>
      )}
      {loading && data.length > 0 && (
        <div className="col-span-full flex justify-center pt-6">
          <div className="w-[24px] h-[24px] border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <p className="text-[#666666] text-center" style={{ fontFamily: 'Nunito Sans, sans-serif', fontSize: '18px', fontWeight: 400, lineHeight: '24px' }}>
        Any media added will be publicly visible to attendees
      </p>
    </div>
  );
}