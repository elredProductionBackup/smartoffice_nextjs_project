import Image from "next/image";
import Link from "next/link";

export default function AlliancesTable({ data = [], search = "", tab, subtitleLabel = "" }) {
  const isSearching = search?.length >= 3;
  const isEmpty = data.length === 0;

  return (
    <div className="flex-1 min-h-0 mt-[20px] rounded-[20px] bg-[#F2F7FF] overflow-y-auto relative flex flex-col">

      {/* Table Header */}
      <div className="flex items-center font-bold text-lg text-[#333333] px-[30px] sticky top-0 bg-[#F2F7FF] py-3 pt-6 z-10">
        <div className="flex-3">Name/{subtitleLabel}</div>
        <div className="flex-1">Actions</div>
      </div>

      {/* Empty State */}
      {isEmpty && (
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
            className={`
              flex flex-1 items-center py-[20px] px-[30px]
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
            <div className="flex flex-1 gap-4 text-[#666666]">
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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
