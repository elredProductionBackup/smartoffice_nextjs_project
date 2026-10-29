export default function FooterActions({ onClose, onSave }) {
  return (
           <div className="sticky bottom-[0px] bg-[#fff] flex justify-center w-[100%] gap-4 md:gap-[60px] px-4 md:px-0 pb-4 md:pb-[20px] pt-[10px] z-[10]">
          <button
            onClick={onClose}
            className="flex-1 max-w-[150px] md:flex-none md:w-[150px] py-[8px] rounded-[20px] bg-[#999999] text-white cursor-pointer"
          >
            Cancel
          </button>
          <button className="flex-1 max-w-[150px] md:flex-none md:w-[150px] py-[8px] rounded-[20px] text-white bg-[linear-gradient(95.15deg,#5597ED_3.84%,#00449C_96.38%)] cursor-pointer" onClick={onSave}>
            Save
          </button>
        </div>
        )
}
