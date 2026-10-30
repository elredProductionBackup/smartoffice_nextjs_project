"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { fetchBudgetTypes } from "@/store/events/budgetChecklist/budgetThunks";
import {
  FiEdit2,
  FiSearch,
  FiSend,
  FiShield,
  FiUserCheck,
  FiUserPlus,
  FiUserX,
  FiXCircle,
} from "react-icons/fi";
import { API_ROLES, AVATAR_COLORS, PORTFOLIO_INITIALS, ROLES, STATUS, toApiPhone } from "./constants";
import {
  addNetworkClusterAdmin,
  getAllNetworkClusterAdminDetails,
  removeNetworkClusterAdmin,
  resendNetworkClusterAdminInvite,
  updateNetworkClusterAdminActivation,
} from "@/services/auth.service";
import { addToast } from "@/store/toastSlice";
import EventActionConfirmModal from "@/_components/EventsComps/EventActionConfirmModal";
import ChangeRoleModal from "./ChangeRoleModal";
import EditUserModal from "./EditUserModal";
import InviteUserModal from "./InviteUserModal";
import SuccessPopup from "@/_components/ConfirmationPopups/SuccessPopup";
import UserDetailsModal from "./UserDetailsModal";
import RowMenu from "@/_components/UI/RowMenu";

// API role keys -> keys used by ROLES on this page
const API_ROLE_MAP = {
  admin: "admin",
  financeOfficer: "finance",
  portfolioOfficer: "portfolio",
  learningOfficer: "portfolio",
  collaborator: "collaborator",
};

// Shapes one getAllNetworkClusterAdminDetails result into the row this page renders
// isActivate: false means the account is switched off, whatever `status` says; otherwise use "Active" etc.
const toStatus = (u) => {
  if (u.isActivate === false) return "deactivated";
  const key = String(u.status || "").toLowerCase().trim();
  if (STATUS[key]) return key;
  // Not-yet-joined users may come back as "Pending", "Invite pending", etc.
  return key.includes("pending") || key.includes("invite") ? "invited" : "active";
};

// Some firstnames already include the surname (e.g. "Vignesh Nagamani" + "Nagamani")
const toName = (first = "", last = "") => {
  const f = first.trim();
  const l = last.trim();
  return l && !f.toLowerCase().endsWith(l.toLowerCase()) ? `${f} ${l}` : f;
};

// API portfolios may be names, budgetTypeIds or objects; keep one string per portfolio (ids are named later)
const portfolioKey = (p) =>
  typeof p === "string"
    ? p
    : p?.budgetType || p?.portfolioName || p?.name || p?.budgetTypeId || p?.portfolioId || p?._id || "";

const toUser = (u, index) => {
  const name = toName(u.firstname ?? u.firstName, u.lastname ?? u.lastName);
  const roles = [...new Set((u.role || u.roles || []).map((r) => API_ROLE_MAP[r]).filter(Boolean))];
  return {
    id: u.userCode || u._id || u.email,
    name: name || u.email || "No name",
    email: u.email || "",
    roles,
    portfolios: (u.portfolios || []).map(portfolioKey).filter(Boolean),
    whatsapp: u.phone || u.phoneNumber || "",
    status: toStatus(u),
    openApprovals: u.openApprovals ?? 0,
    color: AVATAR_COLORS[index % AVATAR_COLORS.length],
  };
};

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

