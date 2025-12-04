import Image from "next/image";
import logo from "@/assets/logo/logo.svg";
import bell from "@/assets/logo/bell.svg";
import user from "@/assets/image/user.jpeg";

const Header = () => {
  return (
    <div className="h-20 bg-[#F2F7FF] flex items-center justify-between px-[50px]">
      <Image src={logo} alt="logo" width={96} height={40}/>
      <div className="flex gap-10">
        <div className="flex gap-[10px] items-center cursor-pointer">
            <Image src={bell} alt=""/>
            <div className="text-xl font-medium">Notification</div>
        </div>
        <div className="flex items-center gap-[10px] text-xl font-medium cursor-pointer">
            <Image src={user} alt="" width={40} height={40} className="rounded-full"/>
            <div>Me</div>
         </div>
      </div>
    </div>
  );
};

export default Header;
