import Image from "next/image";
import { FaWhatsapp, FaEnvelope, FaPhone } from "react-icons/fa";
import { IoIosArrowBack,IoIosArrowForward  } from "react-icons/io";
import { SiGoogledocs } from "react-icons/si";

import noMember from "@/assets/logo/no-member.svg";
import callIcon from "@/assets/logo/call.svg";
import userImage from "@/assets/image/user.jpeg";

import { CONSTANTS } from "@/utils/data";
import { useModalStore } from "@/store/useModalStore";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";


// ------------------------ 10 SAMPLE MEMBERS ------------------------
const sampleData = [
  {
    id: 1,
    name: "Liam Chen",
    role: "UX Designer",
    image: userImage,
    email: "liamchen@gmail.com",
    phone: "9876543210",
  },
  {
    id: 2,
    name: "Ava Patel",
    role: "Marketing Specialist",
    image: userImage,
    email: "ava.patel@gmail.com",
    phone: "9876501234",
  },
  {
    id: 3,
    name: "Noah Kim",
    role: "Software Engineer",
    image: userImage,
    email: "noah.kim@gmail.com",
    phone: "9876505678",
  },
  {
    id: 4,
    name: "Isabella Garcia",
    role: "Data Analyst",
    image: userImage,
    email: "isabella.garcia@gmail.com",
    phone: "9876512345",
  },
  {
    id: 5,
    name: "Ethan Rodriguez",
    role: "Product Manager",
    image: userImage,
    email: "ethan.rod@gmail.com",
    phone: "9876554321",
  },
  {
    id: 6,
    name: "Sophia Mehta",
    role: "Customer Success Lead",
    image: userImage,
    email: "sophia.mehta@gmail.com",
    phone: "9876549870",
  },
  {
    id: 7,
    name: "Arjun Reddy",
    role: "Frontend Developer",
    image: userImage,
    email: "arjun.reddy@gmail.com",
    phone: "9876598765",
  },
  {
    id: 8,
    name: "Mia Thompson",
    role: "HR Executive",
    image: userImage,
    email: "mia.thompson@gmail.com",
    phone: "9876524680",
  },
  {
    id: 9,
    name: "Rahul Singh",
    role: "QA Engineer",
    image: userImage,
    email: "rahul.singh@gmail.com",
    phone: "9876581234",
  },
  {
    id: 10,
    name: "Emily Johnson",
    role: "Content Strategist",
    image: userImage,
    email: "emily.johnson@gmail.com",
    phone: "9876567890",
  },
  {
    id: 11,
    name: "Emily Johnson",
    role: "Content Strategist",
    image: userImage,
    email: "emily.johnson@gmail.com",
    phone: "9876567890",
  },
  {
    id: 12,
    name: "Emily Johnson",
    role: "Content Strategist",
    image: userImage,
    email: "emily.johnson@gmail.com",
    phone: "9876567890",
  },
];