// Portfolio Officers get one circle per portfolio; other roles get a single circle
const roleBadges = (user) =>
  user.roles.flatMap((r) =>
    r === "portfolio" && user.portfolios.length
      ? user.portfolios.map((p) => ({
          key: `portfolio-${p}`,
          initials: PORTFOLIO_INITIALS[p] || String(p).charAt(0).toUpperCase() || "P",
          label: `${String(p).charAt(0).toUpperCase()}${String(p).slice(1)} Officer`,
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

  const dispatch = useDispatch();
  const { budgetTypes } = useSelector((state) => state.budget);
  const [rawUsers, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const networkClusterCode = user?.networkClusterDetails?.networkClusterCode;
  const isMeUser = (u) => !!user?.email && u.email.toLowerCase() === user.email.toLowerCase();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [roleUserId, setRoleUserId] = useState(null);
  const [editUserId, setEditUserId] = useState(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(null); // invite payload, for the success popup
  const [deactivateUserId, setDeactivateUserId] = useState(null); // waiting on the confirm popup
  const [cancelInviteUserId, setCancelInviteUserId] = useState(null); // waiting on the confirm popup
  const [cancellingInvite, setCancellingInvite] = useState(false);
  const [activationPending, setActivationPending] = useState(false);
  const [detailsUserId, setDetailsUserId] = useState(null);
  useEffect(() => {
    if (!budgetTypes?.length) dispatch(fetchBudgetTypes());
  }, [budgetTypes?.length, dispatch]);

  // Swap portfolio ids for their budget type names once those have loaded.
  // portfolioIds keeps the budgetTypeIds the update API needs (names from the API are looked up by name).
  const users = useMemo(() => {
    const nameById = Object.fromEntries((budgetTypes || []).map((t) => [t.budgetTypeId, t.budgetType]));
    const idByName = Object.fromEntries((budgetTypes || []).map((t) => [String(t.budgetType).toLowerCase(), t.budgetTypeId]));
    return rawUsers.map((u) => ({
      ...u,
      portfolios: u.portfolios.map((p) => nameById[p] || p),
      portfolioIds: u.portfolios.map((p) => (nameById[p] ? p : idByName[String(p).toLowerCase()])).filter(Boolean),
    }));
  }, [rawUsers, budgetTypes]);

  const roleUser = users.find((u) => u.id === roleUserId);
  const editUser = users.find((u) => u.id === editUserId);
  const detailsUser = users.find((u) => u.id === detailsUserId);
  const deactivateUser = users.find((u) => u.id === deactivateUserId);
  const cancelInviteUser = users.find((u) => u.id === cancelInviteUserId);

  // Admin only — send everyone else back to the dashboard
  useEffect(() => {
    if (user && !isAdmin) router.replace("/dashboard/profile");
  }, [user, isAdmin, router]);

  // State only changes once the request settles; retryUsers resets the loader first
  const fetchUsers = useCallback(() => {
    const code = networkClusterCode || localStorage.getItem("networkClusterCode");
    const request = code
      ? getAllNetworkClusterAdminDetails({ networkClusterCode: code })
      : Promise.reject(new Error("No network cluster code"));
    request
      .then((res) => {
        if (!res?.data?.success) throw new Error(res?.data?.message || "Request failed");
        const result = res.data.result;
        const list = Array.isArray(result) ? result : result?.list || result?.users || [];
        setUsers(list.map(toUser));
      })
      .catch((err) => {
        console.error("User list fetch error:", err);
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  }, [networkClusterCode]);

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin, fetchUsers]);

  const retryUsers = () => {
    setLoading(true);
    setLoadError(false);
    fetchUsers();
  };

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

  // Flips the row straight away, then rolls back if the API refuses
  // Row only disappears once the backend confirms the removal
  const cancelInvite = async (target) => {
    setCancellingInvite(true);
    try {
      const res = await removeNetworkClusterAdmin({ userCode: target.id });
      if (!res?.data?.success) throw new Error(res?.data?.message || "Request failed");
      removeUser(target.id);
      dispatch(addToast({
        message: { title: "Invite cancelled", descrip: `${target.name}'s invite has been withdrawn.` },
        type: "success",
      }));
    } catch (err) {
      console.error("Cancel invite error:", err);
      dispatch(addToast({
        message: { title: "Couldn't cancel invite", descrip: err.message || "Please try again." },
        type: "error",
      }));
    } finally {
      setCancellingInvite(false);
      setCancelInviteUserId(null);
    }
  };

  const resendInvite = async (target) => {
    try {
      const res = await resendNetworkClusterAdminInvite({ userCode: target.id });
      if (!res?.data?.success) throw new Error(res?.data?.message || "Request failed");
      dispatch(addToast({
        message: { title: "Invite resent", descrip: `We've emailed ${target.email} again.` },
        type: "success",
      }));
    } catch (err) {
      console.error("Resend invite error:", err);
      dispatch(addToast({
        message: { title: "Couldn't resend invite", descrip: err.message || "Please try again." },
        type: "error",
      }));
    }
  };

  const setActivation = async (target, isActivate) => {
    const previous = target.status;
    updateUser(target.id, { status: isActivate ? "active" : "deactivated" });
    setActivationPending(true);
    try {
      const res = await updateNetworkClusterAdminActivation({ userCode: target.id, isActivate });
      if (!res?.data?.success) throw new Error(res?.data?.message || "Request failed");
      dispatch(addToast({
        message: {
          title: isActivate ? "User activated" : "User deactivated",
          descrip: isActivate ? `${target.name} can use Smart Networks again.` : `${target.name} can no longer sign in.`,
        },
        type: "success",
      }));
    } catch (err) {
      console.error("Activation update error:", err);
      updateUser(target.id, { status: previous });
      dispatch(addToast({
        message: {
          title: isActivate ? "Couldn't activate user" : "Couldn't deactivate user",
          descrip: err.message || "Please try again.",
        },
        type: "error",
      }));
    } finally {
      setActivationPending(false);
      setDeactivateUserId(null);
    }
  };

  // addNetworkClusterAdmin updates an existing user (matched by email) with the full details sent.
  // patch: { name?, roles?, portfolioIds?, whatsapp? } in page shape; anything left out keeps the user's current value.
  const saveUserDetails = async (target, patch) => {
    const name = patch.name ?? target.name;
    const roles = patch.roles ?? target.roles;
    const portfolioIds = roles.includes("portfolio") ? patch.portfolioIds ?? target.portfolioIds : [];
    const phone = toApiPhone(patch.whatsapp ?? target.whatsapp);
    const details = {
      fullName: name,
      email: target.email,
      ...(phone && { phone }),
      role: roles.map((r) => API_ROLES[r]).filter(Boolean),
      portfolioIds,
    };

    const res = await addNetworkClusterAdmin([details]);
    if (!res?.data?.success) throw new Error(res?.data?.message || "Request failed");
    // Raw rows keep portfolio ids; the users memo turns them back into names
    updateUser(target.id, { name, roles, portfolios: portfolioIds, whatsapp: phone || target.whatsapp });
  };

  const changeRole = async (target, { roles, portfolioIds }) => {
    await saveUserDetails(target, { roles, portfolioIds });
    dispatch(addToast({
      message: { title: "Role updated", descrip: `${target.name}'s roles have been saved.` },
      type: "success",
    }));
  };

  const editDetails = async (target, { name, whatsapp }) => {
    await saveUserDetails(target, { name, whatsapp });
    dispatch(addToast({
      message: { title: "User updated", descrip: `${name}'s details have been saved.` },
      type: "success",
    }));
  };

  // Row shows the new number straight away, then rolls back if the API refuses
  const saveWhatsApp = async (target, whatsapp) => {
    if (!toApiPhone(whatsapp)) return;
    const previous = target.whatsapp;
    updateUser(target.id, { whatsapp });
    try {
      await saveUserDetails(target, { whatsapp });
      dispatch(addToast({
        message: { title: "Number saved", descrip: `${target.name}'s WhatsApp number has been updated.` },
        type: "success",
      }));
    } catch (err) {
      console.error("WhatsApp update error:", err);
      updateUser(target.id, { whatsapp: previous });
      dispatch(addToast({
        message: { title: "Couldn't save number", descrip: err.message || "Please try again." },
        type: "error",
      }));
    }
  };

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
      <h2 className="font-heading text-[32px] leading-[136%] font-bold text-[#333333]">User Management</h2>

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
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-16 text-[15px] text-[#777777]">
                  Loading users...
                </td>
              </tr>
            ) : loadError ? (
              <tr>
                <td colSpan={5} className="text-center py-16 text-[15px] text-[#777777]">
                  Couldn&apos;t load users.{" "}
                  <button type="button" onClick={retryUsers} className="font-bold text-[#0B57D0] hover:underline cursor-pointer">
                    Try again
                  </button>
                </td>
              </tr>
            ) : visibleUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-16 text-[15px] text-[#777777]">
                  {users.length === 0 ? "No users in this network yet." : "No users match your search."}
                </td>
              </tr>
            ) : (
              visibleUsers.map((u, i) => {
                const isMe = isMeUser(u);
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
                        <WhatsAppCell value={u.whatsapp} onSave={(whatsapp) => saveWhatsApp(u, whatsapp)} />
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
                        items={
                          u.status === "invited"
                            ? [
                                { label: "Resend invite", icon: FiSend, onClick: () => resendInvite(u) },
                                { label: "Cancel invite", icon: FiXCircle, danger: true, onClick: () => setCancelInviteUserId(u.id) },
                              ]
                            : [
                                { label: "Edit", icon: FiEdit2, onClick: () => setEditUserId(u.id) },
                                // You can't change your own role
                                !isMe && { label: "Change role", icon: FiShield, onClick: () => setRoleUserId(u.id) },
                                !isMe &&
                                  (u.status === "active"
                                    ? {
                                        label: "Deactivate",
                                        icon: FiUserX,
                                        danger: true,
                                        onClick: () => setDeactivateUserId(u.id),
                                      }
                                    : {
                                        label: "Activate",
                                        icon: FiUserCheck,
                                        onClick: () => setActivation(u, true),
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
          onInvite={(invited) => {
            fetchUsers();
            setInviteSuccess(invited);
          }}
        />
      )}

      {detailsUser && (
        <UserDetailsModal
          user={detailsUser}
          isMe={isMeUser(detailsUser)}
          onClose={() => setDetailsUserId(null)}
        />
      )}

      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUserId(null)}
          onSave={(patch) => editDetails(editUser, patch)}
        />
      )}

      {roleUser && (
        <ChangeRoleModal
          user={roleUser}
          onClose={() => setRoleUserId(null)}
          onSave={(patch) => changeRole(roleUser, patch)}
        />
      )}

      {cancelInviteUser && (
        <EventActionConfirmModal
          title={`Cancel ${cancelInviteUser.name}'s invite?`}
          message="They'll be removed from the network and the invite will be withdrawn."
          confirmText="Yes, cancel"
          cancelText="Keep"
          isLoading={cancellingInvite}
          onConfirm={() => cancelInvite(cancelInviteUser)}
          onCancel={() => !cancellingInvite && setCancelInviteUserId(null)}
        />
      )}

      {deactivateUser && (
        <EventActionConfirmModal
          title={`Deactivate ${deactivateUser.name}?`}
          message="They won't be able to sign in until you activate them again."
          confirmText="Deactivate"
          cancelText="Cancel"
          isLoading={activationPending}
          onConfirm={() => setActivation(deactivateUser, false)}
          onCancel={() => !activationPending && setDeactivateUserId(null)}
        />
      )}

      <SuccessPopup
        isOpen={!!inviteSuccess}
        title={inviteSuccess?.isNewAdmin === false ? "User updated" : "Invite sent"}
        message={
          inviteSuccess &&
          (inviteSuccess.isNewAdmin === false
            ? `${inviteSuccess.fullName} was already in the network, so their roles have been updated.`
            : `${inviteSuccess.fullName} will get an email at ${inviteSuccess.email} to join the network.`)
        }
        onClose={() => setInviteSuccess(null)}
      />
    </div>
  );
}
