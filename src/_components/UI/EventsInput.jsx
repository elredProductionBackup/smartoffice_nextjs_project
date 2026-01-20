const baseFieldClass =
  "w-full bg-[#F6F6F6] border-[1.4px] border-[#EAEAEA] rounded-lg outline-none h-[50px]";

export function EventsInput({
  label,
  icon,
  error,
  ...props
}) {
  return (
    <div className="relative w-full">
      {label && (
        <label className="text-[16px] mb-[6px] block text-[#333333] font-[700]">
          {label}
        </label>
      )}

      <div className="relative  flex items-center">
        {icon && (
          <div className="absolute left-[20px] text-gray-400  flex items-center">
            {icon}
          </div>
        )}

        <input
          {...props}
          className={`${baseFieldClass} ${
            icon ? "pl-[50px]" : "px-4"
          } ${error ? "border-red-500" : ""}`}
        />
      </div>

      {error && (
        <p className="absolute -bottom-[22px] text-[12px] text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
