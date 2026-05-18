import { FiExternalLink } from "react-icons/fi";

const ExportAsExcelButton = ({ onClick, small = false, className = "" }) => {
  const sizeClasses = small
    ? "text-[14px] py-2.5 px-4"
    : "text-[14px] py-3 px-6";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-white cursor-pointer font-medium rounded-full flex items-center gap-2 transition shadow-md ${sizeClasses} ${className}`}
      style={{
        backgroundImage: "linear-gradient(90deg, #5597ED 0%, #00449C 100%)",
      }}
    >
      <FiExternalLink className="w-4 h-4" />
      <span>Export as Excel</span>
    </button>
  );
};

export default ExportAsExcelButton;
