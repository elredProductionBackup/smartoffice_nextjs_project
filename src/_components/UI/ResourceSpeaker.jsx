import { useRef, useState } from "react";
import {
  IoPersonOutline,
  IoClose,
  IoLinkOutline,
  IoCloudUploadOutline,
  IoDocumentTextOutline,
} from "react-icons/io5";

export function ResourceSpeaker({ value, onChange }) {
  const fileRef = useRef(null);

  const updateSpeaker = (key, val) => {
    onChange({
      ...value,
      [key]: val,
    });
  };

  const addWeblink = () => {
    updateSpeaker("weblinks", [...(value.weblinks || []), ""]);
  };

  const updateWeblink = (index, link) => {
    const updated = [...value.weblinks];
    updated[index] = link;
    updateSpeaker("weblinks", updated);
  };

  const removeWeblink = (index) => {
    const updated = value.weblinks.filter((_, i) => i !== index);
    updateSpeaker("weblinks", updated);
  };

  return (
    <div className="flex flex-col gap-[6px]">
      <span className="text-[16px] font-[700] text-[#333333]">
        Resource/speaker
      </span>

      <div className="flex gap-[10px]">
        {/* Left fields */}
        <div className="flex-1 flex flex-col gap-[10px]">
          {/* Name */}
          <div className="relative flex items-center">
            <div className="absolute left-[20px] text-gray-400  flex items-center">
              <span className="carbon--user-speaker"></span>
            </div>
            <input
              placeholder="Resource/speaker name"
              value={value.name}
              onChange={(e) =>
                updateSpeaker("name", e.target.value)
              }
              className="h-[50px] w-full pl-[50px] pr-4 rounded-lg border-[1.4px] border-[#EAEAEA] bg-[#F6F6F6] outline-none"
            />
          </div>

          {/* Description (with icon) */}
          <div className="relative h-[80px]">
            <div className="absolute left-[20px] top-[14px] text-gray-400  flex items-center">
              <span className="solar--chat-line-outline"></span>
            </div>
            <textarea
              placeholder="Add details about resource/speaker"
              value={value.description}
              onChange={(e) =>
                updateSpeaker("description", e.target.value)
              }
              className="w-full h-[80px] pl-[50px] pr-4 py-3 rounded-lg border-[1.4px] border-[#EAEAEA] bg-[#F6F6F6] outline-none resize-none overflow-auto"
            />
          </div>
        </div>

        {/* Upload photo */}
        <div
          onClick={() => fileRef.current.click()}
          className="relative w-[120px] h-[140px] border border-dashed border-[#EAEAEA] rounded-lg bg-[#F6F6F6] flex flex-col items-center justify-center gap-1 cursor-pointer"
        >
          {value.image ? (
            <>
              <img
                src={URL.createObjectURL(value.image)}
                alt=""
                className="w-full h-full object-cover rounded-lg"
              />

              {/* Remove avatar */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateSpeaker("image", null);
                }}
                className="absolute top-1 right-1 w-[18px] h-[18px] bg-black/60 rounded-full flex items-center justify-center text-white"
              >
                <IoClose size={12} />
              </button>
            </>
          ) : (
            <>
              <IoCloudUploadOutline size={22} />
              <span className="text-[14px] text-[#666666] font-[700]">
                Upload photo
              </span>
            </>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) =>
            updateSpeaker("image", e.target.files?.[0])
          }
        />
      </div>
      {/* Weblinks */}
      <div className="w-full mt-[4px] flex flex-col gap-[10px]">
          {(value.weblinks || []).map((link, index) => (
            <div key={index} className="relative w-full flex items-center ">
              <div className="absolute left-[20px] text-gray-400  flex items-center">
                <span className="bi--globe big"></span>
              </div>
              <input
                placeholder="Weblink URL"
                value={link}
                onChange={(e) =>
                  updateWeblink(index, e.target.value)
                }
                className="h-[50px] w-full pl-[50px] pr-10 rounded-lg border-[1.4px] border-[#EAEAEA] bg-[#F6F6F6] outline-none"
              />

              {/* Remove weblink */}
              <button
                onClick={() => removeWeblink(index)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                <IoClose />
              </button>
            </div>
          ))}

          {/* Add weblink */}
          <button
            type="button"
            onClick={addWeblink}
            className="text-[#0B57D0] text-[18px] text-left w-fit"
          >
            Add weblink
          </button>
      </div>
    </div>
  );
}
