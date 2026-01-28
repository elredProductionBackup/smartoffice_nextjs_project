import { useRef, useState } from "react";
import { TimePicker } from "./TimePicker";
import { useOutsideClick } from "@/hooks/useOutsideClick";

const format24Hour = (value) => {
  if (!value) return "00:00";

  const hour = String(value.hour ?? "00").padStart(2, "0");
  const minute = String(value.minute ?? "00").padStart(2, "0");

  return `${hour}:${minute}`;
};

export function TimeInput({ value, onChange, size }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useOutsideClick(ref, () => setOpen(false));

  return (
    <div ref={ref} className="relative flex-1 flex flex-col items-center">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="h-[50px] w-full px-4 bg-[#F6F6F6] border-[1.4px] border-[#EAEAEA] rounded-lg font-[600] cursor-pointer"
      >
        {format24Hour(value)}
      </button>

      {open && (
        <TimePicker
          value={{
            hour: String(value?.hour ?? "00").padStart(2, "0"),
            minute: String(value?.minute ?? "00").padStart(2, "0"),
          }}
          onChange={(v) => {
            onChange({
              hour: String(v.hour).padStart(2, "0"),
              minute: String(v.minute).padStart(2, "0"),
            });
            setOpen(false);
          }}
          is24Hour
          size={size}
        />
      )}
    </div>
  );
}