export default function MembersTable({ data = sampleData, document = true }) {
  const open = useModalStore((state) => state.open);
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentPage = Number(searchParams.get("page")) || 1;

  const startIndex = (currentPage - 1) * CONSTANTS.ITEMS_PER_PAGE;
  const endIndex = startIndex + CONSTANTS.ITEMS_PER_PAGE;

  const [openPhoneFor, setOpenPhoneFor] = useState(null);

  const showPhoneDetails = (e, member) => {
    e.stopPropagation();
    setOpenPhoneFor((prev) => (prev === member.id ? null : member.id));
  };

  const columns = document ? "grid-cols-3" : "grid-cols-2";

    const changePage = (page) => {
    router.push(`/dashboard/members?page=${page}`);
  };


  
  const paginatedData = data?.slice(startIndex, endIndex);
  const totalPages = Math.ceil(data.length / CONSTANTS.ITEMS_PER_PAGE);

  return (
    <div className="rounded-[20px] bg-[#F2F7FF] h-[calc(100vh-226px)] overflow-y-auto relative flex flex-col">

      {/* Table Header */}
      <div
        className={`grid ${columns} font-bold text-lg text-[#333333] mb-4 px-6 sticky top-0 bg-[#F2F7FF] py-3 pt-6 z-10`}
      >
        <div>Name/Title</div>
        {document && <div className="text-center">Documents</div>}
        <div className="text-center">Actions</div>
      </div>

      {/* Empty State */}
      {data.length === 0 && (
        <div className="flex flex-col justify-center items-center h-[calc(100vh-340px)] text-xl font-medium text-[#666]">
          <Image src={noMember} alt="" className="mb-8" />
          <div className="mb-5 text-2xl font-semibold">No members found</div>
          <div className="text-base font-normal">{CONSTANTS.NO_USER}</div>
        </div>
      )}

      {/* Rows */}
      <div className="space-y-4 flex-1">
        {paginatedData.map((member, index) => {

          // last few items → popup opens upward
          const openUpwards = index >= paginatedData.length - 2;
          // const openUpwards = index >= data.length - 2;

          return (
            <div
              key={member.id}
              className={`grid ${columns} items-center p-4 bg-[#F2F7FF] mx-4 cursor-pointer
              ${index !== paginatedData.length - 1 ? "border-b border-b-[#D4DFF1]" : ""}
            `}
              onClick={() => open(member)}
            >
              {/* LEFT - Name + Role */}
              <div className="flex items-center gap-4">
                <Image
                  src={member.image}
                  alt={member.name}
                  width={48}
                  height={48}
                  className="rounded-full border border-[#CCCCCC]"
                />
                <div>
                  <p className="font-semibold text-xl text-[#333333]">
                    {member.name}
                  </p>
                  <p className="text-base font-medium text-[#666666]">
                    {member.role}
                  </p>
                </div>
              </div>

              {/* CENTER - Document Icon */}
              {document && (
                <div className="flex justify-center">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <SiGoogledocs size={24} color="#666666" />
                  </div>
                </div>
              )}

              {/* RIGHT - Action Icons */}
              <div className="flex justify-center gap-4">
                <div className="w-10 h-10 bg-[#E6EBF2] rounded-full flex items-center justify-center cursor-pointer">
                  <FaWhatsapp size={24} color="#666666" />
                </div>

                <div className="w-10 h-10 bg-[#E6EBF2] rounded-full flex items-center justify-center cursor-pointer">
                  <FaEnvelope size={24} color="#666666" />
                </div>

                {/* PHONE ICON + POPUP */}
                <div
                  className="w-10 h-10 bg-[#E6EBF2] rounded-full flex items-center justify-center cursor-pointer relative"
                  onClick={(e) => showPhoneDetails(e, member)}
                >
                  <FaPhone size={24} color="#666666" />

                  {/* PHONE POPUP */}
                  {openPhoneFor === member.id && (
                    <div
                      className={`bg-white z-30 p-5 rounded-[20px] absolute w-52 shadow-[0px_3px_4px_rgba(190,190,190,0.25)]
                      ${openUpwards ? "bottom-12" : "top-12"} -right-2`}
                    >
                      <div
                        className={`bg-white w-5 h-5 rotate-45 absolute right-4 
                        ${openUpwards ? "-bottom-2" : "-top-2"}`}
                      ></div>

                      <div className="uppercase text-base font-bold text-[#333333] mb-2.5">
                        Phone
                      </div>

                      <div className="flex gap-2.5 items-center">
                        <div className="bg-[#E6EBF2] rounded-full h-8 w-8 flex items-center justify-center">
                          <Image src={callIcon} alt="call" width={20} />
                        </div>
                        <div className="text-[#333333] text-base font-semibold">
                          {member.phone}
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
      {totalPages > 1 && (
        <div className="flex justify-between gap-2 mt-6 bg-[#F2F7FF] px-[30px] pt-[20px] pb-[33px] sticky bottom-0">
          <div className="h-[48px] flex items-center text-lg font-semibold text-[#333333]">
            Showing {(currentPage - 1) * CONSTANTS.ITEMS_PER_PAGE + 1} to {Math.min(currentPage * CONSTANTS.ITEMS_PER_PAGE, data.length)} out of {data.length} entries
          </div>

          <div className="absolute left-1/2 -translate-x-1/2 flex gap-[80px]">
              <button
              disabled={currentPage === 1}
              onClick={() => changePage(currentPage - 1)}
              className="w-[48px] h-[48px] flex items-center justify-center rounded-full border-[1.2px] text-[24px] border-[#0B57D0] text-[#0B57D0] disabled:border-[#999999] disabled:text-[#999999] cursor-pointer"
            >
              <IoIosArrowBack/>
            </button>

            <button
              disabled={currentPage === totalPages}
              onClick={() => changePage(currentPage + 1)}
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
