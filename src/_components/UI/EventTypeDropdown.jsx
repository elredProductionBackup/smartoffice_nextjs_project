import { useEffect, useRef, useState } from "react";
import { IoChevronDown } from "react-icons/io5";

const baseFieldClass =
  "w-full bg-[#F6F6F6] border-[1.4px] border-[#EAEAEA] rounded-lg outline-none h-[50px]";

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
    <div ref={wrapperRef} className="relative w-full">
      <label className="text-[16px] mb-[6px] block text-[#333333] font-[700]">
        Type of event
      </label>

      {/* Field */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`${baseFieldClass} flex items-center justify-between cursor-pointer ${
          icon ? "pl-[50px] pr-4" : "px-4"
        } ${error ? "border-red-500" : ""}`}
      >
        {/* Left icon */}
        {icon && (
          <div className="absolute left-[20px] text-gray-400 flex items-center">
            {icon}
          </div>
        )}

        <span
          className={`text-left ${
            value ? "text-gray-700" : "text-gray-400"
          }`}
        >
          {value || "Select event type"}
        </span>

        <IoChevronDown
          className={`ml-2 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-20 mt-2 p-[10px] w-full bg-white rounded-[20px] shadow-lg overflow-hidden border border-[#F2F6FC] flex flex-col gap-[2px]">
          {EVENT_TYPES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                onChange(item);
                setOpen(false);
              }}
              className={`w-full rounded-[10px] text-left px-[12px] py-[8px] cursor-pointer ${
                value === item ? "bg-[#F2F6FC]" : ""
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      )}

      {/* Error (same as EventsInput) */}
      {error && (
        <p className="absolute -bottom-[20px] text-[12px] text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
