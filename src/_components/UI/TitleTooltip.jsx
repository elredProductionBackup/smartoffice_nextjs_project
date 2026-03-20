import { useState, useRef } from "react";
import { useOutsideClick } from "@/hooks/useOutsideClick";

const TitleTooltip = ({
  display = "",
  fullList = [],
  className = "",
  maxVisible = 2,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef(null);

  // ✅ Close when clicking outside
  useOutsideClick(tooltipRef, () => setIsOpen(false));

  const handleToggle = (e) => {
    if (fullList.length <= maxVisible) return;
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  return (
    <div ref={tooltipRef} className={`relative inline-block ${className}`}>
      {/* Title */}
      <p
        className="text-[20px] text-[#666666] font-[500] capitalize cursor-pointer"
        onClick={handleToggle}
      >
        {display || "No Title"}
      </p>

      {/* Tooltip */}
      {isOpen && fullList.length > maxVisible && (
        <div
          className="absolute z-50 w-max min-w-[200px] bg-[#ffffff] text-[#333]
                     text-[16px] font-[500] p-[10px] rounded-[20px]
                     whitespace-nowrap top-[calc(100%+8px)] right-0
                     flex flex-col gap-[4px]"
          style={{ boxShadow: "0px 4px 4px 0px #99999940" }}
        >
          {/* Arrow */}
          <div
            className="absolute w-[16px] h-[8px] bg-[#ffffff] right-4 top-[-8px]"
            style={{
              clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
            }}
          />

          {fullList.map((title, idx) => (
            <div key={idx} className="pl-[12px] h-[30px] w-[180px]">
              {title}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TitleTooltip;