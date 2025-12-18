"use client";

import { IoSearch } from "react-icons/io5";
import { FaPlus } from "react-icons/fa6";
import { useRouter, useSearchParams } from "next/navigation";
import { BsThreeDotsVertical } from "react-icons/bs";
import { BsCheck } from "react-icons/bs";
import { useState } from "react";
const TABS_ITEMS = ["Past", "Today", "Weekly", "Monthly"];

export default function ActionItems() {
const router = useRouter();
const searchParams = useSearchParams();
const activeItem = searchParams.get("item") || "today";

const handleItemChange = (item) => {
  const params = new URLSearchParams(searchParams.toString());
  params.set("item", item.toLowerCase());
  router.push(`?${params.toString()}`);
};
  return (
    <div className="flex flex-col h-full rounded-xl bg-[#F5F9FF] px-[30px] pt-[30px] mt-[20px] gap-[20px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-[20px]">
        {/* Title + Add */}
        <div className="flex items-center gap-[20px]">
          <div className="text-[24px] font-[700] text-[#666666]">
            Action Items
          </div>

          <button
            className="
              flex items-center justify-center
              w-[50px] h-[36px]
              rounded-[100px]
              font-semibold text-white cursor-pointer
              bg-[linear-gradient(95.15deg,#5597ED_3.84%,#00449C_96.38%)]
            "
          >
            <FaPlus size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-[4px]">
          {/* Search */}
          <button
            className="
              w-[40px] h-[32px]
              flex items-center justify-center
              rounded-[4px]
              bg-[#D3E3FD]
              text-[#666666]
              outline-none border-none
              cursor-pointer
            "
          >
            <IoSearch size={18} />
          </button>

          {TABS_ITEMS.map((tab) => {
            const key = tab.toLowerCase();
            const isActive = activeItem === key;

            return (
              <button
                key={tab}
                onClick={() => handleItemChange(tab)}
                className={`
                  h-[32px] px-[16px]
                  flex items-center justify-center
                  text-[16px] font-[600]
                  rounded-[4px]
                  transition outline-none border-none cursor-pointer
                  ${
                    isActive
                      ? "bg-[#354C71] text-white"
                      : "bg-[#D3E3FD] text-[#666666]"
                  }
                `}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto rounded-lg">
        {activeItem === "today" && <TodayItems/>}
        {activeItem === "past" && <>Past Item</>}
        {activeItem === "weekly" && <>Weekly Item</>}
        {activeItem === "monthly" && <>Monthly Item</>}
      </div>
    </div>
  );
}

/* Sub Components */

    function TodayItems() {
    return (
        <div className="flex flex-col gap-[20px]">
        <Item text="Today meeting with channel partner at 5:00 PM" />
        <Item text="Your stay is confirmed at Hotel Gateway Grandeur on 5 Dec 2025." avatarCount={1} />
        <Item
            text="Meeting with Jason Statham, this Saturday 06:00 PM"
            link="https://meet.google.com/dfgq-aess-hdfsk"
            avatarCount={1} 
        />
        <Item text="Your stay is confirmed at Hotel Gateway Grandeur on 5 Dec 2025." avatarCount={1} />
        </div>
    );
    }


function Item({ text, link, avatarCount = 0 }) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="flex items-start justify-between border-b border-[#D4DFF1] pb-[20px] last:border-b-0">
      {/* Left part: checkbox + text */}
      <div className="flex flex-3 items-start gap-[14px]">
        <div className="h-[30px] flex items-center">
          {/* Custom checkbox */}
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

        <div className="flex flex-col text-[20px] font-medium text-[#333333]">
          <div>{text}</div>
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

      {avatarCount > 0 && (
        <div className="flex flex-[2.5] gap-[-8px] justify-center items-center">
          {Array.from({ length: avatarCount }).map((_, idx) => (
            <div
              key={idx}
              className="h-[32px] w-[32px] bg-gray-300 rounded-full border border-white"
            ></div>
          ))}
        </div>
      )}

      <BsThreeDotsVertical size={24} className="text-gray-500 cursor-pointer" />
    </div>
  );
}
