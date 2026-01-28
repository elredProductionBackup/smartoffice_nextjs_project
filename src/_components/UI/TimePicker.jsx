export function TimePicker({ value, onChange, size='large' }) {
  const TIMES = Array.from({ length: 24 }, (_, h) => ({
    hour: String(h).padStart(2, "0"),
    minute: "00",
  }));

  const selected = `${value.hour}:00`;

  return (
    <div className="absolute z-50 top-[calc(100%+10px)] mt-2 flex flex-col items-center">
      {/* Triangle */}
      <div className="absolute -top-2 h-4 w-4 rotate-45 bg-white border-l border-t border-[#F3F4F6]" />

      {/* Popup */}
      <div className={`bg-white border border-[#F3F4F6] rounded-xl shadow-lg w-[80px] ${size ==='small'?'max-h-[150px]':'max-h-[400px]'} overflow-y-auto pt-[20px] px-[4px]  cursor-pointer flex flex-col gap-[3px]`}>
        {TIMES.map((t) => {
          const timeKey = `${t.hour}:00`;
          const isSelected = timeKey === selected;

          return (
            <div
              key={timeKey}
              onClick={() => onChange(t)}
              className={`relative px-2 py-2 cursor-pointer text-center text-[13px] rounded-[4px]
                ${
                  isSelected
                    ? "bg-[#0B57D0] text-white font-semibold"
                    : "text-[#9CA3AF]"
                }`}
            >
              {timeKey}
            </div>
          );
        })}
      </div>
    </div>
  );
}
