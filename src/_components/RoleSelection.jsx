"use client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import {
  ArrowRight,
  BriefcaseBusiness,
  ChartPie,
  Check,
  Landmark,
  Receipt,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import useGlobalLoader from "@/store/useGlobalLoader";

const ROLES = [
  {
    key: "admin",
    title: "Admin",
    description: "Manage events, members, actionables & expenses across your network.",
    icon: ShieldCheck,
    sideIcons: [Users, BriefcaseBusiness],
    tint: "#2563eb",
  },
  {
    key: "financeOfficer",
    title: "Finance Officer",
    description: "Set budgets, review expenses and approve event costing.",
    icon: Wallet,
    sideIcons: [Receipt, Landmark],
    tint: "#059669",
  },
  {
    key: "portfolioOfficer",
    title: "Portfolio Officer",
    description: "Track your portfolio budget, request events & monitor spend.",
    icon: BriefcaseBusiness,
    sideIcons: [ChartPie, TrendingUp],
    tint: "#7c3aed",
  },
];

// Stacked "card" illustration: one main tile with two tilted tiles behind it
const RoleIllustration = ({ role, selected }) => {
  const MainIcon = role.icon;
  const [LeftIcon, RightIcon] = role.sideIcons;

  return (
    <div className="relative h-36 w-full flex items-center justify-center">
      <div
        className={`absolute inset-x-6 inset-y-2 rounded-full blur-2xl transition-opacity duration-300 ${
          selected ? "opacity-60" : "opacity-30"
        }`}
        style={{ background: `radial-gradient(circle, ${role.tint}33 0%, transparent 70%)` }}
      />

      <div className="absolute -translate-x-9 -rotate-[10deg] w-14 h-16 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center">
        <LeftIcon size={20} strokeWidth={1.75} className="text-gray-400" />
      </div>
      <div className="absolute translate-x-9 rotate-[10deg] w-14 h-16 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center">
        <RightIcon size={20} strokeWidth={1.75} className="text-gray-400" />
      </div>

      <div
        className={`relative w-[72px] h-[72px] rounded-2xl bg-white border border-gray-100 shadow-md flex items-center justify-center transition-transform duration-300 ${
          selected ? "scale-110" : "group-hover:scale-105"
        }`}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${role.tint}14` }}
        >
          <MainIcon size={26} strokeWidth={1.75} style={{ color: role.tint }} />
        </div>
      </div>
    </div>
  );
};

const RoleSelection = () => {
  const router = useRouter();
  const { showLoader } = useGlobalLoader.getState();
  const { user } = useSelector((state) => state.auth);
  const network = user?.networkClusterDetails;

  const [selectedRole, setSelectedRole] = useState(null);

  const handleContinue = () => {
    if (!selectedRole) return;

    // UI only for now: the choice isn't saved or used until the backend supports roles.
    // Continue behaves exactly like the old post-OTP redirect.
    showLoader();
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col">
      <header className="px-6 sm:px-10 py-6">
        <Image src="/logo/smart-networks.svg" alt="Smart Networks" width={151} height={37} />
      </header>

      <main className="flex-1 flex flex-col items-center px-4 pt-6 pb-12">
        {network?.name && (
          <div className="mb-6 flex items-center gap-2.5 rounded-full border border-gray-200 bg-gray-50 pl-1.5 pr-4 py-1.5">
            {network.logo ? (
              <img
                src={network.logo}
                alt={network.name}
                className="w-7 h-7 rounded-full object-cover bg-white"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center">
                {network.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-sm font-medium text-[#333]">{network.name}</span>
          </div>
        )}

        <h1 className="text-2xl sm:text-3xl font-semibold text-[#1a1a1a] text-center">
          How would you like to continue{user?.firstname ? `, ${user.firstname}` : ""}?
        </h1>
        <p className="mt-2 text-sm sm:text-base text-gray-500 text-center">
          Choose your role and we&apos;ll tailor your Smart Networks workspace accordingly.
        </p>

        <div
          role="radiogroup"
          aria-label="Select your role"
          className="mt-12 w-full max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-5"
        >
          {ROLES.map((role) => {
            const selected = selectedRole === role.key;
            return (
              <button
                key={role.key}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setSelectedRole(role.key)}
                className={`group relative text-left rounded-2xl border bg-white p-5 pb-7 transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  selected
                    ? "border-blue-600 shadow-lg shadow-blue-100"
                    : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                }`}
              >
                <span
                  className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    selected ? "border-blue-600 bg-blue-600" : "border-gray-300 bg-white"
                  }`}
                >
                  {selected && <Check size={12} strokeWidth={3} className="text-white" />}
                </span>

                <RoleIllustration role={role} selected={selected} />

                <div className="mt-6 text-center">
                  <div className="text-base font-semibold text-[#1a1a1a]">{role.title}</div>
                  <p className="mt-1.5 text-[13px] leading-5 text-gray-500 max-w-[220px] mx-auto">
                    {role.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleContinue}
          disabled={!selectedRole}
          className={`mt-12 h-12 px-10 rounded-full flex items-center gap-2 text-base font-medium text-white transition ${
            selectedRole
              ? "bg-blue-600 hover:bg-blue-700 cursor-pointer"
              : "bg-blue-500/50 cursor-not-allowed"
          }`}
        >
          Continue
          <ArrowRight size={18} />
        </button>
      </main>
    </div>
  );
};

export default RoleSelection;
