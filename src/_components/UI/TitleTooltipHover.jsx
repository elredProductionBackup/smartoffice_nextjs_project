"use client";
import { useState } from "react";

export default function TitleTooltipHover({ title, children }) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="relative inline-block max-w-full"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <div className="w-full">{children}</div>

      {visible && title && (
        <div
          className="
            absolute z-[9999]
            left-1/2 -translate-x-1/2 top-[calc(100%+10px)] mb-[8px]

            min-w-[120px] max-w-[100%] w-max
            px-[16px] py-[10px]

            text-[14px] leading-[20px] text-[#333]
            bg-[#e5e5e5] rounded-[16px]

            whitespace-normal break-words

            pointer-events-none
            shadow-[0px_4px_4px_0px_#99999940]
          "
        >
          {title}

         <div
                        className="absolute w-[16px] h-[8px] bg-[#e5e5e5] left-8 top-[-8px]"
                        style={{
                          clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
                        }}
                      />
        </div>
      )}
    </div>
  );
}