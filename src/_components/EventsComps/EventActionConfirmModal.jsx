import React from "react";

const EventActionConfirmModal = ({ 
  title, 
  onConfirm, 
  onCancel, 
  confirmText = "Complete", 
  cancelText = "No",
  isLoading = false 
}) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40" onClick={onCancel}>
      <div 
        className="bg-white shadow-xl flex flex-col items-center justify-center gap-[40px] relative w-[480px] h-[250px] rounded-[40px] opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="px-[40px] font-[700] text-[24px] leading-[100%] tracking-[0%] text-center text-[#333] font-['Nunito_Sans']">
          {title}
        </h2>

        <div className="flex gap-[30px]">
          <button 
            onClick={onCancel}
            className="cursor-pointer transition-all hover:opacity-90 flex items-center justify-center text-white w-[150px] rounded-[40px] bg-[#999999] font-nunito font-medium text-[20px] leading-[100%] tracking-[-0.02em]"
          >
            {cancelText}
          </button>

          <button 
            onClick={onConfirm}
            disabled={isLoading}
            className="cursor-pointer transition-all hover:opacity-90 flex items-center justify-center text-white bg-gradient-to-r from-[#5597ED] to-[#00449C] w-[150px] px-5 py-2 rounded-[40px] font-nunito font-medium text-[20px] leading-[100%] tracking-[-0.02em]"
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

export default EventActionConfirmModal;
