"use client";

import Image from "next/image";
import Link from "next/link";
import DashboardActionableShimmer from "./Shimmer/DashboardActionableShimmer";

export default function DashboardActionableList({ data = [], loading = false, }) {
  // if (!Array.isArray(data)) {
  //   console.error("DashboardActionableList expected array, got:", data);
  //   return null;
  // }

  return (
    <div className="flex flex-col mt-6 rounded-2xl bg-[#F2F7FF] px-[24px] pt-[24px] max-h-[450px] ">

      {/* SHIMMER */}
      {loading ?
        <DashboardActionableShimmer />
        :
        <>
          {/* Header */}
          <div className="flex items-center justify-between mb-[20px]">
            <h3 className="text-[20px] font-[700] text-[#333]">Actionable</h3>
            <Link href={`/dashboard/actionable?item=all&page=1`} className="text-[14px] font-[600] text-[#0B57D0] border border-[#0B57D0] px-[14px] py-[4px] rounded-full cursor-pointer">
              {data.length ? `View all` : `Go to actionable`}
            </Link>
          </div>

          {/* List */}
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto min-mh-0">
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
                <div className="text-[20px] font-[600] text-[#333333] text-center">
                  No action items found
                </div>
                <p className="text-[14px] text-[#666666]">Looks like you haven’t added any action item yet</p>
              </div>
            )}
            {/* REAL DATA */}
            {data.length > 0 &&
              <div className="flex flex-col gap-[20px]">
                {data.map((item) => (
                  <div
                    key={item.actionableId}
                    className="flex items-start justify-between gap-[34px] border-b border-[#D4DFF1] pb-[20px] last:border-none"
                  >
                    {/* Left */}
                    <div className="flex gap-3">
                      <div className="mt-[7px] h-[8px] min-w-[8px] rounded-full bg-[#333]" />

                      <div className="flex flex-col gap-[6px]">
                        <p className="text-[16px] leading-[21px] font-[500] text-[#333] line-clamp-2">
                          {item.title ?? "—"}
                        </p>

                        {(item?.createdBy || item?.dueTime) &&
                          <p className="text-[14px] text-[#666666] font-[600] capitalize">
                            {item.createdBy?.name ?? "—"} | {item.dueTime ?? "—"}
                          </p>
                        }
                      </div>
                    </div>

                    {/* Right */}
                    <div className="flex items-center gap-[34px]">
                      <span className="w-[100px] text-[14px] text-[#333333] font-[600] whitespace-nowrap">
                        {item?.dueDate
                          ? new Date(item.dueDate).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                          })
                          : "—"}
                      </span>

                      {/* Avatars */}
                      {/* <div className="flex -space-x-2 h-[24px] w-[72px]"> */}
                      <div className="flex -space-x-2 h-[24px] w-[24px]">
                        {Array.isArray(item.collaborators) &&
                          item.collaborators.slice(0, 1).map((_, index) => (
                            <Image
                              key={index}
                              src={_?.dpURL}
                              alt="Collaborator Avatar"
                              height={24}
                              width={24}
                              className="h-[24px] w-[24px] rounded-full bg-[#D1D5DB] border-2 border-[#F2F6FC]"
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
