import { CheckCircle2 } from "lucide-react";

// Shown after something is saved, e.g. "Vendor added".
// stats: optional [{ label, value }] rows shown under the message.
const SuccessPopup = ({ isOpen, title, message, stats = [], onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="success-popup-title"
        className="w-full max-w-[480px] rounded-[28px] bg-white px-8 pt-12 pb-10 shadow-xl flex flex-col items-center text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-20 h-20 rounded-full bg-[#E8F7EE] flex items-center justify-center">
          <CheckCircle2 size={40} strokeWidth={1.75} className="text-[#16A34A]" />
        </div>

        <h2 id="success-popup-title" className="mt-6 text-[24px] font-[700] text-[#1a1a1a]">
          {title}
        </h2>
        {message && <p className="mt-3 text-[15px] leading-6 text-gray-500">{message}</p>}

        {stats.length > 0 && (
          <div className="mt-6 w-full rounded-[16px] bg-[#F2F7FF] px-5 py-2 text-left">
            {stats.map(({ label, value }, index) => (
              <div
                key={label}
                className={`flex items-center justify-between py-2.5 ${
                  index !== stats.length - 1 ? "border-b border-[#D4DFF1]" : ""
                }`}
              >
                <span className="text-[15px] text-[#666666]">{label}</span>
                <span className="text-[16px] font-semibold text-[#333333]">{value}</span>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          autoFocus
          className="mt-9 w-[120px] rounded-full bg-gradient-to-r from-[#5597ED] to-[#00449C] px-[16px] py-[8px] text-[20px] text-white cursor-pointer"
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default SuccessPopup;
