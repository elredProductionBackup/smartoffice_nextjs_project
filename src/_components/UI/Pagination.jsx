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
      className={`flex flex-col items-center lg:flex-row lg:items-stretch justify-between gap-2 bg-[#F2F7FF] pt-3 px-4 pb-4 md:pt-[20px] md:px-[30px] lg:pb-[33px] sticky bottom-0 
      ${rounded ? "rounded-[0px_20px_20px_0px]" : ""} ${className}`}
    >
      <div className="lg:h-[48px] flex items-center text-center text-sm md:text-base lg:text-lg font-semibold text-[#333333]">
        Showing {startIndex} to {endIndex} out of {total} entries
      </div>

      <div className="flex shrink-0 gap-6 lg:gap-[80px] lg:absolute lg:left-1/2 lg:-translate-x-1/2">
        <button
          disabled={isFirstPage}
          onClick={() => changePage(currentPage - 1)}
          className="w-10 h-10 md:w-[48px] md:h-[48px] cursor-pointer flex items-center justify-center rounded-full border-[1.2px] text-xl md:text-[24px]
          border-[#0B57D0] text-[#0B57D0] disabled:border-[#999999] disabled:text-[#999999] disabled:cursor-not-allowed"
        >
          <IoIosArrowBack />
        </button>

        <button
          disabled={isLastPage}
          onClick={() => changePage(currentPage + 1)}
          className="w-10 h-10 md:w-[48px] md:h-[48px] cursor-pointer flex items-center justify-center rounded-full border-[1.2px] text-xl md:text-[24px]
          border-[#0B57D0] text-[#0B57D0] disabled:border-[#999999] disabled:text-[#999999] disabled:cursor-not-allowed"
        >
          <IoIosArrowForward />
        </button>
      </div>
      <div className="hidden lg:block" />
    </div>
  );
}
