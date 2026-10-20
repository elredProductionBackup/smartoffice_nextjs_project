"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import {
  FiEdit2,
  FiMoreVertical,
  FiSearch,
  FiSend,
  FiShield,
  FiUserCheck,
  FiUserPlus,
  FiUserX,
  FiXCircle,
} from "react-icons/fi";
import { PORTFOLIO_INITIALS, ROLES, STATUS } from "./constants";
import ChangeRoleModal from "./ChangeRoleModal";
import InviteUserModal from "./InviteUserModal";
import UserDetailsModal from "./UserDetailsModal";

// Dummy users until the user management API is wired in
const CURRENT_USER_ID = "u1";

const DUMMY_USERS = [
  { id: "u1", name: "Nandini Handa", email: "nandini@prive.network", roles: ["admin"], portfolios: [], whatsapp: "+91 98100 11223", status: "active", openApprovals: 1, color: "#1D72E8" },
  { id: "u7", name: "Aditi Rao", email: "aditi@prive.network", roles: ["portfolio"], portfolios: ["Learning", "Retreat"], whatsapp: "+91 98860 23419", status: "active", openApprovals: 0, color: "#EA580C" },
  { id: "u8", name: "Karan Shah", email: "karan@prive.network", roles: ["portfolio"], portfolios: ["Engagement"], whatsapp: "+91 98190 66204", status: "active", openApprovals: 0, color: "#4F46E5" },
  { id: "u6", name: "Meezan", email: "meezan@prive.network", roles: ["portfolio"], portfolios: ["Learning", "Forum"], whatsapp: "+91 97110 55021", status: "active", openApprovals: 0, color: "#0E8FA8" },
  { id: "u4", name: "Priya Nair", email: "priya@prive.network", roles: ["finance"], portfolios: [], whatsapp: "+91 98450 77310", status: "active", openApprovals: 1, color: "#DB2777" },
  { id: "u2", name: "Rahul Mehta", email: "rahul@prive.network", roles: ["admin", "finance"], portfolios: [], whatsapp: "+91 98200 44510", status: "active", openApprovals: 0, color: "#16A34A" },
  { id: "u3", name: "SG", email: "sg@prive.network", roles: ["finance"], portfolios: [], whatsapp: "+91 99300 18822", status: "active", openApprovals: 2, color: "#7C3AED" },
  { id: "u9", name: "Sneha Kapoor", email: "sneha@prive.network", roles: ["portfolio"], portfolios: ["Membership", "Spouse Partner Forum"], whatsapp: "+91 98710 90433", status: "active", openApprovals: 0, color: "#0D9488" },
  { id: "u10", name: "Vikram Joshi", email: "vikram@prive.network", roles: ["portfolio"], portfolios: ["Governance"], whatsapp: "", status: "active", openApprovals: 0, color: "#B45309" },
  { id: "u12", name: "Kabir Malhotra", email: "kabir@prive.network", roles: ["collaborator"], portfolios: [], whatsapp: "+91 99870 31245", status: "active", openApprovals: 0, color: "#0891B2" },
  { id: "u11", name: "Ananya Iyer", email: "ananya@prive.network", roles: ["finance"], portfolios: [], whatsapp: "", status: "invited", openApprovals: 0, color: "#BE123C" },
];

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

// Closes on outside click or Escape
function useDismiss(open, setOpen) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);
  return ref;
}

// Portfolio Officers get one circle per portfolio; other roles get a single circle
const roleBadges = (user) =>
  user.roles.flatMap((r) =>
    r === "portfolio" && user.portfolios.length
      ? user.portfolios.map((p) => ({
          key: `portfolio-${p}`,
          initials: PORTFOLIO_INITIALS[p] || p[0],
          label: `${p} Officer`,
          className: ROLES.portfolio.className,
          dot: ROLES.portfolio.dot,
        }))
      : [{ key: r, initials: ROLES[r].initials, label: ROLES[r].label, className: ROLES[r].className, dot: ROLES[r].dot }]
  );

