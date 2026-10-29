"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import bell from "@/assets/logo/bell.svg";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { FiMenu } from "react-icons/fi";
import { logout } from "@/store/auth/authSlice";
import { buildLoginUrl, getStoredClusterCode } from "@/utils/shareLink";

const Header = ({ onMenuClick }) => {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();

  const { user, adminDetail } = useSelector((state) => state.auth);

  const firstName = adminDetail?.firstname || user?.firstname || "Me";
  const avatar = adminDetail?.dpURL || user?.dpURL || "/logo/user-icon.svg";

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const meRef = useRef(null);
  const router = useRouter();

  // close dropdown on outside click / tap
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (meRef.current && !meRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const onLogoutClick = () => {
    setOpen(false);
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);

    // Read before logout() clears it, so the login page opens on the same cluster
    const networkClusterCode = getStoredClusterCode();

    dispatch(logout());

    setTimeout(() => {
      router.replace(buildLoginUrl({ clusterCode: networkClusterCode }));
    }, 0);
  };

  return (
    <>
      <header className="h-15 md:h-auto md:min-h-20 shrink-0 bg-[#F2F7FF] flex items-center justify-between gap-3 px-3 sm:px-5 md:px-[50px]">
        <div className="flex items-center gap-1.5 min-w-0">
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              aria-label="Open menu"
              className="md:hidden h-10 w-10 flex items-center justify-center rounded-full text-[#333] hover:bg-white/70 cursor-pointer shrink-0"
            >
              <FiMenu className="text-[22px]" />
            </button>
          )}
          <Image
            src="/logo/smart-networks.svg"
            alt="Smart Networks"
            width={155}
            height={40}
            priority
            className="object-contain w-[118px] h-auto md:w-[155px]"
          />
        </div>

        <div className="flex gap-3 sm:gap-5 md:gap-[30px] items-center shrink-0">
          {/* Network Cluster Details (shown in the drawer on phones) */}
          {user?.networkClusterDetails && (
            <div className="hidden md:flex items-center gap-[10px] bg-white border border-[#D5E2F6] px-[16px] py-[6px] rounded-full shadow-sm max-w-[320px]">
              {user.networkClusterDetails.logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.networkClusterDetails.logo}
                  alt={user.networkClusterDetails.name || "Network logo"}
                  className="w-[28px] h-[28px] rounded-full object-cover shrink-0"
                />
              )}
              <span className="font-heading text-[16px] font-[500] text-[#333] truncate">
                {user.networkClusterDetails.name}
              </span>
            </div>
          )}

          {/* Notification */}
          <div className="flex gap-[10px] items-center cursor-pointer">
            <Image src={bell} alt="Notifications" height={32} width={32} className="w-7 h-7 md:w-8 md:h-8" />
          </div>

          {/* Me dropdown */}
          <div ref={meRef} className="relative">
            <button
              type="button"
              onClick={() => setOpen(!open)}
              aria-label="Account menu"
              aria-expanded={open}
              className="flex items-center gap-[10px] text-xl font-medium cursor-pointer"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatar}
                alt=""
                width={32}
                height={32}
                className="w-[32px] h-[32px] rounded-full object-cover"
              />
            </button>

            {open && (
              <div className="absolute right-0 md:right-[10px] top-[calc(100%+14px)] z-50">
                {/* Triangle */}
                <div className="absolute -top-[8px] right-[8px] md:right-[40px] w-0 h-0
                  border-l-[8px] border-l-transparent
                  border-r-[8px] border-r-transparent
                  border-b-[8px] border-b-white"
                />

                {/* Dropdown */}
                <div className="w-[220px] md:w-[250px] bg-white rounded-[20px] p-[14px] md:p-[20px]
                  shadow-[0px_4px_4px_0px_#99999940]">
                  <div className="flex flex-col gap-[10px]">
                    <button
                      onClick={() => {
                        setOpen(false);
                        router.push("/dashboard/my-profile");
                      }}
                      className="flex items-center gap-[6px] py-[8px] pl-[12px] text-[18px] md:text-[20px] text-[#333] rounded-lg cursor-pointer capitalize text-left min-w-0"
                    >
                      <span className="h-[30px] w-[30px] rounded-full bg-[#CCCCCC] flex items-center justify-center shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={avatar} alt="" width={30} height={30} className="w-[30px] h-[30px] rounded-full object-cover" />
                      </span>
                      <span className="truncate">{firstName}</span>
                    </button>

                    <button
                      onClick={onLogoutClick}
                      className="flex items-center gap-[6px] py-[8px] pl-[12px] text-[18px] md:text-[20px] text-[#333] rounded-lg cursor-pointer"
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
      </header>

      {/* Fullscreen Logout Confirmation */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
          <div className="flex flex-col gap-8 md:gap-[45px] items-center bg-white w-full max-w-[480px] rounded-[20px] py-8 md:py-[40px] px-[20px]">
            <h2 className="text-[20px] md:text-[24px] font-[700] text-[#333] pt-4 md:pt-[30px] md:w-[60%] text-center">
              Are you sure you want to logout?
            </h2>
            <div className="flex justify-center gap-4 sm:gap-[80px]">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-[30px] py-[8px] rounded-[100px] text-[18px] md:text-[20px] font-[500] text-[#fff] bg-[#999999] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-[30px] py-[8px] rounded-[100px] text-[18px] md:text-[20px] font-[500] text-[#fff] bg-[linear-gradient(95.15deg,#5597ED_3.84%,#00449C_96.38%)] cursor-pointer"
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
