"use client";
import { useEffect, useRef, useState } from "react";
import { formatText } from "@/utils/functions";

export default function TitleTooltipHover({ title, children }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  // Touch screens have no hover: a tap toggles the tooltip, tapping elsewhere closes it
  useEffect(() => {
    if (!visible) return;
    const onOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setVisible(false);
    };
    document.addEventListener("touchstart", onOutside, { passive: true });
    return () => document.removeEventListener("touchstart", onOutside);
  }, [visible]);

  return (
    <div
      ref={ref}
      className="relative inline-block max-w-full"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onPointerUp={(e) => {
        if (e.pointerType === "touch") setVisible((v) => !v);
      }}
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
          {formatText(title)}

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