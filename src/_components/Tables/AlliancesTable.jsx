"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { HiEllipsisVertical, HiOutlinePencilSquare, HiOutlineTrash } from "react-icons/hi2";
import MembersTableShimmer from "@/_components/Shimmer/MembersTableShimmer";

// Three-dot menu at the end of a row. Opens upwards near the bottom of the list.
const RowMenu = ({ onEdit, onDelete, openUp }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative ml-auto" ref={menuRef} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-10 h-10 grid place-items-center rounded-full hover:bg-[#D4DFF1] transition-colors cursor-pointer"
        aria-label="More actions"
      >
        <HiEllipsisVertical className="text-2xl text-[#333]" />
      </button>

      {open && (
        <div
          className={`absolute right-0 z-20 w-[180px] rounded-[20px] bg-white p-3 ${
            openUp ? "bottom-full mb-2" : "top-full mt-2"
          }`}
          style={{ boxShadow: "0px 4px 4px 0px #99999940" }}
        >
          {onEdit && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
              className="w-full flex items-center gap-3 rounded-[8px] px-2 py-2 text-[18px] font-medium text-[#333] hover:bg-[#F2F7FF] cursor-pointer"
            >
              <HiOutlinePencilSquare className="text-2xl" />
              Edit
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="w-full flex items-center gap-3 rounded-[8px] px-2 py-2 text-[18px] font-medium text-red-600 hover:bg-red-50 cursor-pointer"
          >
            <HiOutlineTrash className="text-2xl" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default function AlliancesTable({
  data = [],
  search = "",
  tab,
  subtitleLabel = "",
  loading = false,
  loadingMore = false,
  error = false,
  onRetry = () => {},
  lastRowRef,
  onEdit, // (item) => void; adds Edit to the row menu
  onDelete, // (item) => void; the row menu only shows when this is passed
  onRowClick, // (item) => void; opens the details popup
}) {
  const isSearching = search?.length >= 3;
  const isEmpty = data.length === 0;

  if (loading) return <MembersTableShimmer />;

  return (
    <div className="flex-1 min-h-0 mt-[20px] rounded-[20px] bg-[#F2F7FF] overflow-y-auto relative flex flex-col">

      {/* Table Header */}
      <div className="flex items-center font-bold text-lg text-[#333333] px-[30px] sticky top-0 bg-[#F2F7FF] py-3 pt-6 z-10">
        <div className="flex-3">Name/{subtitleLabel}</div>
        <div className="flex-1">Actions</div>
      </div>

      {/* Error State (nothing loaded yet) */}
      {isEmpty && error && (
        <div className="flex flex-col justify-center items-center h-[calc(100vh-340px)] text-center">
          <div className="mb-3 text-2xl font-semibold text-[#333333]">
            Couldn&apos;t load {tab}
          </div>
          <div className="text-base font-normal text-[#666666] mb-6">
            Something went wrong. Please try again.
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-full bg-gradient-to-r from-[#5597ED] to-[#00449C] px-6 py-2 text-white cursor-pointer"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty State */}
      {isEmpty && !error && (
        <div className="flex flex-col justify-center items-center h-[calc(100vh-340px)] text-center">
          <div className="h-[80px] w-[80px] rounded-full bg-[#D3E3FD] grid place-items-center mb-[30px]">
            <Image
              src={isSearching ? "/logo/no-search.svg" : "/logo/no-member.svg"}
              alt="Fallback logo"
              width={50}
              height={50}
            />
          </div>

          {isSearching ? (
            <>
              <div className="mb-3 text-2xl font-semibold text-[#333333]">
                No search result found
              </div>
              <div className="text-base font-normal text-[#666666]">
                Try adjusting your search or filters.
              </div>
            </>
          ) : (
            <>
              <div className="mb-3 text-2xl font-semibold text-[#333333]">
                No {tab} yet
              </div>
              <div className="text-base font-normal text-[#666666]">
                Looks like you haven’t added any {tab} yet
              </div>
            </>
          )}
        </div>
      )}

      {/* Rows */}
      <div className="flex-1">
        {data.map((item, index) => (
          <div
            key={item.id}
            ref={index === data.length - 1 ? lastRowRef : undefined}
            onClick={() => onRowClick?.(item)}
            className={`
              flex flex-1 items-center py-[20px] px-[30px] ${onRowClick ? "cursor-pointer" : ""}
              bg-[#F2F7FF] transition-all duration-200
              hover:bg-[#E7F0FF]
              hover:shadow-[0px_4px_4px_0px_#C7C7C740]
              ${index !== data.length - 1 ? "border-b border-b-[#D4DFF1]" : ""}
            `}
          >
            {/* LEFT - Name + subtitle */}
            <div className="flex flex-3 items-center gap-4">
              <div className="min-w-[48px] h-[48px] bg-[#D4DFF1] grid place-items-center text-[22px] font-[600] rounded-full uppercase">
                {item.name?.slice(0, 1)}
              </div>
              <div>
                <p className="font-semibold text-xl text-[#333333]">{item.name}</p>
                <p className="text-[20px] text-[#666666] font-[500] capitalize">
                  {item.subtitle}
                </p>
              </div>
            </div>

            {/* RIGHT - Action Icons */}
            <div className="flex flex-1 items-center gap-4 text-[#666666]" onClick={(e) => e.stopPropagation()}>
              <Link
                href={`https://wa.me/${item.phone?.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-[#E6EBF2] rounded-full flex items-center justify-center cursor-pointer"
                title="Chat on WhatsApp"
              >
                <span className="ic--baseline-whatsapp"></span>
              </Link>

              <Link
                href={`mailto:${item.email}`}
                className="w-10 h-10 bg-[#E6EBF2] rounded-full flex items-center justify-center cursor-pointer"
                title={item.email}
              >
                <span className="oui--email"></span>
              </Link>

              <Link
                href={`tel:${item.phone}`}
                className="w-10 h-10 bg-[#E6EBF2] rounded-full flex items-center justify-center cursor-pointer"
                title={item.phone}
              >
                <span className="proicons--call"></span>
              </Link>

              {onDelete && (
                <RowMenu
                  onEdit={onEdit && (() => onEdit(item))}
                  onDelete={() => onDelete(item)}
                  openUp={data.length > 3 && index >= data.length - 2}
                />
              )}
            </div>
          </div>
        ))}

        {/* Next page */}
        {loadingMore && (
          <div className="py-4 text-center text-[#666666]">Loading more...</div>
        )}
        {!isEmpty && error && !loadingMore && (
          <div className="py-4 text-center text-[#666666]">
            Couldn&apos;t load more {tab}.{" "}
            <button type="button" onClick={onRetry} className="text-[#00449C] font-semibold cursor-pointer">
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
