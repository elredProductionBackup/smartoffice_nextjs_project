"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { FiMail, FiPhone, FiBriefcase, FiShield, FiHash, FiCopy, FiCheck, FiArrowLeft } from "react-icons/fi";

// "financeManager" -> "Finance Manager"
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

const MyProfilePage = () => {
  const router = useRouter();
  const { user, adminDetail } = useSelector((state) => state.auth);

  const profile = adminDetail || user || {};
  const fullName =
    `${profile.firstname || ""} ${profile.lastname || ""}`.trim() || "—";
  const titles = (profile.title || []).map((t) => capitalize(t.value)).filter(Boolean);
  const roles = (profile.role || []).map(formatRole);
  const networkClusterCode =
    user?.networkClusterDetails?.networkClusterCode ||
    (typeof window !== "undefined" ? localStorage.getItem("networkClusterCode") : "");

  return (
    <div className="p-6 bg-white font-nunito">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          aria-label="Back"
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#333333] hover:bg-[#F2F7FF] cursor-pointer transition-colors shrink-0"
        >
          <FiArrowLeft className="text-2xl" />
        </button>
        <div>
          <h2 className="text-[32px] leading-[136%] font-bold text-[#333333] mb-1">My Profile</h2>
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
          <div>
            <h3 className="text-[26px] font-bold text-[#333333] capitalize">{fullName}</h3>
            {titles.length > 0 && (
              <p className="text-[16px] text-[#666666]">{titles.join(" | ")}</p>
            )}
            {roles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {roles.map((r) => (
                  <span
                    key={r}
                    className="inline-flex items-center h-7 px-3 rounded-full bg-[#D3E3FD] text-[13px] font-bold text-[#0B57D0]"
                  >
                    {r}
                  </span>
                ))}
              </div>
            )}
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
    </div>
  );
};

export default MyProfilePage;
