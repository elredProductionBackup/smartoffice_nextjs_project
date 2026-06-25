import { BsCheck } from "react-icons/bs";

export function CheckboxGroup({
  label,
  options,
  value,
  onChange,
}) {
  return (
    <div className="flex flex-col">
      <p className="text-[16px] mb-[6px] block text-[#333333] font-[700]">
        {label}
      </p>

      <div className="flex gap-4 flex-wrap">
        {options.map((opt) => {
          const checked = value[opt.key];

          return (
            <div
              key={opt.key}
              className="flex items-center gap-[6px] text-[18px] cursor-pointer"
              onClick={() =>
                onChange({
                  ...value,
                  [opt.key]: !checked,
                })
              }
            >
              {/* Custom checkbox */}
              <div
                className={`m-[7px] h-[18px] w-[18px] rounded-[4px] border-[2px]
                  flex items-center justify-center transition-colors
                  ${
                    checked
                      ? "bg-[#147BFF] border-[#147BFF]"
                      : "border-[#666666] bg-transparent"
                  }`}
              >
                {checked && <BsCheck size={16} color="#fff" />}
              </div>

              {/* Label */}
              <span className="select-none">{opt.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
