
export function EventsTextarea({
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

      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-[20px] top-[14px] text-gray-400  flex items-center">
            {icon}
          </div>
        )}


        <textarea
          {...props}
          rows={3}
          className={`w-full bg-[#F6F6F6] border-[1.4px] border-[#EAEAEA] rounded-lg outline-none resize-none py-3 ${
            icon ? "pl-[50px]" : "px-4"
          } ${error ? "border-red-500" : ""}`}
        />
      </div>

      {error && (
        <p className="absolute -bottom-[10px] text-[12px] text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
