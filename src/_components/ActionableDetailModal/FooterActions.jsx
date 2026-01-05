export default function FooterActions({ onClose }) {
  return (
           <div className="sticky bottom-[0px] bg-[#fff] flex justify-center w-[100%] gap-[60px] pb-[20px] pt-[10px] z-[4]">
          <button
            onClick={onClose}
            className="w-[150px] py-[8px] rounded-[20px] bg-[#999999] text-white cursor-pointer"
          >
            Cancel
          </button>
          <button className="w-[150px] py-[8px] rounded-[20px] text-white bg-[linear-gradient(95.15deg,#5597ED_3.84%,#00449C_96.38%)] cursor-pointer">
            Save
          </button>
        </div>
        )
}
