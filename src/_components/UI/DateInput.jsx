import { useRef, useState } from "react";
import Calendar from "./Calendar";
import { useOutsideClick } from "@/hooks/useOutsideClick";
import moment from "moment";

export function DateInput({
  value,
  onChange,
  right,
  showYear = false,
  mode='popup'
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useOutsideClick(ref, () => setOpen(false));

  const dateValue =
    value instanceof Date && !isNaN(value) ? value : null;

  const format = showYear
    ? "ddd, D MMM YYYY"
    : "ddd, D MMM";

  return (
    <div ref={ref} className="relative flex-1">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="h-[50px] w-full px-4 bg-[#F6F6F6]
                   border-[1.4px] border-[#EAEAEA]
                   rounded-lg font-[600]
                   cursor-pointer whitespace-nowrap
                   text-left"
      >
        {dateValue ? (
          moment(dateValue).format(format)
        ) : (
          <span className="text-gray-400">Select date</span>
        )}
      </button>

      {open && (
        <Calendar
          mode={mode}
          position="absolute"
          right={right}
          value={dateValue || new Date()}
          onChange={(date) => {
            onChange(date);
            setOpen(false);
          }}
          onClose={()=> setOpen(false)}
        />
      )}
    </div>
  );
}
