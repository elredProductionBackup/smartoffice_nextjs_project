"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
// import logo from "@/assets/logo/logo.svg";
import bell from "@/assets/logo/bell.svg";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@/store/auth/authSlice";
import { ChevronDown, LogOut, UserRound } from "lucide-react";

// "financeOfficer" -> "Finance Officer"
const formatRole = (role = "") =>
  role.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());

const Header = () => {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();

  const { user, adminDetail, selectedRole } = useSelector((state) => state.auth);

  const firstName = adminDetail?.firstname || user?.firstname || "Me";
  const fullName = `${adminDetail?.firstname || user?.firstname || ""} ${adminDetail?.lastname || user?.lastname || ""}`.trim() || firstName;
  const email = adminDetail?.email || user?.email;
  const avatar = adminDetail?.dpURL || user?.dpURL || "/logo/user-icon.svg";
  const network = user?.networkClusterDetails;

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

  if (typeof window === "undefined") return;

  const networkClusterCode = localStorage.getItem("networkClusterCode");

  dispatch(logout());

  setTimeout(() => {
    if (networkClusterCode) {
      router.replace(`/?networkClusterCode=${networkClusterCode}`);
    } else {
      router.replace("/");
    }
  }, 0);
};


  return (
    <>
      <div className="min-h-20 bg-[#F2F7FF] flex items-center justify-between px-[50px]">
        <Image src={'/logo/smart-networks.svg'} alt="logo" width={155} height={40} className="object-contain" />

        {/* Network, notifications and profile share one 40px row */}
        <div className="flex gap-[12px] items-center">
          {/* Network Cluster Details */}
          {network && (
            <div
              title={network.name}
              className="h-[40px] flex items-center gap-[8px] bg-white border border-[#D5E2F6] pl-[5px] pr-[14px] rounded-full"
            >
              {network.logo ? (
                <img
                  src={network.logo}
                  alt={network.name || "Network logo"}
                  className="w-[30px] h-[30px] rounded-full object-cover bg-white"
                />
              ) : (
                <span className="w-[30px] h-[30px] rounded-full bg-[#0B57D0] text-white text-[13px] font-semibold flex items-center justify-center">
                  {(network.name || "N").charAt(0).toUpperCase()}
                </span>
              )}
              <span className="max-w-[180px] truncate font-heading text-[15px] font-[500] text-[#333]">
                {network.name}
              </span>
            </div>
          )}

          {/* Notification */}
          <button
            type="button"
            aria-label="Notifications"
            className="h-[40px] w-[40px] rounded-full bg-white border border-[#D5E2F6] flex items-center justify-center cursor-pointer hover:border-[#0B57D0] transition-colors"
          >
            <Image src={bell} alt="" height={22} width={22} />
          </button>

          {/* Me dropdown */}
          <div ref={meRef} className="relative">
            <button
              type="button"
              onClick={() => setOpen(!open)}
              aria-haspopup="menu"
              aria-expanded={open}
              className={`h-[40px] flex items-center gap-[8px] bg-white border pl-[4px] pr-[10px] rounded-full cursor-pointer transition-colors ${
                open ? "border-[#0B57D0]" : "border-[#D5E2F6] hover:border-[#0B57D0]"
              }`}
            >
              <img
                src={avatar}
                alt=""
                width={32}
                height={32}
                className="w-[32px] h-[32px] rounded-full object-cover bg-[#CCCCCC]"
              />
              <span className="max-w-[120px] truncate text-[15px] font-semibold text-[#333] capitalize">
                {firstName}
              </span>
              <ChevronDown size={16} className={`text-[#777] transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+8px)] z-50 w-[280px] bg-white rounded-[16px] border border-[#EAEEF2] shadow-[0px_4px_16px_0px_#0000001a] overflow-hidden"
              >
                {/* Who is signed in, and as which role */}
                <div className="flex items-center gap-[12px] p-[16px] border-b border-[#EAEEF2]">
                  <img
                    src={avatar}
                    alt=""
                    width={44}
                    height={44}
                    className="w-[44px] h-[44px] rounded-full object-cover bg-[#CCCCCC] shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-[16px] font-semibold text-[#333] capitalize truncate">{fullName}</p>
                    {email && <p className="text-[13px] text-[#777] truncate">{email}</p>}
                    {selectedRole && (
                      <span className="inline-block mt-[4px] px-[8px] py-[1px] rounded-full bg-[#F2F7FF] text-[12px] font-semibold text-[#0B57D0]">
                        {formatRole(selectedRole)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-[6px]">
                  <button
                    role="menuitem"
                    onClick={() => {
                      setOpen(false);
                      router.push("/dashboard/my-profile");
                    }}
                    className="w-full flex items-center gap-[10px] px-[12px] py-[10px] text-[15px] font-semibold text-[#333] rounded-lg cursor-pointer hover:bg-[#F2F7FF] transition-colors"
                  >
                    <UserRound size={18} className="text-[#666]" />
                    My Profile
                  </button>

                  <button
                    role="menuitem"
                    onClick={onLogoutClick}
                    className="w-full flex items-center gap-[10px] px-[12px] py-[10px] text-[15px] font-semibold text-[#E40000] rounded-lg cursor-pointer hover:bg-[#FFEBEB] transition-colors"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
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
