import { removeActionable } from "@/store/actionable/actionableThunks";
import moment from "moment";
import { useRef, useEffect, useState } from "react";
import { BsCheck, BsThreeDotsVertical } from "react-icons/bs";
import { useDispatch, useSelector } from "react-redux";

export default function ActionItem({
  item,
  onCheck,
  onOpen,
  handleDelete,
  today = false
})  {
    const {
    actionableId,
    title,
    isCompleted,
    subTask = [],
    createdBy,
    dueDate,
    dueTime,
    collaborators = [],
  } = item;

  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef(null);

  const visibleAvatars = collaborators.slice(0, 3);
  const remainingCount = collaborators.length - 3;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

    const deletingId = useSelector(
      (state) => state.actionable.deletingId
    );

    const isDeleting = deletingId === item.actionableId;


  return (
    <div className="flex items-start justify-between gap-[20px] border-b border-[#D4DFF1] pb-[20px] last:border-b-0 relative cursor-pointer" onClick={onOpen}>

      {/* LEFT */}
      <div className="flex w-[55%] items-start gap-[14px] pr-[40px]">
        {/* Checkbox */}
        <div className="h-[30px] flex items-center">
          <div
             onClick={(e) => {
                e.stopPropagation();
                onCheck();
              }}
            className={`h-[18px] w-[18px] rounded-[4px] border-[2px] flex items-center justify-center cursor-pointer transition-colors
              ${
                    isCompleted
                  ? "bg-[#E72D38] border-[#E72D38]"
                  : "border-[#666666] bg-transparent"
              }
            `}
          >
            {isCompleted && <BsCheck size={18} color="#fff" />}
          </div>
        </div>

        {/* Text */}
        <div
          className={`flex flex-col text-[20px] font-medium mt-[5px] gap-[6px] text-[#333333] `}  >
          <div className={`line-clamp-1 leading-[22px] ${
                    isCompleted ? "line-through" : ""
              }`}>{title}</div>

          {subTask.length > 0 && (
            <ul className="ml-[30px] flex flex-col gap-[8px] list-disc text-[20px] font-[500] text-[#333333]">
              {subTask.slice(0, 2).map((sub, index) => {
                const isLastVisible = index === 1 && subTask.length > 2;

                return (
                  <li key={sub.id} className={`leading-[20px] ${    isCompleted ? "line-through" : ""}`}>
                    <div className="flex items-center gap-[60px]">
                      {/* TEXT */}
                      <span className={`line-clamp-1 ${!isLastVisible && 'flex-1'}`}>
                        {sub.text}
                      </span>

                      {/* +X subTask (only on last visible item) */}
                      {isLastVisible && (
                        <span className="flex items-center gap-[6px] text-[16px] font-[700] text-[#333] whitespace-nowrap">
                          <span className="text-[#999]"></span>
                          +{subTask.length - 2} subtask{subTask.length - 2 > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

         {createdBy && dueTime && (
            <div className="text-[16px] font-[600] text-[#666666]">
              <span className="capitalize">{createdBy?.name}</span> | {dueTime.toLowerCase()} IST
            </div>
          )}
        </div>
      </div>

      {/* RIGHT — Date + Avatars */}
      {(dueDate || collaborators.length > 0) && (
        <div className="flex items-center gap-[60px] flex-1">
          {dueDate && (
            <div className="text-[16px] font-[600] text-[#333333] whitespace-nowrap">
             {!today && moment(dueDate).format("DD MMM YYYY")}
            </div>
          )}

          {collaborators.length > 0 && (
            <div className="flex items-center gap-[8px]">
              {visibleAvatars.map((_, i) => (
                <div
                  key={i}
                  className="h-[32px] w-[32px] rounded-full bg-[#E5E7EB] border border-[#CCCCCC]"
                />
              ))}

              {remainingCount > 0 && (
                <div className="h-[32px] w-[32px] rounded-full bg-[#D3E3FD] border border-[#CCCCCC] flex items-center justify-center text-[14px] font-[600] text-[#000]">
                  +{remainingCount}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Menu — ENABLED for both Today & Past */}
      {!    isCompleted &&
      <div className="relative" ref={menuRef}>
        <BsThreeDotsVertical
          size={22}
          className="text-gray-500 cursor-pointer"
            onClick={(e) => {
            e.stopPropagation(); 
            setOpenMenu((prev) => !prev)
          }}
        />

        {openMenu && (
          <div
            className="absolute right-[34px] top-[0px] bg-white rounded-[20px] z-50 flex flex-col gap-[10px]"
            style={{
              boxShadow: "0px 4px 4px 0px #99999940",
              padding: "20px",
            }}
          >
            <button
              className="flex items-center gap-[6px] w-[180px] px-[14px] py-[10px] text-[18px] font-[500] text-[#333]"
              onClick={() => {
                setOpenMenu(false);
                console.log("Move item");
              }}
            >
              <span className="tabler--calendar-star"></span> Move item
            </button>

            <button
              className="flex items-center gap-[6px] w-[180px] px-[14px] py-[10px] text-[18px] font-[500] text-[#333]"
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenu(false);
                handleDelete();
              }}
            >
              <span className="fluent--delete-16-regular"></span> {isDeleting ? "Deleting..." : "Delete"} item
            </button>
          </div>
        )}
      </div>
       }
    </div>
  );
}
