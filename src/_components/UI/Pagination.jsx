"use client";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { usePagination } from "@/hooks/usePagination";
import { useRouter, useSearchParams } from "next/navigation";

export default function Pagination({
  total,
  currentPage,
  perPage = 10,
  className = "",
  rounded = false,
  itemLength=false
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { totalPages, startIndex, endIndex, isFirstPage, isLastPage } =
    usePagination({ total, currentPage, perPage });

  const changePage = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage);
    router.push(`?${params.toString()}`);
  };

  if (totalPages <= 1 || itemLength) return null;

  return (
    <div
      className={`flex justify-between gap-2 bg-[#F2F7FF] pt-[20px] px-[30px] pb-[33px] sticky bottom-0 
      ${rounded ? "rounded-[0px_20px_20px_0px]" : ""} ${className}`}
    >
      <div className="h-[48px] flex items-center text-lg font-semibold text-[#333333]">
        Showing {startIndex} to {endIndex} out of {total} entries
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 flex gap-[80px]">
        <button
          disabled={isFirstPage}
          onClick={() => changePage(currentPage - 1)}
          className="w-[48px] h-[48px] cursor-pointer flex items-center justify-center rounded-full border-[1.2px] text-[24px]
          border-[#0B57D0] text-[#0B57D0] disabled:border-[#999999] disabled:text-[#999999] disabled:cursor-not-allowed"
        >
          <IoIosArrowBack />
        </button>

        <button
          disabled={isLastPage}
          onClick={() => changePage(currentPage + 1)}
          className="w-[48px] h-[48px] cursor-pointer flex items-center justify-center rounded-full border-[1.2px] text-[24px]
          border-[#0B57D0] text-[#0B57D0] disabled:border-[#999999] disabled:text-[#999999] disabled:cursor-not-allowed"
        >
          <IoIosArrowForward />
        </button>
      </div>
      <div />
    </div>
  );
}
