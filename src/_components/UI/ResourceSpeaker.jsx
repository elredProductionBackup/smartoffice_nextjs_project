import { useMemo, useRef } from "react";
import { IoClose } from "react-icons/io5";

export function ResourceSpeaker({ value, onChange, errors = {}, showLabel = true }) {
  const fileRef = useRef(null);

  // One object URL per picked file (it used to be re-created on every render)
  const imageSrc = useMemo(
    () => (value.image instanceof File ? URL.createObjectURL(value.image) : value.image),
    [value.image]
  );

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
    <div className="flex flex-col gap-[6px]" data-error="speaker">
      {showLabel && (
        <span className="text-[14px] font-[700] text-[#333333]">
          Resource/speaker
          <span className="text-red-500 ml-0.5">*</span>
        </span>
      )}

      <div className="flex gap-[10px] relative">
        {/* Left fields */}
        <div className="flex-1 min-w-0 flex flex-col gap-[10px]">
          {/* Name */}
          <div className="relative flex items-center">
            <div className="absolute left-[20px] text-[#999999]  flex items-center">
              <span className="carbon--user-speaker"></span>
            </div>
            <input
              placeholder="Resource/speaker name"
              value={value.name}
              onChange={(e) =>
                updateSpeaker("name", e.target.value)
              }
              className={`h-[46px] w-full pl-[50px] pr-4 rounded-lg border-[1.4px] bg-[#F8FAFD] outline-none transition-colors focus:bg-white focus:border-[#0B57D0] ${
                errors?.name ? "border-red-500" : "border-[#E3EAF5]"
              }`}
            />
          </div>

          {/* Description (with icon) */}
          <div className="relative h-[80px]">
            <div className="absolute left-[20px] top-[14px] text-[#999999]  flex items-center">
              <span className="solar--chat-line-outline"></span>
            </div>
            <textarea
              placeholder="Add details about resource/speaker"
              value={value.description}
              onChange={(e) =>
                updateSpeaker("description", e.target.value)
              }
              className="w-full h-[80px] pl-[50px] pr-4 py-3 rounded-lg border-[1.4px] border-[#E3EAF5] bg-[#F8FAFD] outline-none transition-colors focus:bg-white focus:border-[#0B57D0] resize-none overflow-auto"
            />
          </div>
        </div>

        {/* Upload photo */}
        <div
          onClick={() => fileRef.current.click()}
          className="relative shrink-0 w-[96px] h-[120px] sm:w-[120px] sm:h-[140px] border border-dashed border-[#E3EAF5] rounded-lg bg-[#F8FAFD] flex flex-col items-center justify-center gap-1 cursor-pointer"
        >
          {value.image ? (
            <>
              <img
                src={imageSrc || "/placeholder.png"}
                alt=""
                className="w-full h-full object-cover rounded-lg"
              />

              {/* Remove avatar */}
              <button
                type="button"
                title="Remove photo"
                aria-label="Remove photo"
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
              <span className="lucide--upload text-[#666666]"></span>
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
        {errors?.main && (
        <p className="text-[12px] text-red-500">
          {errors.main}
        </p>
      )}
     {/* Weblinks */}
    <div className="w-full flex flex-col gap-[10px]">
      {(value.weblinks || []).map((link, index) => (
        <div key={index} className="w-full flex flex-col">
          
          <div className="relative w-full flex items-center">
            <div className="absolute left-[20px] text-[#999999] flex items-center">
              <span className="bi--globe big"></span>
            </div>

            <input
              placeholder="Weblink URL"
              value={link}
              onChange={(e) => updateWeblink(index, e.target.value)}
              className={`h-[46px] w-full pl-[50px] pr-10 rounded-lg border-[1.4px] bg-[#F8FAFD] outline-none transition-colors focus:bg-white focus:border-[#0B57D0]
                ${errors.weblinks?.[index] ? "border-red-500" : "border-[#E3EAF5]"}`}
            />

            {/* Remove weblink */}
            <button
              type="button"
              title="Remove weblink"
              aria-label="Remove weblink"
              onClick={() => removeWeblink(index)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999999] cursor-pointer"
            >
              <IoClose />
            </button>
          </div>

          {errors.weblinks?.[index] && (
            <span className="text-[12px] text-red-500 mt-1">
              {errors.weblinks[index]}
            </span>
          )}
        </div>
      ))}

      {/* Add weblink */}
      <button
        type="button"
        onClick={addWeblink}
        className="text-[#0B57D0] text-[15px] font-bold hover:underline text-left w-fit cursor-pointer"
      >
        Add weblink
      </button>
    </div>
    </div>
  );
}
