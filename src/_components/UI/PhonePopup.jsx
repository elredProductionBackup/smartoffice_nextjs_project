import { useState, useRef } from "react";
import Image from "next/image";
import { useOutsideClick } from "@/hooks/useOutsideClick"; // adjust path

const PhonePopup = ({
  phone = "",
  memberId,
  className = "",
  icon,
  openUpwards = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const popupRef = useRef(null);

  // ✅ close on outside click
  useOutsideClick(popupRef, () => setIsOpen(false));

  const handleToggle = (e) => {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone || "");
    setCopied(true);

    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      ref={popupRef}
      className={`w-10 h-10 bg-[#E6EBF2] rounded-full flex items-center justify-center cursor-pointer relative ${className}`}
      onClick={handleToggle}
    >
      {/* Icon */}
      {icon ? (
        icon
      ) : (
        <span className="proicons--call"></span>
      )}

      {/* Popup */}
      {isOpen && (
        <div
          className={`w-[250px] bg-white z-30 p-5 rounded-[20px] absolute shadow-[0px_3px_4px_rgba(190,190,190,0.25)]
          ${openUpwards ? "bottom-12" : "top-12"} -right-2`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Arrow */}
          <div
            className={`bg-white w-[24px] h-[24px] rotate-45 absolute right-4 
            ${openUpwards ? "-bottom-2" : "-top-2"}`}
          ></div>

          {/* Title */}
          <div className="uppercase text-base font-bold text-[#333333] mb-2.5">
            Phone
          </div>

          {/* Content */}
          <div className="min-w-[180px] flex gap-2.5 items-center justify-between">
            {/* Phone + click */}
            <div
              className="flex items-center gap-[6px] hover:underline cursor-pointer"
              onClick={handleCopy}
            >
              <div className="bg-[#E6EBF2] rounded-full h-8 w-8 flex items-center justify-center">
                {icon ? icon : <span className="proicons--call"></span>}
              </div>

              <div className="text-[#333333] text-base font-semibold">
                {phone || "N/A"}
              </div>
            </div>

            {/* Copy button */}
            <div className="relative">
              {copied && (
                <div
                  className="absolute -top-8 left-1/2 -translate-x-1/2
                             bg-[#333] text-white text-xs px-2 py-1
                             rounded-md whitespace-nowrap shadow-md z-50"
                >
                  Copied
                </div>
              )}

              <button
                type="button"
                onClick={handleCopy}
                className="cursor-pointer flex items-center justify-center"
                title="Copy phone number"
              >
                <span className="lucide--copy"></span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhonePopup;