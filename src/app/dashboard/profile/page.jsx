import Image from "next/image";
import searchIcon from "@/assets/logo/search.svg";

export default function ProfilePage() {
  return (
    <div>
      <div className="mx-50 mt-5">
        {/* SAME size wrapper, just relative for icon */}
        <div className="relative border outline-none w-full h-15 border-[#E1E2E6] bg-[#F2F6FC] rounded-full px-6">

          {/* icon inside input */}
          <Image
            src={searchIcon}
            alt="search"
            className="absolute left-6 top-1/2 -translate-y-1/2"
          />

          {/* input with left padding for icon */}
          <input
            type="text"
            className="w-full h-full bg-transparent pl-10 focus:outline-none text-base font-medium placeholder:text-[#666666] text-[#333]"
            placeholder="Who may come handy to me ?"
          />
        </div>
      </div>
    </div>
  );
}
