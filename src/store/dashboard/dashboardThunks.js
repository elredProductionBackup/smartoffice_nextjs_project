import { createAsyncThunk } from "@reduxjs/toolkit";
import { getActionables } from "@/services/actionable.service";
import { getApprovals } from "@/services/approval.service";

export const DASHBOARD_ACTIONABLES_LIMIT = 5;
export const DASHBOARD_APPROVALS_LIMIT = 5;

const errMsg = (err) => err?.response?.data?.message || err?.message || "Something went wrong";

/* ─── Actionables ─────────────────────────────────────────── */

// arg is optional: { silent: true } refreshes in the background without the shimmer
export const fetchDashboardActionables = createAsyncThunk(
  "dashboard/fetchDashboardActionables",
  async (_arg, { rejectWithValue }) => {
    try {
      const res = await getActionables({
        networkClusterCode: localStorage.getItem("networkClusterCode"),
        start: 1,
        offset: DASHBOARD_ACTIONABLES_LIMIT,
        dueSearchKey: "all",
        category: "all",
      });
      return res.data?.result || [];
    } catch (err) {
      return rejectWithValue(errMsg(err));
    }
  }
);

/* ─── Approvals ───────────────────────────────────────────── */

const personName = (p) => {
  if (!p) return "";
  if (typeof p === "string") return p;
  return p.name || [p.firstname, p.lastname].filter(Boolean).join(" ") || "";
};

// One flat shape for the card, whatever nesting the API uses.
// topicId + messageId is all the discussions page needs to open the right message.
const toApproval = (a = {}) => {
  const msg = a.message || {};
  const topic = a.topic || msg.topic || {};

  return {
    id: a.approvalId || a._id || a.messageId || msg._id,
    messageId: a.messageId || msg.messageId || msg._id || null,
    topicId: a.topicId || topic.topicId || topic._id || msg.topicId || null,
    topicTitle: a.topicTitle || topic.title || "",
    text: a.text || msg.text || a.title || a.description || "Approval request",
    amount: a.amount ?? a.ask?.amount ?? msg.ask?.amount ?? null,
    status: String(a.status || a.ask?.status || msg.ask?.status || "pending").toLowerCase(),
    requester: personName(a.requestedBy || a.from || a.createdBy || a.sender || msg.sender || a.submittedBy),
    createdAt: a.createdAt || msg.createdAt || a.submittedDate || null,
  };
};

// Latest approvals of every status for the dashboard card
export const fetchDashboardApprovals = createAsyncThunk(
  "dashboard/fetchDashboardApprovals",
  async ({ status = "all", limit = DASHBOARD_APPROVALS_LIMIT } = {}, { rejectWithValue }) => {
    try {
      // Shared service: throws when the API answers success: false
      const data = (await getApprovals({ status, start: 0, offset: limit })) || {};
      const raw = Array.isArray(data.result) ? data.result : data.result?.list || [];

      return {
        list: raw.slice(0, limit).map(toApproval),
        totalCount: data.totalCount ?? raw.length,
      };
    } catch (err) {
      return rejectWithValue(errMsg(err));
    }
  }
);
