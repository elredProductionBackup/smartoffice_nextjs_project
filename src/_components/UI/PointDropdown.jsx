import { useState, useRef } from "react";
import { useOutsideClick } from "@/hooks/useOutsideClick";
import { IoChevronDown } from "react-icons/io5";

const POINTS = Array.from({ length: 10 }, (_, i) => i + 1);

const PointDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useOutsideClick(ref, () => setOpen(false));

  return (
    <div ref={ref} className="relative min-w-[110px] whitespace-nowrap">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative h-[50px] px-3 bg-[#F6F6F6] border border-[#EAEAEA] rounded-lg w-full text-left whitespace-nowrap flex items-center justify-between"
      >
        <span>
          {value
            ? `${value} ${value === 1 ? "point" : "points"}`
            : "Point"}
        </span>

        <IoChevronDown
          className={`ml-2 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute z-20 mt-2 p-[8px] w-full bg-white rounded-[16px] shadow-lg border border-[#F2F6FC] max-h-[180px] overflow-y-auto flex flex-col">
          {POINTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                onChange(p);
                setOpen(false);
              }}
              className={`w-full rounded-[10px] text-left px-[12px] py-[8px] whitespace-nowrap ${
                value === p ? "bg-[#F2F6FC]" : ""
              }`}
            >
              {p} {p === 1 ? "point" : "points"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PointDropdown;