// Overlapping initials circles; hover shows the full name of each
function RoleCell({ user }) {
  const badges = roleBadges(user);

  return (
    <div className="group relative inline-flex items-center">
      <div className="flex -space-x-2.5">
        {badges.map((b, i) => (
          <span
            key={b.key}
            style={{ zIndex: badges.length - i }}
            className={`relative w-9 h-9 rounded-full ring-2 ring-white flex items-center justify-center font-bold cursor-default ${
              b.initials.length > 2 ? "text-[10px]" : "text-[12px]"
            } ${b.className}`}
          >
            {b.initials}
          </span>
        ))}
      </div>

      <div
        className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-30 w-max max-w-[260px]
        rounded-xl bg-[#1E293B] px-3.5 py-2.5 shadow-lg opacity-0 scale-95 origin-left transition-all duration-150
        group-hover:opacity-100 group-hover:scale-100"
      >
        <span className="absolute right-full top-1/2 -translate-y-1/2 -mr-1 w-2.5 h-2.5 rotate-45 bg-[#1E293B]" />
        <ul className="space-y-1">
          {badges.map((b) => (
            <li key={b.key} className="flex items-center gap-2 text-[13px] font-semibold text-white">
              <span className={`w-1.5 h-1.5 rounded-full ${b.dot}`} />
              {b.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Three-dot actions menu for a row; opens upwards near the bottom of the table
function RowMenu({ items, openUp }) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, setOpen);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-9 h-9 rounded-full flex items-center justify-center text-[#475569] transition cursor-pointer ${
          open ? "bg-[#E3EDFD] text-[#0B57D0]" : "hover:bg-[#F1F5F9]"
        }`}
      >
        <FiMoreVertical className="text-[18px]" />
      </button>

      {open && (
        <div
          className={`absolute right-0 z-20 min-w-[180px] bg-white rounded-xl border border-[#E2E8F0] shadow-[0_8px_24px_rgba(15,23,42,0.12)] py-1.5 text-left ${
            openUp ? "bottom-full mb-1.5" : "top-full mt-1.5"
          }`}
        >
          {items.map(({ label, icon: Icon, danger, onClick }) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                onClick();
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-[14px] font-semibold transition cursor-pointer ${
                danger ? "text-[#DC2626] hover:bg-[#FEF2F2]" : "text-[#1E293B] hover:bg-[#F8FAFC]"
              }`}
            >
              <Icon className="text-[16px]" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function WhatsAppCell({ value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  if (editing) {
    const save = () => {
      if (draft.trim()) onSave(draft.trim());
      setEditing(false);
    };
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") setEditing(false);
        }}
        placeholder="+91 98765 43210"
        className="w-[170px] h-9 px-3 rounded-lg border border-[#0B57D0] text-[15px] text-[#1E293B] outline-none"
      />
    );
  }

  if (!value) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft("+91 ");
          setEditing(true);
        }}
        className="text-[15px] font-bold text-[#0B57D0] hover:underline cursor-pointer"
      >
        Add number
      </button>
    );
  }

  // Number stays in the tooltip; the icon opens the chat on WhatsApp
  return (
    <a
      href={`https://wa.me/${value.replace(/\D/g, "")}`}
      target="_blank"
      rel="noopener noreferrer"
      title={`Chat on WhatsApp · ${value}`}
      className="w-10 h-10 bg-[#E6EBF2] rounded-full flex items-center justify-center cursor-pointer"
    >
      <span className="ic--baseline-whatsapp"></span>
    </a>
  );
}

