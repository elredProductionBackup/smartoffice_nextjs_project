import { useDispatch, useSelector } from "react-redux";
import { closeModal } from "@/store/actionable/actionableUiSlice";

const DeleteConfirm = ({selectedTask,handleDelete}) => {
    const dispatch = useDispatch();
    const { modal } = useSelector((state) => state.actionableUi);

    const isOpen = modal.type === "DELETE";
    if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => dispatch(closeModal())}>
        <div className="w-[480px] rounded-[28px] bg-white pt-[70px] pb-[40px] shadow-xl flex flex-col items-center gap-[45px]" onClick={(e) => e.stopPropagation()}>
            <div className="text-[24px] font-[700] px-[100px] text-center">Are you sure you want to delete this item?</div>
            <div className="flex gap-[80px]">
                      <button onClick={() => dispatch(closeModal())}
                        className="rounded-full text-[20px] bg-[#999999] px-6 py-2 text-white w-[120px] cursor-pointer" >
                        Cancel
                      </button>
            
                      <button onClick={() => {handleDelete()}} className="rounded-full text-[20px] bg-gradient-to-r from-[#5597ED] to-[#00449C] w-[120px] px-[16px] py-[8px] text-white cursor-pointer" >
                        Delete
                      </button>
            
                    </div>
        </div>
    </div>
  )
}

export default DeleteConfirm