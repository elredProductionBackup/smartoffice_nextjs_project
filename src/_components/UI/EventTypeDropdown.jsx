import { useEffect, useRef, useState } from "react";
import { IoChevronDown } from "react-icons/io5";
import PointDropdown from "./PointDropdown";

const baseFieldClass =
  "flex-1 bg-[#F6F6F6] border-[1.4px] border-[#EAEAEA] rounded-lg outline-none h-[50px]";

const EVENT_TYPES = [
  "Press Conference",
  "Leadership Meetup",
  "Networking Meet",
  "Startup Showcase",
  "Innovation Summit",
  "Award Ceremony",
];

export function EventTypeDropdown({
  value,     
  onChange,
  error,
  icon,
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full flex flex-col">
      <label className="text-[16px] mb-[6px] block text-[#333333] font-[700]">
        Type of event
      </label>

      <div className="flex flex-1 gap-[20px]">
        {/* Event Type */}
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          className={`${baseFieldClass} flex items-center justify-between cursor-pointer ${
            icon ? "pl-[50px] pr-4" : "px-4"
          } ${error ? "border-red-500" : ""}`}
        >
          {icon && (
            <div className="absolute left-[20px] text-[#999999] flex items-center">
              {icon}
            </div>
          )}

          <span
            className={`text-left ${
              value?.type ? "text-[#333333] font-[600]" : "text-[#999999]"
            }`}
          >
            {value?.type || "Select event type"}
          </span>

          <IoChevronDown
            className={`ml-2 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div className="absolute top-[calc(100%+6px)] z-20 p-[10px] w-[calc(100%-140px)] bg-white rounded-[20px] shadow-lg border border-[#F2F6FC] flex flex-col gap-[2px]">
            {EVENT_TYPES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  onChange("type", item);
                  setOpen(false);
                }}
                className={`w-full rounded-[10px] text-left px-[12px] py-[8px] cursor-pointer ${
                  value?.type === item ? "bg-[#F2F6FC]" : ""
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        )}

        {/* Points Dropdown */}
          <PointDropdown
            value={value?.points}
            onChange={(p) => onChange("points", p)}
          />

      </div>

      {error && (
        <p className="text-[12px] text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}
