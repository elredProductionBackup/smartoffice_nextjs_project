"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { FiMail, FiPhone, FiBriefcase, FiShield, FiHash, FiCopy, FiCheck, FiArrowLeft, FiChevronDown } from "react-icons/fi";
import { setSelectedRole } from "@/store/auth/authSlice";
import { useOutsideClick } from "@/hooks/useOutsideClick";
import { ROLE_HOME } from "@/utils/routeAccess";
import useGlobalLoader from "@/store/useGlobalLoader";
import SuccessPopup from "@/_components/ConfirmationPopups/SuccessPopup";

// "financeOfficer" -> "Finance Officer"
const formatRole = (role = "") =>
  role
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());

const capitalize = (str = "") => str.charAt(0).toUpperCase() + str.slice(1);

const InfoRow = ({ icon: Icon, label, value, copyable = false }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  return (
    <div className="flex items-center gap-4 py-4 border-b border-[#EAEEF2] last:border-b-0">
      <div className="w-[42px] h-[42px] rounded-xl bg-[#F2F7FF] text-[#0B57D0] flex items-center justify-center shrink-0">
        <Icon className="text-xl" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] text-[#777777]">{label}</p>
        <p className="text-[18px] font-semibold text-[#333333] break-words">{value || "—"}</p>
      </div>
      {copyable && value && (
        <button
          onClick={handleCopy}
          title={copied ? "Copied" : "Copy"}
          className={`flex items-center gap-1.5 h-9 px-3 rounded-full text-[14px] font-semibold cursor-pointer transition-colors shrink-0 ${
            copied ? "bg-[#E7F7EE] text-[#16a34a]" : "bg-[#F2F7FF] text-[#0B57D0] hover:bg-[#D3E3FD]"
          }`}
        >
          {copied ? <FiCheck /> : <FiCopy />}
          {copied ? "Copied" : "Copy"}
        </button>
      )}
    </div>
  );
};

// Current role next to the name. With more than one role it opens a menu to switch roles.
const RoleSwitcher = ({ roles, selectedRole, onSwitch }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useOutsideClick(ref, close);

  const pillClass =
    "inline-flex items-center gap-2 h-10 px-4 rounded-full bg-white border border-[#D4DFF1] text-[15px] font-semibold text-[#333333] shadow-[0px_1px_4px_0px_#0000000d]";

  if (roles.length <= 1) {
    return roles[0] ? <span className={pillClass}>{formatRole(roles[0])}</span> : null;
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`${pillClass} cursor-pointer hover:border-[#0B57D0] transition-colors`}
      >
        {formatRole(selectedRole)}
        <FiChevronDown className={`text-[16px] text-[#777777] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 top-full mt-2 z-20 min-w-[200px] rounded-xl bg-white border border-[#EAEEF2] shadow-[0px_4px_16px_0px_#0000001a] py-1.5"
        >
          {roles.map((role) => {
            const active = role === selectedRole;
            return (
              <li key={role}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    close();
                    if (!active) onSwitch(role);
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left text-[15px] cursor-pointer transition-colors ${
                    active ? "text-[#0B57D0] font-bold bg-[#F2F7FF]" : "text-[#333333] font-semibold hover:bg-[#F2F7FF]"
                  }`}
                >
                  {formatRole(role)}
                  {active && <FiCheck />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

const MyProfilePage = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, adminDetail, selectedRole } = useSelector((state) => state.auth);

  const profile = adminDetail || user || {};
  const fullName =
    `${profile.firstname || ""} ${profile.lastname || ""}`.trim() || "—";
  const titles = (profile.title || []).map((t) => capitalize(t.value)).filter(Boolean);
  const roleKeys = profile.role || [];
  const roles = roleKeys.map(formatRole);

  const [switchedRole, setSwitchedRole] = useState(null);

  // Same token works for every role, so switching is just a new selectedRole.
  // Brief loader, then the success popup; OK takes the user to that role's home.
  const handleRoleSwitch = (role) => {
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
  const networkClusterCode =
    user?.networkClusterDetails?.networkClusterCode ||
    (typeof window !== "undefined" ? localStorage.getItem("networkClusterCode") : "");

  return (
    <div className="p-6 bg-white font-nunito">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push("/dashboard/profile")}
          aria-label="Back"
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#333333] hover:bg-[#F2F7FF] cursor-pointer transition-colors shrink-0"
        >
          <FiArrowLeft className="text-2xl" />
        </button>
        <div>
          <h2 className="font-heading text-[32px] leading-[136%] font-bold text-[#333333] mb-1">My Profile</h2>
          <p className="text-[#777777] font-medium text-[18px] leading-[136%]">Your account details</p>
        </div>
      </div>

      <div className="max-w-[800px] mx-auto">

      <div className="rounded-[22px] bg-white border border-[#EAEEF2] p-6 md:p-8">
        <div className="flex items-center gap-5 pb-6 border-b border-[#EAEEF2]">
          <img
            src={profile.dpURL || "/logo/user-icon.svg"}
            alt={fullName}
            width={96}
            height={96}
            className="w-[96px] h-[96px] rounded-full object-cover bg-[#CCCCCC] border border-[#D4DFF1]"
          />
          <div className="min-w-0 flex-1">
            <h3 className="text-[26px] font-bold text-[#333333] capitalize">{fullName}</h3>
            {titles.length > 0 && (
              <p className="text-[16px] text-[#666666]">{titles.join(" | ")}</p>
            )}
          </div>
          <div className="shrink-0">
            <RoleSwitcher roles={roleKeys} selectedRole={selectedRole} onSwitch={handleRoleSwitch} />
          </div>
        </div>

        <div className="pt-2">
          <InfoRow icon={FiMail} label="Email" value={profile.email} />
          <InfoRow icon={FiPhone} label="Phone" value={profile.phone} />
          <InfoRow icon={FiBriefcase} label="Company" value={profile.companyName} />
          <InfoRow icon={FiShield} label="Role" value={roles.join(", ")} />
          <InfoRow icon={FiHash} label="Network Cluster Code" value={networkClusterCode} copyable />
        </div>
      </div>
      </div>

      <SuccessPopup
        isOpen={!!switchedRole}
        title="Role switched"
        message={`You're now using Smart Networks as ${formatRole(switchedRole ?? "")}.`}
        onClose={handleSwitchPopupClose}
      />
    </div>
  );
};

export default MyProfilePage;
