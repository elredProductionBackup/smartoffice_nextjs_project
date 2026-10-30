import Link from "next/link";

// Read-only details popup for a vendor or resource (opened by clicking a row)
export default function AllianceDetailsModal({ item, subtitleLabel = "", showLinkedin = false, onClose }) {
  const phoneDigits = item.phone?.replace(/[^0-9]/g, "");

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-[650px] max-h-[90dvh] md:max-h-[90vh] rounded-[20px] p-6 md:p-[40px] relative flex flex-col gap-6 md:gap-[30px] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute h-8 w-8 md:h-[24px] md:w-[24px] bg-[#EEEEEE] rounded-full right-5 top-5 md:right-[40px] md:top-[40px] grid place-items-center cursor-pointer"
        >
          <span className="akar-icons--cross small-cross"></span>
        </button>

        {/* Header */}
        <div className="flex flex-col gap-4 md:gap-[20px] items-start">
          <div className="min-w-[80px] h-[80px] text-[34px] md:min-w-[100px] md:h-[100px] md:text-[42px] bg-[#D4DFF1] grid place-items-center font-semibold rounded-full uppercase">
            {item.name?.slice(0, 1)}
          </div>

          <div className="w-full flex flex-col items-start gap-[6px]">
            <div className="w-full flex items-center justify-between gap-4">
              <h2 className="text-[24px] md:text-[32px] text-[#333333] font-semibold break-words min-w-0">
                {item.name}
              </h2>
              {phoneDigits && (
                <Link
                  href={`https://wa.me/${phoneDigits}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Chat on WhatsApp"
                  className="cursor-pointer"
                >
                  <span className="logos--whatsapp-icon"></span>
                </Link>
              )}
            </div>
            <p className="text-[16px] md:text-[20px] text-[#666666] font-medium capitalize">
              {item.subtitle || `No ${subtitleLabel.toLowerCase()}`}
            </p>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6 md:gap-y-[40px] text-base text-[#333333]">
          <div className="flex flex-col gap-[12px] min-w-0">
            <span className="text-[18px] md:text-[20px] font-bold uppercase">Email</span>
            <span className="flex gap-[8px] text-[#666666] text-[16px] font-semibold">
              <span className="min-w-[24px] h-[24px] rounded-full bg-[#E6EBF2] grid place-items-center">
                <span className="oui--email small-icon"></span>
              </span>
              {item.email ? (
                <Link href={`mailto:${item.email}`} className="break-all hover:underline">
                  {item.email}
                </Link>
              ) : (
                "—"
              )}
            </span>
          </div>

          <div className="flex flex-col gap-[12px] min-w-0">
            <span className="text-[18px] md:text-[20px] font-bold uppercase">Phone</span>
            <span className="flex gap-[8px] text-[#666666] text-[16px] font-semibold">
              <span className="min-w-[24px] h-[24px] rounded-full bg-[#E6EBF2] grid place-items-center">
                <span className="proicons--call small-icons"></span>
              </span>
              {item.phone ? (
                <Link href={`tel:${item.phone}`} className="hover:underline">
                  {item.phone}
                </Link>
              ) : (
                "—"
              )}
            </span>
          </div>

          {showLinkedin && (
            <div className="sm:col-span-2 flex flex-col gap-[12px] min-w-0">
              <span className="text-[18px] md:text-[20px] font-bold uppercase">LinkedIn</span>
              <span className="text-[16px] font-semibold text-[#666666]">
                {item.linkedInUrl ? (
                  <Link
                    href={item.linkedInUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#00449C] break-all hover:underline"
                  >
                    {item.linkedInUrl}
                  </Link>
                ) : (
                  "—"
                )}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
