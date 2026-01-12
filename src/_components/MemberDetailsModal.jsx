import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const MembersDetailsShimmer = () => {
  return (
    <>
      {/* Close button shimmer */}
      <div className="absolute right-[40px] top-[40px] h-[24px] w-[24px] rounded-full bg-[#D4DFF1] animate-pulse" />

      {/* Header */}
      <div className="flex flex-col gap-[20px] items-start animate-pulse">
        {/* Avatar */}
        <div className="w-[100px] h-[100px] rounded-full bg-[#D4DFF1]" />

        {/* Name + title */}
        <div className="w-full flex flex-col gap-[10px]">
          <div className="flex items-center justify-between">
            <div className="h-[32px] w-[220px] rounded bg-[#D4DFF1]" />
            <div className="h-[24px] w-[24px] rounded-full bg-[#D4DFF1]" />
          </div>

          <div className="h-[20px] w-[180px] rounded bg-[#D4DFF1]" />

          {/* Location */}
          <div className="flex items-center gap-[8px]">
            <div className="h-[24px] w-[24px] rounded-full bg-[#D4DFF1]" />
            <div className="h-[16px] w-[160px] rounded bg-[#D4DFF1]" />
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-x-10 gap-y-[40px] animate-pulse">
        {/* Email */}
        <div className="flex flex-col gap-[12px]">
          <div className="h-[20px] w-[80px] rounded bg-[#D4DFF1]" />
          <div className="flex items-center gap-[8px]">
            <div className="h-[24px] w-[24px] rounded-full bg-[#D4DFF1]" />
            <div className="h-[16px] w-[180px] rounded bg-[#D4DFF1]" />
          </div>
        </div>

        {/* Phone */}
        <div className="flex flex-col gap-[12px] justify-self-end w-[230px]">
          <div className="h-[20px] w-[80px] rounded bg-[#D4DFF1]" />
          <div className="flex items-center gap-[8px]">
            <div className="h-[24px] w-[24px] rounded-full bg-[#D4DFF1]" />
            <div className="h-[16px] w-[140px] rounded bg-[#D4DFF1]" />
          </div>
        </div>

        {/* Spouse */}
        <div className="flex flex-col gap-[12px]">
          <div className="h-[20px] w-[130px] rounded bg-[#D4DFF1]" />
          <div className="h-[16px] w-[160px] rounded bg-[#D4DFF1]" />
        </div>

        {/* Children */}
        <div className="flex flex-col gap-[12px] justify-self-end w-[230px]">
          <div className="h-[20px] w-[150px] rounded bg-[#D4DFF1]" />
          <div className="h-[16px] w-[180px] rounded bg-[#D4DFF1]" />
        </div>
      </div>

      {/* Documents */}
      <div className="flex flex-col gap-[12px] animate-pulse">
        <div className="h-[20px] w-[200px] rounded bg-[#D4DFF1]" />

        <div className="flex gap-[20px]">
          {[1, 2, 3].map((_, i) => (
            <div key={i} className="flex flex-col gap-[8px] items-center">
              <div className="w-[90px] h-[100px] rounded-[10px] bg-[#D4DFF1]" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
};



export default function MemberDetailsModal({ member, onClose }) {
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const tooltipRef = useRef(null);

  // const [avatarLoaded, setAvatarLoaded] = useState(false);
  const [activeDoc, setActiveDoc] = useState(null);

  const formatLocation = (location) => {
    if (!location) return "";
    const { city, state, country } = location;
    return [city, state, country].filter(Boolean).join(", ");
  };

  const formattedTitles = member?.title?.map(t => t.value[0].toUpperCase() + t.value.slice(1)) || [];
  const display = formattedTitles.length <= 2
    ? formattedTitles.join(" | ")
    : `${formattedTitles.slice(0, 2).join(" | ")} | +${formattedTitles.length - 2}`;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target)) {
        setTooltipOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white w-[650px] rounded-[20px] p-[40px] relative flex flex-col gap-[40px]" onClick={(e) => e.stopPropagation()}>

        {/* {!avatarLoaded && member.avatar && <MembersDetailsShimmer/>} */}

        {/* {avatarLoaded && <> */}
        <button
          onClick={onClose}
          className="absolute h-[24px] w-[24px] bg-[#EEEEEE] rounded-full right-[40px] top-[40px] grid place-items-center cursor-pointer"
        >
          <span className="akar-icons--cross small-cross"></span>
        </button>

        {/* Header */}
        <div className="flex flex-col gap-[20px] items-start">
          {member.avatar ? <Image src={member.avatar} alt="" width={100} height={100}
            className="rounded-full max-h-[100]" />:
            <div className="min-w-[100px] h-[100px] bg-[#D4DFF1] grid place-items-center text-[42px] font-[600] rounded-full">{member.name?.slice(0,1)}</div>}

          <div className="w-[100%] flex flex-col items-start gap-[6px]">
            <div className="w-[100%] flex items-center justify-between">
              <h2 className="text-[32px] text-[#333333] font-[600]">{member.name}</h2>
              {/* <span className="logos--whatsapp-icon"></span> */}
                <Link
                    href={`https://wa.me/${member?.phone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    title="Chat on WhatsApp"
                    className="cursor-pointer"
                  >
                    <span className="logos--whatsapp-icon"></span>
                  </Link>
            </div>
                  {/* Title tool tip  */}
                  <div className="relative flex"  ref={tooltipRef}>
                    <p
                      className={`text-[20px] text-[#666666] font-[500] capitalize ${formattedTitles.length > 2 && 'cursor-pointer'}`}
                      onClick={() => setTooltipOpen(prev => !prev)}
                    >
                      {display}
                    </p>

                    {tooltipOpen && formattedTitles.length > 2 && (
                      <div className="absolute z-50 w-max min-w-[200px] bg-[#ffffff] text-[#333] text-[16px] font-[500] p-[10px] rounded-[20px] whitespace-nowrap top-[100%] right-[0%] flex flex-col gap-[4px] mt-1" style={{boxShadow: `0px 4px 4px 0px #99999940`}} >
                        {formattedTitles.map((title, index) => {
                          return (
                            <div key={index} className={`pl-[12px] h-[30px] w-[180px] `}>
                              {title}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

              {formatLocation(member.location) && (
                  <div className="flex items-center gap-[8px] text-[16px] text-[#666666] font-[600]">
                    <span className="h-[24px] w-[24px] rounded-full bg-[#E6EBF2] grid place-items-center">
                      <span className="weui--location-outlined"></span>
                    </span>
                    {formatLocation(member.location)}
                  </div>
                )}
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
                ? member.children.map(child => child.name).join(", ")
                : "—"}
            </span>
          </div>

        </div>


        {/* Documents */}
        <div className="flex flex-col gap-[12px]">
            <div className="text-[20px] font-[700] uppercase">Documents Uploaded</div>{" "}
          {member?.documents?.length ? (
            <div className="flex gap-[20px]">
              {member.documents.map((item, index) => {
                const imageSrc =
                  item.docType === "pdf" ? item?.pdfPreview : item?.fileUrl;

                const hasImage = imageSrc && imageSrc.trim() !== "";

                return (
                  <div
                    key={index}
                    className="flex flex-col gap-[8px] items-center text-[#666666] font-[500] capitalize"
                  >
                    <div
                      className="flex items-center justify-center overflow-hidden text-center w-[90px] h-[100px] bg-[#E3EEFF] border-2 border-[#E6E6FF] rounded-[10px] text-[14px] text-[#666666] font-[500] relative cursor-pointer"
                      onClick={() => hasImage && setActiveDoc(item)}
                    >
                      <div className="absolute top-0 left-0 w-full h-full bg-[#0002]"></div>

                      {hasImage ? (
                        <Image
                          src={imageSrc}
                          alt="Preview Image"
                          className="w-full h-full object-cover"
                          width={500}
                          height={500}
                        />
                      ) : (
                        <span className="z-10 text-[12px] text-[#333] ">
                          No Image Found
                        </span>
                      )}
                    </div>
                    {item.docType}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center px-[13px] text-center w-[90px] h-[100px] bg-[#F8F8F8] border-2 border-[#ECECEC] rounded-[10px] text-[14px] text-[#666666] font-[500]">
              No document
            </div>
          )}

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
               {/* <a
                  href={activeDoc.fileUrl}
                  target="_blank"
                  download
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="text-[#333] bg-[#EEEEEE] cursor-pointer flex items-center justify-center rounded-full h-[35px] w-[35px]"
                  title="Download file"
                >
                  <span className="material-symbols--download-rounded"></span>
                </a> */}
                <a
                  href={`/api/download?fileUrl=${encodeURIComponent(activeDoc.fileUrl)}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-[#333] bg-[#EEEEEE] cursor-pointer flex items-center justify-center rounded-full h-[35px] w-[35px]"
                  title="Download file"
                >
                  <span className="material-symbols--download-rounded"></span>
                </a>



                 {/* Close */}
                <button
                  onClick={() => setActiveDoc(null)}
                  className="text-[#333] bg-[#EEEEEE] cursor-pointer flex items-center justify-center rounded-full h-[35px] w-[35px]"
                >
                  <span className="akar-icons--cross"></span>
                </button>
              </div>
              {/* Image */}
              <div className="image-box flex flex-col gap-[20px] flex-1 items-center justify-center px-[30px] text-[#FFFFFF] font-[500]">
                <Image
                src={activeDoc.fileUrl}
                alt="Document Preview"
                width={500}
                height={500}
                className="w-[100%] object-contain rounded-[12px]"
                />
                {activeDoc.docType}
              </div>
            </div>
          </div>
        )}
        {/* </>} */}
      </div>
    </div>
  );
}
