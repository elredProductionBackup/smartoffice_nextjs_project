export function RegistrationToggle({
  value,
  onChange,
}) {
  return (
    <div className="flex flex-col items-start gap-[6px]">
      <span className="text-[16px] text-[#333333] font-[700]">
        Registration
      </span>

      <div className="flex items-center gap-3">
        {/* Toggle */}
        <button
          type="button"
          onClick={onChange}
          className={`w-[40px] h-[20px] rounded-full relative transition-colors cursor-pointer duration-200 ${
            value ? "bg-blue-600" : "bg-gray-300"
          }`}
        >
          <span
            className={`absolute top-[2px] left-[2px] w-[16px] h-[16px] bg-white rounded-full transition-transform duration-200 ${
              value ? "translate-x-[20px]" : ""
            }`}
          />
        </button>

        {/* Status text */}
        <span className="text-[18px] font-[600] text-[#333333]">
          {value ? "Open" : "Closed"}
        </span>
      </div>
    </div>
  );
}
