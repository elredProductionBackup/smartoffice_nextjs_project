"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
// import logo from "@/assets/logo/logo.svg";
import bell from "@/assets/logo/bell.svg";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@/store/auth/authSlice";

const Header = () => {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);

  const firstName = user?.firstname ?? "Me";

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const meRef = useRef(null);
  const router = useRouter();
  // close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (meRef.current && !meRef.current.contains(e.target )) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const onLogoutClick = () => {
    setOpen(false);
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);

    const networkClusterCode =
      typeof window !== "undefined"
        ? localStorage.getItem("networkClusterCode")
        : null;

    dispatch(logout());

    if (networkClusterCode) {
      router.push(`/?networkClusterCode=${networkClusterCode}`);
    } else {
      router.push("/");
    }
  };


  return (
    <>
      <div className="min-h-20 bg-[#F2F7FF] flex items-center justify-between px-[50px]">
        <Image src={'/logo/smart-networks.svg'} alt="logo" width={155} height={40} className="object-contain" />

        <div className="flex gap-10">
          {/* Notification */}
          <div className="flex gap-[10px] items-center cursor-pointer">
            <Image src={bell} alt="bell" />
            <div className="text-xl font-medium">Notification</div>
          </div>

          {/* Me dropdown */}
          <div ref={meRef} className="relative">
            <div
              onClick={() => setOpen(!open)}
              className="flex items-center gap-[10px] text-xl font-medium cursor-pointer"
            >
              <Image
                src="/logo/user-icon.svg"
                alt="user"
                width={40}
                height={40}
                className="rounded-full"
              />
              <div>Me</div>
            </div>

            {open && (
              <div className="absolute right-[10px] top-[calc(100%+14px)] z-50">
                {/* Triangle */}
                <div className="absolute -top-[8px] right-[40px] w-0 h-0
                  border-l-[8px] border-l-transparent
                  border-r-[8px] border-r-transparent
                  border-b-[8px] border-b-white"
                />

                {/* Dropdown */}
                <div className="w-[250px] bg-white rounded-[20px] p-[20px]
                  shadow-[0px_4px_4px_0px_#99999940]">
                  <div className="flex flex-col gap-[10px]">
                    <button className="flex gap-[6px] py-[8px] pl-[12px] text-[20px] text-[#333] rounded-lg cursor-pointer capitalize">
                      <span className="h-[30px] w-[30px] rounded-full bg-[#CCCCCC] flex items-center justify-center">
                        <Image src="/logo/user-icon.svg" alt="" width={30} height={30} />
                      </span>
                      {firstName}
                    </button>

                    <button
                      onClick={onLogoutClick}
                      className="flex gap-[6px] py-[8px] pl-[12px] text-[20px] text-[#333] rounded-lg cursor-pointer"
                    >
                      <Image src="/logo/logout-icon.svg" alt="" width={30} height={30} />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ Fullscreen Logout Confirmation */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
          <div className="flex flex-col gap-[45px] items-center bg-white w-[480px] rounded-[20px] py-[40px] px-[20px]
            ">
            
            <h2 className="text-[24px] font-[700] text-[#333] pt-[30px] w-[60%] text-center">
              Are you sure you want to logout?
            </h2>
            <div className="flex justify-center gap-[80px]">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-[30px] py-[8px] rounded-[100px] text-[20px] font-[500] text-[#fff] bg-[#999999] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-[30px] py-[8px] rounded-[100px] text-[20px] font-[500] text-[#fff] bg-[linear-gradient(95.15deg,#5597ED_3.84%,#00449C_96.38%)] cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
