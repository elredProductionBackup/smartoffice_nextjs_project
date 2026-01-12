import Image from "next/image";
import { IoIosArrowBack,IoIosArrowForward  } from "react-icons/io";
import { SiGoogledocs } from "react-icons/si";

// import noMember from "@/assets/logo/no-member.svg";
import callIcon from "@/assets/logo/call.svg";
// import userImage from "@/assets/image/user.jpeg";

import { CONSTANTS } from "@/utils/data";
// import { useModalStore } from "@/store/useModalStore";
import { useEffect, useRef, useState } from "react";
import MembersTableShimmer from "../Shimmer/MembersTableShimmer";
import Link from "next/link";

export default function MembersTable({ data=[], total, documents = false,currentPage,loading, onPageChange,onRowClick,search = "",tab }) {
  // const open = useModalStore((state) => state.open);
 const phonePopupRef = useRef(null);
 const [openTooltipFor, setOpenTooltipFor] = useState(null);
  //  const tooltipTableRef = useRef(null);
  const [openPhoneFor, setOpenPhoneFor] = useState(null);
  const [copiedPhoneFor, setCopiedPhoneFor] = useState(null);

  const handleCopyPhone = (e, phone, memberId) => {
    e.stopPropagation();

    navigator.clipboard.writeText(phone);
    setCopiedPhoneFor(memberId);

    setTimeout(() => {
      setCopiedPhoneFor(null);
    }, 2000);
  };



  const showPhoneDetails = (e, member) => {
    e.stopPropagation();
    setOpenPhoneFor((prev) => (prev === member.id ? null : member.id));
  };
  

  const paginatedData = data;
  const totalPages = Math.ceil(total / CONSTANTS.ITEMS_PER_PAGE);
  const isSearching = search?.length >= 3;
  const isEmpty = data.length === 0;

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        openPhoneFor &&
        phonePopupRef.current &&
        !phonePopupRef.current.contains(e.target)
      ) {
        setOpenPhoneFor(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openPhoneFor]);


  useEffect(() => {
  const handleClickOutside = (e) => {
    if (!openTooltipFor) return;

    const tooltipEl = document.getElementById(
      `tooltip-${openTooltipFor}`
    );

    // click happened outside tooltip
    if (tooltipEl && !tooltipEl.contains(e.target)) {
      setOpenTooltipFor(null);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, [openTooltipFor]);




  function formatTitles(titles) {
    if (!titles?.length) return "";
    const vals = titles.map(t => t.value);
    if (vals.length <= 2) return vals.map(v => v[0].toUpperCase() + v.slice(1)).join(" | ");
    const firstTwo = vals.slice(0, 2).map(v => v[0].toUpperCase() + v.slice(1));
    return `${firstTwo.join(" | ")} | +${vals.length - 2}`;
  }

  if (loading) return <MembersTableShimmer/>;

  return (
    <div className="flex-1 min-h-0 mt-[20px] rounded-[20px] bg-[#F2F7FF]  overflow-y-auto relative flex flex-col">

      {/* Table Header */}
      <div
        className={`flex items-center font-bold text-lg text-[#333333] px-[30px] pt-[30px] sticky top-0 bg-[#F2F7FF] py-3 pt-6 z-10`}
      >
        <div className="flex-3">Name/Title</div>
        {documents && <div className="text-center">Documents</div>}
        <div className="flex-1">Actions</div>
      </div>

      {/* Empty State */}
      {isEmpty && !loading && (
        <div className="flex flex-col justify-center items-center h-[calc(100vh-340px)] text-center">
          <div className="h-[80px] w-[80px] rounded-full bg-[#D3E3FD] grid place-items-center mb-[30px]">
              <Image
              src={isSearching?'/logo/no-search.svg':'/logo/no-member.svg'}
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
                Looks like you haven’t added any {tab==='members' ? tab?.slice(0,-1):tab} yet
              </div>
            </>
          )}
        </div>
      )}


      {/* Rows */}
      <div className="flex-1">
        {paginatedData.map((member, index) => {

          const display = formatTitles(member?.title);

          const formattedTitles = member?.title?.map(t => t.value[0].toUpperCase() + t.value.slice(1)) || [];

          const openUpwards = index >= paginatedData.length - 2;

          return (
              <div
                key={index}
                className={`
                  flex flex-1 items-center py-[20px] px-[30px]
                  bg-[#F2F7FF] cursor-pointer transition-all duration-200

                  hover:bg-[#E7F0FF]
                  hover:shadow-[0px_4px_4px_0px_#C7C7C740]
                  hover:border-transparent

                  ${
                    index !== paginatedData.length - 1
                      ? "border-b border-b-[#D4DFF1]"
                      : ""
                  }
                `}
                onClick={() => onRowClick(member)}
              >

              {/* LEFT - Name + title */}
              <div className="flex flex-3 items-center gap-4">
                {member.avatar ? <Image
                  src={member?.avatar}
                  alt={member.name}
                  width={48}
                  height={48}
                  className="rounded-full min-w-[48px] max-h-[48px] border border-[#CCCCCC]"
                />: <div className="min-w-[48px] h-[48px] bg-[#D4DFF1] grid place-items-center text-[22px] font-[600] rounded-full">{member.name?.slice(0,1)}</div>}
                <div>
                  <p className="font-semibold text-xl text-[#333333]">
                    {member.name}
                  </p>
                {/* Title tool tip  */}
                <div className="relative inline-block" >
                  <p
                    className="text-[20px] text-[#666666] font-[500] capitalize cursor-pointer"
                    onClick={(e) => {
                      

                      // only open if more than 2 titles
                      if (formattedTitles.length > 2) {
                        e.stopPropagation();
                        setOpenTooltipFor(prev =>
                          prev === member.id ? null : member.id
                        );
                      }
                    }}
                  >
                    {display}
                  </p>

                  {openTooltipFor === member.id && formattedTitles.length > 2 && (
                    <div id={`tooltip-${member.id}`}
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

                      {formattedTitles.map((title, idx) => (
                        <div key={idx} className="pl-[12px] h-[30px] w-[180px]">
                          {title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>


                </div>
              </div>

              {/* CENTER - Document Icon */}
              {documents && (
                <div className="flex justify-center">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <SiGoogledocs size={24} color="#666666" />
                  </div>
                </div>
              )}

              {/* RIGHT - Action Icons */}
              <div className="flex flex-1  gap-4 text-[#666666]">
                    {/* WhatsApp */}
                    <Link
                      href={`https://wa.me/${member?.phone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="w-10 h-10 bg-[#E6EBF2] rounded-full flex items-center justify-center cursor-pointer"
                      title="Chat on WhatsApp"
                    >
                      <span className="ic--baseline-whatsapp"></span>
                    </Link>

                    {/* Email */}
                    <Link
                      href={`mailto:${member?.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="w-10 h-10 bg-[#E6EBF2] rounded-full flex items-center justify-center cursor-pointer"
                      title="Send Email"
                    >
                      <span className="oui--email"></span>
                    </Link>

                {/* PHONE ICON + POPUP */}
                <div
                  className="w-10 h-10 bg-[#E6EBF2] rounded-full flex items-center justify-center cursor-pointer relative"
                  onClick={(e) => showPhoneDetails(e, member)}  ref={phonePopupRef}
                >
                  {/* <FaPhone size={24} color="#666666" /> */}
                  <span className="proicons--call"></span>
                  {/* PHONE POPUP */}
                  {openPhoneFor === member.id && (
                    <div
                      className={`w-[250px] bg-white z-30 p-5 rounded-[20px] absolute w-52 shadow-[0px_3px_4px_rgba(190,190,190,0.25)]
                      ${openUpwards ? "bottom-12" : "top-12"} -right-2`} ref={phonePopupRef}
                      onClick={(e)=>e.stopPropagation()}
                    >
                      <div
                        className={`bg-white w-[24px] h-[24px] rotate-45 absolute right-4 
                        ${openUpwards ? "-bottom-2" : "-top-2"}`}
                      ></div>

                      <div className="uppercase text-base font-bold text-[#333333] mb-2.5">
                        Phone
                      </div>

                      <div className="min-w-[180px] flex gap-2.5 items-center justify-between">
                            <div className="flex items-center gap-[6px] hover:underline" onClick={(e) => handleCopyPhone(e, member.phone, member.id)}>
                              <div className="bg-[#E6EBF2] rounded-full h-8 w-8 flex items-center justify-center">
                                <Image src={callIcon} alt="call" width={20} />
                              </div>
                              <div className="text-[#333333] text-base font-semibold">
                                {/* Copy */}
                                {member.phone}
                              </div>
                            </div>
                          <div className="relative">
                          {/* COPIED TOOLTIP */}
                          {copiedPhoneFor === member.id && (
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2
                                        bg-[#333] text-white text-xs px-2 py-1
                                        rounded-md whitespace-nowrap shadow-md z-50"
                            >
                              Copied
                            </div>
                          )}
                          <button
                            type="button"
                            
                            className="cursor-pointer flex items-center justify-center"
                            title="Copy phone number"
                          >
                            <span className="lucide--copy"></span>
                          </button>
                        </div>
                        </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {!isEmpty && totalPages > 1 && (
        <div className="flex justify-between gap-2 mt-6 bg-[#F2F7FF] px-[30px] pt-[20px] pb-[33px] sticky bottom-0">
          <div className="h-[48px] flex items-center text-lg font-semibold text-[#333333]">
            Showing {(currentPage - 1) * CONSTANTS.ITEMS_PER_PAGE + 1} to {Math.min(currentPage * CONSTANTS.ITEMS_PER_PAGE, total)} out of {total} entries
          </div>

          <div className="absolute left-1/2 -translate-x-1/2 flex gap-[80px]">
              <button
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="w-[48px] h-[48px] flex items-center justify-center rounded-full border-[1.2px] text-[24px] border-[#0B57D0] text-[#0B57D0] disabled:border-[#999999] disabled:text-[#999999] cursor-pointer"
            >
              <IoIosArrowBack/>
            </button>

            <button
               disabled={currentPage === totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className="w-[48px] h-[48px] flex items-center justify-center rounded-full border-[1.2px] text-[24px] border-[#0B57D0] text-[#0B57D0] disabled:border-[#999999] disabled:text-[#999999] cursor-pointer"
            >
              <IoIosArrowForward/>
            </button>
          </div>
          <div></div>
        </div>
      )}

    </div>
  );
}
