import { Trash2 } from "lucide-react";

// Asks before a destructive action, e.g. deleting a vendor
const ConfirmPopup = ({
  isOpen,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  isLoading = false,
  error = "",
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={isLoading ? undefined : onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-popup-title"
        className="w-full max-w-[480px] max-h-[90dvh] overflow-y-auto rounded-[28px] bg-white px-6 pt-10 pb-8 sm:px-8 sm:pt-12 sm:pb-10 shadow-xl flex flex-col items-center text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-full bg-[#FDECEC] flex items-center justify-center">
          <Trash2 size={36} strokeWidth={1.75} className="text-[#DC2626]" />
        </div>

        <h2 id="confirm-popup-title" className="mt-5 sm:mt-6 text-[20px] sm:text-[24px] font-[700] text-[#1a1a1a] break-words">
          {title}
        </h2>
        {message && <p className="mt-3 text-[15px] leading-6 text-gray-500">{message}</p>}
        {error && <p className="mt-4 text-[14px] text-red-500">{error}</p>}

        <div className="mt-7 sm:mt-9 flex gap-4 sm:gap-6 justify-center">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="w-[120px] rounded-full bg-[#999999] px-6 py-2 text-[18px] sm:text-[20px] text-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="w-[120px] flex items-center justify-center rounded-full bg-[#DC2626] px-6 py-2 text-[18px] sm:text-[20px] text-white cursor-pointer hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-[24px] h-[24px] border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmPopup;
