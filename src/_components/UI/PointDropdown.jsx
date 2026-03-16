import { useState, useRef } from "react";
import { useOutsideClick } from "@/hooks/useOutsideClick";
import { IoChevronDown } from "react-icons/io5";

const POINTS = Array.from({ length: 10 }, (_, i) => i + 1);

const PointDropdown = ({ value, onChange, dynamicPoints }) => {
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
    <div ref={ref} className="relative min-w-[110px] whitespace-nowrap">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative h-[50px] min-w-[120px] px-3 bg-[#F6F6F6] border border-[#EAEAEA] rounded-lg w-full text-left whitespace-nowrap flex items-center justify-between cursor-pointer"
      >
        <span>
          {selectedLabel || (isDynamic ? "No Points" : "No Points")}
        </span>

        <IoChevronDown
          className={`ml-2 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-20 mt-[6px] p-[8px] w-full bg-white rounded-[16px] shadow-lg border border-[#F2F6FC] max-h-[180px] overflow-y-auto flex flex-col">
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