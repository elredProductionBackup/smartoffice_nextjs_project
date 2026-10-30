import React from "react";

// Yes/no confirmation. message is an optional line under the title.
const EventActionConfirmModal = ({
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Complete",
  cancelText = "No",
  isLoading = false
}) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-4" onClick={onCancel}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className="bg-white shadow-xl flex flex-col items-center relative w-full max-w-[480px] max-h-[90dvh] overflow-y-auto rounded-[28px] sm:rounded-[32px] px-6 pt-9 pb-8 sm:px-10 sm:pt-11 sm:pb-10"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="confirm-modal-title"
          className="font-[700] text-[20px] sm:text-[24px] leading-[130%] text-center text-[#333] font-['Nunito_Sans']"
        >
          {title}
        </h2>

        {message && (
          <p className="mt-3 text-[15px] leading-6 text-center text-[#666666] font-nunito">{message}</p>
        )}

        <div className="mt-7 sm:mt-9 flex gap-3 sm:gap-4 w-full max-w-[340px]">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 h-12 cursor-pointer transition-all hover:opacity-90 flex items-center justify-center text-white rounded-[40px] bg-[#999999] font-nunito font-medium text-[18px] tracking-[-0.02em] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 h-12 cursor-pointer transition-all hover:opacity-90 flex items-center justify-center text-white bg-gradient-to-r from-[#5597ED] to-[#00449C] rounded-[40px] font-nunito font-medium text-[18px] tracking-[-0.02em] disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-[22px] h-[22px] border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventActionConfirmModal;
