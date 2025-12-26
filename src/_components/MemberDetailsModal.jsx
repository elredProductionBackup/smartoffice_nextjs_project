import { useState } from "react";
import Image from "next/image";

export default function MemberDetailsModal({ member, onClose }) {
  const [activeDoc, setActiveDoc] = useState(null);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white w-[650px] rounded-[20px] p-[40px] relative flex flex-col gap-[40px]" onClick={(e) => e.stopPropagation()}>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute h-[24px] w-[24px] bg-[#EEEEEE] rounded-full right-[40px] top-[40px] grid place-items-center cursor-pointer"
        >
          <span className="akar-icons--cross small-cross"></span>
        </button>

        {/* Header */}
        <div className="flex flex-col gap-[20px] items-start">
          <Image src={member.image} alt="" width={100} height={100}
            className="rounded-full" />

          <div className="w-[100%] flex flex-col gap-[6px]">
            <div className="w-[100%] flex items-center justify-between">
              <h2 className="text-[32px] text-[#333333] font-[600]">{member.name}</h2>
              <span className="logos--whatsapp-icon"></span>
            </div>
            <p className="text-[20px] text-[#666666] font-[500]">{member.title}</p>
            {member.location && <div className="flex items-center gap-[8px] text-[16px] text-[#666666] font-[600]">
              <span className="h-[24px] w-[24px] rounded-full bg-[#E6EBF2] grid place-items-center"><span className="weui--location-outlined"></span></span> 
              {member.location}
            </div>}
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-x-10 gap-y-[40px] text-base text-[#333333]">

          {/* Email (LEFT column) */}
          <div className="flex flex-col gap-[12px] justify-self-start">
            <span className="text-[20px] font-[700] uppercase">Email</span>
            <span className="flex gap-[8px] text-[#666666] text-[16px] font-[600]">
              <span className="h-[24px] w-[24px] rounded-full bg-[#E6EBF2] grid place-items-center">
                <span className="oui--email small-icon"></span>
              </span> 
              {member.email}
              </span>
          </div>

          {/* Phone (RIGHT column – block aligned right) */}
          <div className="flex flex-col gap-[12px] justify-self-end w-[230px]">
            <span className="text-[20px] font-[700] uppercase">Phone</span>
            <div className="flex items-center gap-2">
              <span className="flex gap-[8px] text-[#666666] text-[16px] font-[600]">
                <span className="h-[24px] w-[24px] rounded-full bg-[#E6EBF2] grid place-items-center">
                  <span className="proicons--call small-icons"></span>
                </span>
                {member.phone}
              </span>
            </div>
          </div>

          {/* Spouse (LEFT column) */}
          <div className="flex flex-col gap-[12px] justify-self-start text-[#333333] ">
            <span className="text-[20px] font-[700] uppercase">Spouse Name</span>
            <span className="text-[16px] font-[600]">{member.spouse || "—"}</span>
          </div>

          {/* Children (RIGHT column – block aligned right) */}
          <div className="flex flex-col gap-[12px] justify-self-end text-[#333333] w-[230px]">
            <span className="text-[20px] font-[700] uppercase">Children Name</span>
            <span className="text-[16px] font-[600]">
              {member?.children?.length
                ? member.children.join(", ")
                : "—"}
            </span>
          </div>

        </div>


        {/* Documents */}
        <div className="flex flex-col gap-[12px]">
            <div className="text-[20px] font-[700] uppercase">Documents Uploaded</div>{" "}
              {member?.documents?.length? 
              <div className="flex gap-[20px]">
                {member.documents?.map((item,index)=>{
                  return <div key={index} className="flex flex-col gap-[8px] items-center text-[#666666] font-[500]" >
                      <div className="flex items-center overflow-hidden text-center w-[90px] h-[100px] bg-[#E3EEFF] border-2 border-[#E6E6FF] rounded-[10px] text-[14px] text-[#666666] font-[500] relative cursor-pointer" onClick={() => setActiveDoc(item)}>
                        <div className="absolute t-0 l-0 w-[100%] h-[100%] bg-[#0002]"></div>
                        <Image src={item.preview} alt="Preview Image" className="w-[100%] h-[100%] object-cover" width={500} height={500}/>
                      </div>
                      {item.title}
                  </div>
                })}
              </div>
              :
              <div className="flex items-center px-[13px] text-center w-[90px] h-[100px] bg-[#F8F8F8] border-2 border-[#ECECEC] rounded-[10px] text-[14px] text-[#666666] font-[500]">
                No document
              </div>
              }
        </div>

        {/* Nested popup example */}
        {activeDoc && <div className="fixed inset-0 z-[59]" onClick={() => setActiveDoc(null)}></div>}
        {activeDoc && (
          <div
            className="absolute h-[100%] inset-0 bg-black/0 z-[60] flex items-center justify-center "
            onClick={() => setActiveDoc(null)}
          >
            <div
              className="flex flex-col bg-[#111] w-[100%] h-[100%] rounded-[20px] relative p-[40px] flex overflow-scroll"
              onClick={(e) => e.stopPropagation()}
              >
              <div className="actions-nested-popup sticky top-[0px] right-[0px] flex gap-[20px] items-center justify-end">
                {/* Download */}
                <a
                  href={activeDoc.preview}
                  download
                  target="_blank"
                  className="text-[#999999] cursor-pointer"
                >
                  <span className="material-symbols--download-rounded"></span>
                </a>

                 {/* Close */}
                <button
                  onClick={() => setActiveDoc(null)}
                  className="text-[#999999] cursor-pointer"
                >
                  <span className="akar-icons--cross"></span>
                </button>
              </div>
              {/* Image */}
              <div className="image-box flex flex-col gap-[20px] flex-1 items-center justify-center px-[30px] text-[#FFFFFF] font-[500]">
                <Image
                src={activeDoc.preview}
                alt="Document Preview"
                width={500}
                height={500}
                className="w-[100%] object-contain rounded-[12px]"
                />
                {activeDoc.title}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
