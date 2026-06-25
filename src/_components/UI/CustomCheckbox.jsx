import { BsCheck } from "react-icons/bs";

const CustomCheckbox = ({ checked, onChange, disabled = false }) => {
  return (
    <div className="h-[30px] flex items-center">
      <div
        onClick={(e) => {
          e.stopPropagation();
          if (disabled) return;
          onChange();
        }}
        className={`h-[18px] w-[18px] rounded-[4px] border-[2px] flex items-center justify-center
          ${disabled ? "pointer-events-none cursor-not-allowed" : "cursor-pointer"}
          transition-colors
          ${
            checked
              ? disabled
                ? "bg-[#999999] border-[#999999]"
                : "bg-[#147BFF] border-[#147BFF]"
              : "border-[#666666] bg-transparent"
          }`}
      >
        {checked && <BsCheck size={16} color="#fff" />}
      </div>
    </div>
  );
};
export default CustomCheckbox