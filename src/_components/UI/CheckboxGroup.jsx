import { BsCheck } from "react-icons/bs";

// Multi-select shown as pill chips
export function CheckboxGroup({
  label,
  options,
  value,
  onChange,
}) {
  return (
    <div className="flex flex-col">
      {label && (
        <p className="text-[14px] mb-[8px] block text-[#333333] font-[700]">
          {label}
        </p>
      )}

      <div className="flex gap-2.5 flex-wrap">
        {options.map((opt) => {
          const checked = value[opt.key];

          return (
            <button
              key={opt.key}
              type="button"
              aria-pressed={checked}
              onClick={() =>
                onChange({
                  ...value,
                  [opt.key]: !checked,
                })
              }
              className={`h-[42px] inline-flex items-center gap-2 pl-2.5 pr-4 rounded-full border-[1.4px] text-[15px] font-semibold cursor-pointer select-none transition-colors ${
                checked
                  ? "border-[#0B57D0] bg-[#F2F7FF] text-[#0B57D0]"
                  : "border-[#E3EAF5] bg-white text-[#555555] hover:border-[#9DBBEB]"
              }`}
            >
              <span
                className={`h-[20px] w-[20px] rounded-full flex items-center justify-center transition-colors ${
                  checked ? "bg-[#0B57D0]" : "border-[2px] border-[#C9D4E5]"
                }`}
              >
                {checked && <BsCheck size={16} color="#fff" />}
              </span>
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
