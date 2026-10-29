"use client";

import Image from "next/image";
import Link from "next/link";
import DashboardActionableShimmer from "./Shimmer/DashboardActionableShimmer";

export default function DashboardActionableList({ data = [], loading = false, fillHeight = false }) {
  // if (!Array.isArray(data)) {
  //   console.error("DashboardActionableList expected array, got:", data);
  //   return null;
  // }

  const cleanText = (text = "") => {
  return text
    .replace(/\\n/g, "\n")

    .replace(/\\t/g, "\t")

    .replace(/\\\\/g, "\\")

    .replace(/\n{3,}/g, "\n\n")

    .trim();
};

  return (
    // fillHeight: stretch to the parent's height (min 500px) instead of a fixed 500px box
    <div className={`flex flex-col rounded-2xl bg-[#F2F7FF] px-4 py-5 md:px-6 md:py-6 min-h-[360px] md:min-h-[500px] ${fillHeight ? "max-h-[70dvh] md:max-h-none md:h-full" : "max-h-[500px]"}`}>

      {/* SHIMMER */}
      {loading ?
        <DashboardActionableShimmer />
        :
        <>
          {/* Header */}
          <div className="flex items-center justify-between gap-3 mb-4 md:mb-[20px]">
            <h3 className="font-heading text-[18px] md:text-[20px] font-[700] text-[#333]">Actionable</h3>
            <Link href={`/dashboard/actionable?item=all&page=1`} className="shrink-0 text-[14px] font-[600] text-[#0B57D0] border border-[#0B57D0] px-[14px] py-[4px] rounded-full cursor-pointer">
              {data.length ? `View all` : `Go to actionable`}
            </Link>
          </div>

          {/* List */}
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto min-h-0">
            {data.length === 0 && (
              <div className="flex-1 flex flex-col gap-[10px] items-center justify-center">
                <div className="h-[60px] w-[60px] bg-[#D3E3FD] rounded-full mb-[10px] grid place-items-center">
                  <Image
                    src="/logo/group-checklist.svg"
                    alt="Checklist"
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                </div>
                <div className="text-[18px] md:text-[20px] font-[600] text-[#333333] text-center">
                  No action items found
                </div>
                <p className="text-[14px] text-[#666666] text-center">Looks like you haven’t added any action item yet</p>
              </div>
            )}
            {/* REAL DATA */}
            {data.length > 0 &&
              <div className="flex flex-col gap-4 md:gap-[20px]">
                {data.map((item) => (
                  <div
                    key={item.actionableId}
                    className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between lg:gap-[34px] border-b border-[#D4DFF1] pb-4 md:pb-[20px] last:border-none"
                  >
                    {/* Left */}
                    <div className="flex gap-3 min-w-0">
                      <div className="mt-[7px] h-[8px] min-w-[8px] rounded-full bg-[#333]" />

                      <div className="flex flex-col gap-[6px] min-w-0">
                        <p className="text-[16px] leading-[21px] font-[500] text-[#333] line-clamp-2 break-words">
                          {cleanText(item.title ?? "—")}
                        </p>

                        {(item?.createdBy || item?.dueTime) &&
                          <p className="text-[14px] text-[#666666] font-[600] capitalize">
                            {item.createdBy?.name ?? "—"} | {item.dueTime ?? "—"}
                          </p>
                        }
                      </div>
                    </div>

                    {/* Right */}
                    <div className="flex items-center justify-between gap-4 pl-5 lg:pl-0 lg:justify-start lg:gap-[34px]">
                      <span className="lg:w-[100px] text-[14px] text-[#333333] font-[600] whitespace-nowrap">
                        {item?.dueDate
                          ? new Date(item.dueDate).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                          })
                          : "—"}
                      </span>

                      {/* Avatars */}
                      <div className="flex -space-x-2 h-6 w-[72px]">
                      {/* <div className="flex -space-x-2 h-6 w-6"> */}
                        {Array.isArray(item.collaborators) &&
                          item.collaborators.slice(0, 3).map((_, index) => (
                            <Image
                              key={index}
                              src={_?.dpURL || "/logo/user-icon.svg"}
                              alt="Collaborator Avatar"
                              height={24}
                              width={24}
                              className="h-6 w-6 rounded-full bg-[#D1D5DB] border-2 border-[#F2F6FC]"
                            />
                          ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            }
          </div>
        </>
      }
    </div>
  );
}
