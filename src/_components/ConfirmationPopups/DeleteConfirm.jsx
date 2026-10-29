import { useDispatch, useSelector } from "react-redux";
import { closeModal } from "@/store/actionable/actionableUiSlice";

const DeleteConfirm = ({selectedTask,handleDelete}) => {
    const dispatch = useDispatch();
    const { modal } = useSelector((state) => state.actionableUi);
    // Guard against a second click firing another delete while the first is in flight
    const deletingId = useSelector((state) => state.actionable.deletingId);
    const isDeleting = !!deletingId && deletingId === selectedTask?.actionableId;

    const isOpen = modal.type === "DELETE";
    if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => dispatch(closeModal())}>
        <div className="w-full max-w-[480px] max-h-[90dvh] overflow-y-auto rounded-[28px] bg-white pt-12 pb-8 sm:pt-[70px] sm:pb-[40px] shadow-xl flex flex-col items-center gap-8 sm:gap-[45px]" onClick={(e) => e.stopPropagation()}>
            <div className="text-[20px] sm:text-[24px] font-[700] px-6 sm:px-[100px] text-center">Are you sure you want to delete this item?</div>
            <div className="flex gap-4 sm:gap-[80px]">
                      <button onClick={() => dispatch(closeModal())}
                        className="rounded-full text-[18px] sm:text-[20px] bg-[#999999] px-6 py-2 text-white w-[120px] cursor-pointer" >
                        Cancel
                      </button>
            
                      <button onClick={() => { if (!isDeleting) handleDelete(); }} disabled={isDeleting} className="rounded-full text-[18px] sm:text-[20px] bg-gradient-to-r from-[#5597ED] to-[#00449C] w-[120px] px-[16px] py-[8px] text-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed" >
                        Delete
                      </button>
            
                    </div>
        </div>
    </div>
  )
}

export default DeleteConfirm