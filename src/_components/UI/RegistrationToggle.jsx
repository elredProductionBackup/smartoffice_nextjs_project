export function RegistrationToggle({
  value,
  onChange,
}) {
  return (
    <div className="flex flex-col items-start gap-[8px]">
      <span className="text-[15px] font-medium text-[#6B7280] leading-none">
        Registration
      </span>

      <div className="flex items-center gap-[10px]">
        {/* Toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={value}
          onClick={onChange}
          className={`w-[36px] h-[20px] p-[2px] shrink-0 flex items-center rounded-full transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#147BFF] ${
            value ? "bg-[#147BFF]" : "bg-[#D1D5DB]"
          }`}
        >
          <span
            className={`w-[16px] h-[16px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-transform duration-200 ${
              value ? "translate-x-[16px]" : "translate-x-0"
            }`}
          />
        </button>

        {/* Status text */}
        <span className="min-w-[52px] text-[16px] font-medium text-[#111] leading-none">
          {value ? "Open" : "Closed"}
        </span>
      </div>
    </div>
  );
}
