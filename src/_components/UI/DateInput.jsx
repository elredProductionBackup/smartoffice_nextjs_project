import { useRef, useState } from "react";
import Calendar from "./Calendar";
import { useOutsideClick } from "@/hooks/useOutsideClick";
import moment from "moment";

export function DateInput({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useOutsideClick(ref, () => setOpen(false));

  return (
    <div ref={ref} className="relative flex-1">
      <button
        onClick={() => setOpen((p) => !p)}
        className="h-[50px] w-full px-4 bg-[#F6F6F6] border-[1.4px] border-[#EAEAEA] rounded-lg font-[600] cursor-pointer whitespace-nowrap"
      >
        {moment(value).format("ddd, D MMM")}
      </button>

      {open && (
        <Calendar
          mode="popup"
          position="absolute"
          value={value}
          onChange={(date) => {
            onChange(date);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}
