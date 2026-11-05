'use client';

import { memo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { FiCheckSquare } from 'react-icons/fi';
import { DASHBOARD_APPROVALS_LIMIT, fetchDashboardApprovals } from '@/store/dashboard/dashboardThunks';

const DISCUSSIONS_PATH = '/dashboard/discussions';

const STATUS = {
  pending: { label: 'Pending', className: 'text-amber-700 bg-amber-50 border-amber-200' },
  approved: { label: 'Approved', className: 'text-green-600 bg-green-50 border-green-200' },
  rejected: { label: 'Rejected', className: 'text-red-600 bg-red-50 border-red-200' },
  cancelled: { label: 'Cancelled', className: 'text-slate-500 bg-slate-50 border-slate-200' },
};

// Opens the discussion (and message) that holds this approval
const approvalHref = ({ topicId, messageId }) => {
  const params = new URLSearchParams();
  if (topicId) params.set('topicId', topicId);
  if (messageId) params.set('messageId', messageId);
  const query = params.toString();
  return query ? `${DISCUSSIONS_PATH}?${query}` : DISCUSSIONS_PATH;
};

const formatAmount = (value) =>
  value === null || value === undefined || value === '' ? null : `₹${(Number(value) || 0).toLocaleString('en-IN')}`;

const formatDay = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
};

const formatTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

// Same row layout as the Actionable card: bullet + title + "who | time" on the left, date on the right
const ApprovalRow = memo(function ApprovalRow({ item }) {
  const amount = formatAmount(item.amount);
  const who = item.requester || item.topicTitle;
  const time = formatTime(item.createdAt);
  const status = STATUS[item.status] || STATUS.pending;

  return (
    <li className="border-b border-[#D4DFF1] pb-4 md:pb-[20px] last:border-none">
      <Link
        href={approvalHref(item)}
        className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between lg:gap-[34px] no-underline group focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb] rounded-md"
      >
        {/* Left */}
        <div className="flex gap-3 min-w-0">
          <div className="mt-[7px] h-[8px] min-w-[8px] rounded-full bg-[#333]" />
          <div className="flex flex-col gap-[6px] min-w-0">
            <p className="text-[16px] leading-[21px] font-[500] text-[#333] line-clamp-2 break-words group-hover:text-[#0B57D0]">
              {item.text || '—'}
            </p>
            {(who || time) && (
              <p className="text-[14px] text-[#666666] font-[600] truncate">
                {who || '—'}{time && ` | ${time}`}
              </p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[12px] font-medium px-2.5 py-0.5 rounded-full border ${status.className}`}>
                {STATUS[item.status] ? status.label : item.status}
              </span>
              {amount && <span className="text-[14px] font-[600] text-[#333]">{amount}</span>}
            </div>
          </div>
        </div>

        {/* Right */}
        <span className="pl-5 lg:pl-0 lg:w-[100px] shrink-0 text-[14px] text-[#333333] font-[600] whitespace-nowrap">
          {formatDay(item.createdAt)}
        </span>
      </Link>
    </li>
  );
});

const DashboardApprovalList = () => {
  const dispatch = useDispatch();
  // Separate selectors: the card only re-renders when approvals change, not on actionable updates
  const approvals = useSelector((state) => state.dashboard.approvals);
  const loading = useSelector((state) => state.dashboard.approvalsLoading);
  const error = useSelector((state) => state.dashboard.approvalsError);

  const load = useCallback(() => dispatch(fetchDashboardApprovals({ status: 'all' })), [dispatch]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex flex-col rounded-2xl bg-[#F2F7FF] px-4 py-5 md:px-6 md:py-6 min-h-[260px] md:min-h-[500px] max-h-[500px]">
      <div className="flex items-center justify-between gap-3 mb-4 md:mb-[20px]">
        <h3 className="font-heading text-[18px] md:text-[20px] font-[700] text-[#333]">Approvals</h3>
        <Link
          href={DISCUSSIONS_PATH}
          className="shrink-0 text-[14px] font-[600] text-[#0B57D0] border border-[#0B57D0] px-[14px] py-[4px] rounded-full cursor-pointer no-underline"
        >
          View all
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col gap-[10px]" aria-label="Loading approvals">
          {Array.from({ length: DASHBOARD_APPROVALS_LIMIT }, (_, i) => (
            <div key={i} className="h-[72px] rounded-xl bg-white/70 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col gap-[10px] items-center justify-center text-center py-6">
          <p className="text-[14px] text-[#666666]">
            {/^couldn.t load approvals/i.test(error) ? error : `Couldn't load approvals. ${error}`}
          </p>
          <button
            type="button"
            onClick={load}
            className="px-4 py-2 rounded-full bg-[#2445cc] text-white text-[14px] font-semibold border-none cursor-pointer hover:opacity-90"
          >
            Try again
          </button>
        </div>
      ) : approvals.length === 0 ? (
        <div className="flex-1 flex flex-col gap-[10px] items-center justify-center text-center py-6">
          <div className="h-[60px] w-[60px] bg-[#D3E3FD] rounded-full mb-[10px] grid place-items-center">
            <FiCheckSquare className="text-[24px] text-[#0B57D0]" />
          </div>
          <div className="text-[18px] md:text-[20px] font-[600] text-[#333333]">No approvals found</div>
          <p className="text-[14px] text-[#666666]">You don&apos;t have any approvals right now</p>
        </div>
      ) : (
        <ul className="flex-1 min-h-0 flex flex-col gap-4 md:gap-[20px] overflow-y-auto list-none p-0 m-0">
          {approvals.map((item) => (
            <ApprovalRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
};

export default DashboardApprovalList;
