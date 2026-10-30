"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import bell from "@/assets/logo/bell.svg";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { FiMenu } from "react-icons/fi";
import { ArrowLeftRight, Check, ChevronDown, LogOut, UserRound } from "lucide-react";
import { logout, setSelectedRole } from "@/store/auth/authSlice";
import { buildLoginUrl, getStoredClusterCode } from "@/utils/shareLink";
import { ROLE_HOME } from "@/utils/routeAccess";
import useGlobalLoader from "@/store/useGlobalLoader";
import SuccessPopup from "@/_components/ConfirmationPopups/SuccessPopup";

// "financeOfficer" -> "Finance Officer"
const formatRole = (role = "") =>
  role.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());

const Header = ({ onMenuClick }) => {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();

  const { user, adminDetail, selectedRole } = useSelector((state) => state.auth);

  const firstName = adminDetail?.firstname || user?.firstname || "Me";
  const fullName = `${adminDetail?.firstname || user?.firstname || ""} ${adminDetail?.lastname || user?.lastname || ""}`.trim() || firstName;
  const email = adminDetail?.email || user?.email;
  const avatar = adminDetail?.dpURL || user?.dpURL || "/logo/user-icon.svg";
  const network = user?.networkClusterDetails;
  const roles = adminDetail?.role ?? [];

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [rolesOpen, setRolesOpen] = useState(false);
  const [switchedRole, setSwitchedRole] = useState(null);
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

  // Same token works for every role, so switching is just a new selectedRole.
  // Brief loader, then the success popup; OK takes the user to that role's home.
  const handleRoleSwitch = (role) => {
    setOpen(false);
    const { showLoader, hideLoader } = useGlobalLoader.getState();
    showLoader();
    setTimeout(() => {
      dispatch(setSelectedRole(role));
      hideLoader();
      setSwitchedRole(role);
    }, 500);
  };

  const handleSwitchPopupClose = () => {
    const role = switchedRole;
    setSwitchedRole(null);
    router.replace(ROLE_HOME[role] ?? "/dashboard");
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

        {/* Network, notifications and profile share one 40px row */}
        <div className="flex gap-2 md:gap-[12px] items-center shrink-0">
          {/* Network Cluster Details (shown in the drawer on phones) */}
          {network && (
            <div
              title={network.name}
              className="hidden md:flex h-[40px] items-center gap-[8px] bg-white border border-[#D5E2F6] pl-[5px] pr-[14px] rounded-full"
            >
              {network.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={network.logo}
                  alt={network.name || "Network logo"}
                  className="w-[30px] h-[30px] rounded-full object-cover bg-white shrink-0"
                />
              ) : (
                <span className="w-[30px] h-[30px] rounded-full bg-[#0B57D0] text-white text-[13px] font-semibold flex items-center justify-center shrink-0">
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
            className="h-[36px] w-[36px] md:h-[40px] md:w-[40px] rounded-full bg-white border border-[#D5E2F6] flex items-center justify-center cursor-pointer hover:border-[#0B57D0] transition-colors shrink-0"
          >
            <Image src={bell} alt="" height={22} width={22} className="w-5 h-5 md:w-[22px] md:h-[22px]" />
          </button>

          {/* Me dropdown */}
          <div ref={meRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setOpen(!open);
                setRolesOpen(false);
              }}
              aria-label="Account menu"
              aria-haspopup="menu"
              aria-expanded={open}
              className={`h-[36px] md:h-[40px] flex items-center gap-[8px] bg-white border p-[2px] sm:pl-[4px] sm:pr-[10px] rounded-full cursor-pointer transition-colors ${
                open ? "border-[#0B57D0]" : "border-[#D5E2F6] hover:border-[#0B57D0]"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatar}
                alt=""
                width={32}
                height={32}
                className="w-[30px] h-[30px] md:w-[32px] md:h-[32px] rounded-full object-cover bg-[#CCCCCC]"
              />
              {/* Phones: avatar only */}
              <span className="hidden sm:inline max-w-[120px] truncate text-[15px] font-semibold text-[#333] capitalize">
                {firstName}
              </span>
              <ChevronDown
                size={16}
                className={`hidden sm:block text-[#777] transition-transform ${open ? "rotate-180" : ""}`}
              />
            </button>

            {open && (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+8px)] z-50 w-[260px] md:w-[280px] bg-white rounded-[16px] border border-[#EAEEF2] shadow-[0px_4px_16px_0px_#0000001a] overflow-hidden"
              >
                {/* Who is signed in, and as which role */}
                <div className="flex items-center gap-[12px] p-[16px] border-b border-[#EAEEF2]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
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

                  {/* Only users with more than one role can switch */}
                  {roles.length > 1 && (
                    <>
                      <button
                        role="menuitem"
                        aria-expanded={rolesOpen}
                        onClick={() => setRolesOpen((o) => !o)}
                        className="w-full flex items-center gap-[10px] px-[12px] py-[10px] text-[15px] font-semibold text-[#333] rounded-lg cursor-pointer hover:bg-[#F2F7FF] transition-colors"
                      >
                        <ArrowLeftRight size={18} className="text-[#666]" />
                        Switch Role
                        <ChevronDown
                          size={16}
                          className={`ml-auto text-[#777] transition-transform ${rolesOpen ? "rotate-180" : ""}`}
                        />
                      </button>

                      {rolesOpen && (
                        <ul role="listbox" className="mb-[4px] ml-[28px] border-l border-[#EAEEF2] pl-[6px]">
                          {roles.map((role) => {
                            const active = role === selectedRole;
                            return (
                              <li key={role}>
                                <button
                                  type="button"
                                  role="option"
                                  aria-selected={active}
                                  onClick={() => (active ? setRolesOpen(false) : handleRoleSwitch(role))}
                                  className={`w-full flex items-center justify-between gap-3 px-[12px] py-[8px] text-left text-[14px] rounded-lg cursor-pointer transition-colors ${
                                    active ? "text-[#0B57D0] font-bold bg-[#F2F7FF]" : "text-[#333] font-semibold hover:bg-[#F2F7FF]"
                                  }`}
                                >
                                  {formatRole(role)}
                                  {active && <Check size={16} />}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </>
                  )}

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

      <SuccessPopup
        isOpen={!!switchedRole}
        title="Role switched"
        message={`You're now using Smart Networks as ${formatRole(switchedRole ?? "")}.`}
        onClose={handleSwitchPopupClose}
      />
    </>
  );
};

export default Header;
