import { useState, useRef } from "react";
import { useOutsideClick } from "@/hooks/useOutsideClick";
import { IoChevronDown } from "react-icons/io5";

const POINTS = Array.from({ length: 10 }, (_, i) => i + 1);

// `compact` is the small inline variant shown beside a field label
const PointDropdown = ({ value, onChange, dynamicPoints, compact = false }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useOutsideClick(ref, () => setOpen(false));

  const isDynamic = Array.isArray(dynamicPoints);

const options = isDynamic
  ? [...new Set(dynamicPoints.map((p) => p.points))]
      .sort((a, b) => a - b)
      .map((p) => ({
        label: `${p} ${p === 1 ? "Point" : "Points"}`,
        value: p,
      }))
  : POINTS.map((p) => ({
      label: `${p} ${p === 1 ? "Point" : "Points"}`,
      value: p,
      id: p,
    }));

  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <div ref={ref} className={`relative whitespace-nowrap ${compact ? "" : "min-w-[110px]"}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={
          compact
            ? "h-[30px] pl-2.5 pr-2 bg-[#F2F5F9] rounded-lg text-[13px] font-medium text-[#4A5466] whitespace-nowrap flex items-center cursor-pointer"
            : "relative h-[46px] min-w-[120px] px-3 bg-[#F8FAFD] border border-[#E3EAF5] rounded-lg w-full text-left whitespace-nowrap flex items-center justify-between cursor-pointer"
        }
      >
        <span>
          {selectedLabel || (isDynamic ? "No Points" : "No Points")}
        </span>

        <IoChevronDown
          className={`ml-2 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className={`absolute z-20 mt-[6px] p-[8px] ${compact ? "right-0 min-w-[130px]" : "w-full"} bg-white rounded-[16px] shadow-lg border border-[#F2F6FC] max-h-[180px] overflow-y-auto flex flex-col`}>
          {isDynamic && options.length === 0 ? (
            <div className="py-[10px] text-[#999] text-sm w-[100%] whitespace-normal text-center">
              No points added
            </div>
          ) : (
            options.map((opt,index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full rounded-[10px] text-left px-[12px] py-[8px] whitespace-nowrap cursor-pointer ${
                  value === opt.value ? "bg-[#F2F6FC]" : ""
                }`}
              >
                {opt.value} {opt.value === 1 ? "Point" : "Points"}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default PointDropdown;