export default function UserManagementPage() {
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.userType?.toLowerCase() === "admin";

  const [users, setUsers] = useState(DUMMY_USERS);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [roleUserId, setRoleUserId] = useState(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [detailsUserId, setDetailsUserId] = useState(null);
  const roleUser = users.find((u) => u.id === roleUserId);
  const detailsUser = users.find((u) => u.id === detailsUserId);

  // Admin only — send everyone else back to the dashboard
  useEffect(() => {
    if (user && !isAdmin) router.replace("/dashboard/profile");
  }, [user, isAdmin, router]);

  const counts = useMemo(() => {
    const c = { all: users.length };
    Object.keys(ROLES).forEach((r) => (c[r] = users.filter((u) => u.roles.includes(r)).length));
    return c;
  }, [users]);

  const visibleUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter(
      (u) =>
        (roleFilter === "all" || u.roles.includes(roleFilter)) &&
        (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    );
  }, [users, search, roleFilter]);

  const updateUser = (id, patch) => setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  const removeUser = (id) => setUsers((prev) => prev.filter((u) => u.id !== id));

  if (!isAdmin) return null;

  const chipClass = (active) =>
    `inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full border text-[14px] font-bold transition cursor-pointer ${
      active
        ? "bg-[#D3E3FD] border-[#B6CFF5] text-[#0B57D0]"
        : "bg-white border-[#E2E8F0] text-[#475569] hover:border-[#B6CFF5]"
    }`;

  return (
    <div className="h-[calc(100vh-120px)] my-5 flex flex-col font-nunito">
      <h2 className="text-[32px] leading-[136%] font-bold text-[#333333]">User Management</h2>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mt-5 shrink-0">
        <div className="relative w-[300px] max-w-full">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] text-[16px]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-white border border-[#E2E8F0] text-[15px] text-[#1E293B] placeholder:text-[#94A3B8] outline-none focus:border-[#0B57D0] transition"
          />
        </div>

        <button type="button" onClick={() => setRoleFilter("all")} className={chipClass(roleFilter === "all")}>
          All <span className="font-semibold opacity-60">{counts.all}</span>
        </button>
        {Object.entries(ROLES).map(([key, role]) => (
          <button key={key} type="button" onClick={() => setRoleFilter(key)} className={chipClass(roleFilter === key)}>
            {role.plural} <span className="font-semibold opacity-60">{counts[key]}</span>
          </button>
        ))}

        <button
          type="button"
          onClick={() => setIsInviteOpen(true)}
          className="ml-auto inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-[#1D72E8] text-white text-[14px] font-bold hover:bg-[#0B57D0] transition cursor-pointer"
        >
          <FiUserPlus className="text-[16px]" />
          Invite user
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 mt-5 rounded-[20px] border border-[#E2E8F0] overflow-auto bg-white">
        <table className="w-full min-w-[900px] table-fixed border-collapse">
          {/* Fixed widths keep the columns evenly spread and the menu tight to Contact */}
          <colgroup>
            <col className="w-[36%]" />
            <col className="w-[24%]" />
            <col />
            <col className="w-[150px]" />
            <col className="w-[64px]" />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-[#F2F7FF]">
            <tr className="text-left text-[15px] font-bold text-[#475569]">
              <th className="px-6 py-4 font-bold">Name</th>
              <th className="px-4 py-4 font-bold">Role</th>
              <th className="px-4 py-4 font-bold">Open approvals</th>
              <th className="px-4 py-4 font-bold">Contact</th>
              <th className="px-4 py-4" />
            </tr>
          </thead>
          <tbody>
            {visibleUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-16 text-[15px] text-[#777777]">
                  No users match your search.
                </td>
              </tr>
            ) : (
              visibleUsers.map((u, i) => {
                const isMe = u.id === CURRENT_USER_ID;
                const status = STATUS[u.status];
                return (
                  <tr
                    key={u.id}
                    onClick={() => setDetailsUserId(u.id)}
                    className="border-t border-[#E2E8F0] hover:bg-[#FAFCFF] transition cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-11 h-11 rounded-full text-white text-[14px] font-bold flex items-center justify-center shrink-0 ${
                            u.status === "deactivated" ? "opacity-50" : ""
                          }`}
                          style={{ backgroundColor: u.color }}
                        >
                          {getInitials(u.name)}
                        </div>
                        <div className="min-w-0">
                          <p
                            className={`flex items-center gap-2 text-[17px] font-semibold ${
                              u.status === "deactivated" ? "text-[#94A3B8]" : "text-[#1E293B]"
                            }`}
                          >
                            {u.name}
                            {isMe && (
                              <span className="px-1.5 py-0.5 rounded-md bg-[#E3EDFD] text-[#0B57D0] text-[12px] font-bold">
                                You
                              </span>
                            )}
                          </p>
                          <span className="flex items-center gap-1.5 mt-0.5 text-[13px] text-[#94A3B8]">
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                            {status.label}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 align-middle">
                      <RoleCell user={u} />
                    </td>

                    <td className="px-4 py-4 text-[15px]">
                      {u.openApprovals > 0 ? (
                        <span className="text-[#1E293B]">
                          <b>{u.openApprovals}</b> waiting
                        </span>
                      ) : (
                        <span className="text-[#94A3B8]">None</span>
                      )}
                    </td>

                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-3">
                        <WhatsAppCell value={u.whatsapp} onSave={(whatsapp) => updateUser(u.id, { whatsapp })} />
                        <a
                          href={`mailto:${u.email}`}
                          title={u.email}
                          className="w-10 h-10 bg-[#E6EBF2] rounded-full flex items-center justify-center cursor-pointer shrink-0"
                        >
                          <span className="oui--email"></span>
                        </a>
                      </div>
                    </td>

                    <td className="pl-2 pr-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <RowMenu
                        openUp={i >= visibleUsers.length - 2 && visibleUsers.length > 3}
                        items={
                          u.status === "invited"
                            ? [
                                { label: "Resend invite", icon: FiSend, onClick: () => {} },
                                { label: "Cancel invite", icon: FiXCircle, danger: true, onClick: () => removeUser(u.id) },
                              ]
                            : [
                                { label: "Edit", icon: FiEdit2, onClick: () => {} },
                                // You can't change your own role
                                !isMe && { label: "Change role", icon: FiShield, onClick: () => setRoleUserId(u.id) },
                                !isMe &&
                                  (u.status === "active"
                                    ? {
                                        label: "Deactivate",
                                        icon: FiUserX,
                                        danger: true,
                                        onClick: () => updateUser(u.id, { status: "deactivated" }),
                                      }
                                    : {
                                        label: "Activate",
                                        icon: FiUserCheck,
                                        onClick: () => updateUser(u.id, { status: "active" }),
                                      }),
                              ].filter(Boolean)
                        }
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isInviteOpen && (
        <InviteUserModal
          users={users}
          onClose={() => setIsInviteOpen(false)}
          onInvite={(newUser) => setUsers((prev) => [...prev, newUser])}
        />
      )}

      {detailsUser && (
        <UserDetailsModal
          user={detailsUser}
          isMe={detailsUser.id === CURRENT_USER_ID}
          onClose={() => setDetailsUserId(null)}
        />
      )}

      {roleUser && (
        <ChangeRoleModal
          user={roleUser}
          onClose={() => setRoleUserId(null)}
          onSave={(patch) => updateUser(roleUser.id, patch)}
        />
      )}
    </div>
  );
}
