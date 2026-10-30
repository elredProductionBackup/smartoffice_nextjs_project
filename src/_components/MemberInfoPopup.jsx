"use client";

import Image from "next/image";
import { FaWhatsapp, FaEnvelope, FaPhone } from "react-icons/fa";
import { LuCopy } from "react-icons/lu";
import { useModalStore } from "@/store/useModalStore";
// import userImage from "@/assets/image/user.jpeg";

export default function MemberInfoPopup() {
  const { isOpen, modalData, close } = useModalStore();

  if (!isOpen || !modalData) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl max-h-[90dvh] overflow-y-auto rounded-2xl shadow-xl p-5 md:p-8 relative">
        <button
          onClick={close}
          className="absolute top-4 right-4 md:top-6 md:right-6 text-gray-500 hover:text-black text-2xl"
        >
          ✕
        </button>

        <div className="flex flex-col  gap-6">
          <img
            src={modalData?.image?.src}
            alt=""
            className="rounded-full"
            height={90}
            width={90}
          />

          <div className="flex gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl md:text-3xl font-semibold break-words">{modalData.name}</h2>
              <p className="text-lg text-gray-600">{modalData.role}</p>
            </div>

            <div className="cursor-pointer text-green-500">
              <FaWhatsapp size={35} />
            </div>
          </div>
        </div>

        <hr className="my-6 md:my-8 border-gray-300" />

        {modalData.documentLink && (
          <div className="mb-8">
            <h3 className="font-bold text-lg mb-2">DOCUMENTS UPLOADED</h3>

            <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
              <a
                href={modalData.documentLink}
                target="_blank"
                className="text-blue-600 break-all"
              >
                {modalData.documentLink}
              </a>

              <button
                className="flex shrink-0 items-center gap-2 border px-4 py-1.5 rounded-full text-sm hover:bg-gray-100"
                onClick={() =>
                  navigator.clipboard.writeText(modalData.documentLink)
                }
              >
                <LuCopy size={18} /> Copy link
              </button>
            </div>
          </div>
        )}

        {modalData.email && (
          <div className="mb-8">
            <h3 className="font-bold text-lg mb-3">EMAIL</h3>
            <div className="flex items-center gap-3">
              <FaEnvelope className="text-gray-500" size={22} />
              <span className="text-gray-800 break-all">{modalData.email}</span>
            </div>
          </div>
        )}

        {modalData.phone && (
          <div className="mb-4">
            <h3 className="font-bold text-lg mb-3">PHONE</h3>
            <div className="flex items-center gap-3">
              <FaPhone className="text-gray-500" size={22} />
              <span className="text-gray-800">{modalData.phone}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
