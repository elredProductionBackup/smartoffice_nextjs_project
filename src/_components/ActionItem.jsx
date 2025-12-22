import { useState, useRef, useEffect } from "react";
import { BsCheck, BsThreeDotsVertical } from "react-icons/bs";

export default function ActionItem({
  text,
  link,
  avatars = [],
  date,
}) {
  const [checked, setChecked] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef(null);

  const visibleAvatars = avatars.slice(0, 3);
  const remainingCount = avatars.length - 3;

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

  return (
    <div className="flex items-start justify-between gap-[20px] border-b border-[#D4DFF1] pb-[20px] last:border-b-0 relative">
      
      {/* LEFT */}
      <div className="flex w-[65%] items-start gap-[14px] pr-[40px]">
        {/* Checkbox */}
        <div className="h-[30px] flex items-center">
          <div
            onClick={() => setChecked(!checked)}
            className={`h-[18px] w-[18px] rounded-[4px] border-[2px] flex items-center justify-center cursor-pointer transition-colors ${
              checked
                ? "bg-[#E72D38] border-[#E72D38]"
                : "border-[#666666] bg-transparent"
            }`}
          >
            {checked && <BsCheck size={18.67} color="#FFFFFF" />}
          </div>
        </div>

        {/* Text */}
        <div className="flex flex-col text-[20px] font-medium text-[#333333]">
          <div className="line-clamp-2">{text}</div>

          {link && (
            <a
              href={link}
              className="text-[16px] text-[#4091FC] hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {link}
            </a>
          )}
        </div>
      </div>

      {/* RIGHT — Date + Avatars */}
      {(date || avatars.length > 0) && (
        <div className="flex items-center gap-[20px] flex-1">
          {date && (
            <div className="text-[16px] font-[600] text-[#333333] whitespace-nowrap">
              {date}
            </div>
          )}

          {avatars.length > 0 && (
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

      {/* Menu */}
      <div className="relative" ref={menuRef}>
        <BsThreeDotsVertical
          size={22}
          className="text-gray-500 cursor-pointer"
          onClick={() => setOpenMenu((prev) => !prev)}
        />

        {openMenu && (
          <div className="absolute right-[34px] top-[0px] bg-white  rounded-[20px] z-50 flex flex-col gap-[10px]"
              style={{
      boxShadow: "0px 4px 4px 0px #99999940",
      padding: "20px",
    }}
          >
            <button
              className="flex item-center gap-[6px] w-[180px] text-left px-[14px] py-[10px] text-left text-[18px] font-[500] text-[#333] cursor-pointer"
              onClick={() => {
                setOpenMenu(false);
                console.log("Move item");
              }}
            >
              <span class="tabler--calendar-star"></span> Move item
            </button>

            <button
              className="flex item-center gap-[6px] w-[180px] text-left px-[14px] py-[10px] text-left text-[18px] font-[500] text-[#333] cursor-pointer"
              onClick={() => {
                setOpenMenu(false);
                console.log("Delete item");
              }}
            >
              <span class="fluent--delete-16-regular"></span> Delete item
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
