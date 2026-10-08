"use client";

import React, { useEffect, useState } from 'react';
import moment from 'moment';
import {
  FiX, FiClock, FiCheckCircle, FiXCircle, FiUser, FiCalendar, FiTag, FiClipboard,
  FiFileText, FiEye, FiDownload, FiLoader,
} from 'react-icons/fi';
import { FaRupeeSign, FaRegBuilding } from 'react-icons/fa';

const STATUS_PILL = {
  pending: { label: 'Pending Approval', Icon: FiClock, className: 'bg-[#FEF7E0] border-[#FCD34D] text-[#B06000]' },
  approved: { label: 'Approved', Icon: FiCheckCircle, className: 'bg-[#E6F4EA] border-[#86EFAC] text-[#137333]' },
  rejected: { label: 'Rejected', Icon: FiXCircle, className: 'bg-[#FEE2E2] border-[#FCA5A5] text-[#B91C1C]' },
};

const formatAmount = (value) => `₹${(Number(value) || 0).toLocaleString('en-IN')}`;
const formatDate = (value) => (value ? moment(value).format('DD MMM YYYY') : '—');

const InfoItem = ({ Icon, label, value }) => (
  <div className="flex items-start gap-2.5 min-w-0">
    <Icon className="w-[18px] h-[18px] mt-0.5 shrink-0 text-[#2B7FFF]" />
    <div className="min-w-0">
      <p className="text-[14px] font-medium text-[#64748B]">{label}</p>
      <p className="text-[16px] font-bold text-[#0F172A] break-words">{value || '—'}</p>
    </div>
  </div>
);

const DetailField = ({ label, children }) => (
  <div>
    <p className="text-[14px] font-medium text-[#64748B] mb-1.5">{label}</p>
    {children}
  </div>
);

const SectionTitle = ({ Icon, children }) => (
  <div className="flex items-center gap-2 mb-4">
    <Icon className="w-4 h-4 text-[#64748B]" />
    <h4 className="text-[18px] font-bold text-[#1E293B]">{children}</h4>
  </div>
);

// onApprove(approval) / onReject(approval, reason) return promises; a rejection shows its message here.
export default function ReviewApprovalModal({ approval, detailsLoading, detailsError, onClose, onApprove, onReject }) {
  const [rejecting, setRejecting] = useState(false); // reject reason field open
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(null); // 'approve' | 'reject' while the API call runs
  const [error, setError] = useState('');

  const handleClose = () => {
    if (!submitting) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !submitting && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, submitting]);

  if (!approval) return null;

  const pill = STATUS_PILL[approval.status] ?? STATUS_PILL.pending;
  const isPending = approval.status === 'pending';
  const trimmedReason = rejectReason.trim();

  const submit = async (action) => {
    setSubmitting(action);
    setError('');
    try {
      if (action === 'approve') await onApprove(approval);
      else await onReject(approval, trimmedReason);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(null);
    }
  };

  const cancelReject = () => {
    setRejecting(false);
    setRejectReason('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 font-nunito" onClick={handleClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-[640px] mx-4 shadow-xl flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed header */}
        <div className="flex items-start justify-between gap-3 px-7 pt-5 pb-4 border-b border-[#F1F5F9] shrink-0">
          <div className="min-w-0">
            <p className="text-[13px] font-bold uppercase tracking-wide text-[#64748B]">Expense Approval</p>
            <h3 className="text-[26px] font-bold text-[#0F172A] leading-tight mt-1 capitalize break-words">{approval.request}</h3>
            <span className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full border text-[14px] font-semibold ${pill.className}`}>
              <pill.Icon className="w-3.5 h-3.5" />
              {pill.label}
            </span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-[#94A3B8] hover:text-[#334155] transition-colors cursor-pointer bg-transparent border-0 p-1 shrink-0"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {detailsLoading && (
            <div className="flex items-center gap-2 px-7 pt-4 text-[14px] font-semibold text-[#64748B]">
              <FiLoader className="w-4 h-4 animate-spin" />
              Loading full details...
            </div>
          )}
          {!detailsLoading && detailsError && (
            <p className="px-7 pt-4 text-[14px] text-[#B91C1C]">{detailsError}</p>
          )}
          <div className="grid grid-cols-2 gap-x-6 gap-y-5 px-7 py-5 border-b border-[#F1F5F9]">
            <InfoItem Icon={FaRupeeSign} label="Amount" value={formatAmount(approval.amount)} />
            <InfoItem Icon={FiUser} label="Submitted By" value={approval.submittedBy} />
            <InfoItem Icon={FiCalendar} label="Submitted Date" value={formatDate(approval.date)} />
            <InfoItem Icon={FaRegBuilding} label="Vendor" value={approval.vendor} />
            <InfoItem Icon={FiTag} label="Payment Status" value={approval.paymentStatus} />
            <InfoItem Icon={FiClipboard} label="Related Event" value={approval.relatedEvent} />
          </div>

          <div className="px-7 py-5 border-b border-[#F1F5F9]">
            <SectionTitle Icon={FiFileText}>Expense Details</SectionTitle>
            <div className="flex flex-col gap-4">
              <DetailField label="Description">
                <p className="text-[16px] text-[#334155] bg-[#F8FAFC] rounded-lg px-3 py-2.5">{approval.description || '—'}</p>
              </DetailField>
              <DetailField label="Remark">
                <p className="text-[16px] text-[#334155] bg-[#F8FAFC] rounded-lg px-3 py-2.5">{approval.remark || '—'}</p>
              </DetailField>
              <DetailField label="Vendor">
                <p className="text-[16px] text-[#334155]">{approval.vendor || '—'}</p>
              </DetailField>
              <DetailField label="Bill">
                {approval.billUrl ? (
                  <div className="flex items-center gap-2">
                    <a
                      href={approval.billUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg border border-[#E2E8F0] text-[15px] font-semibold text-[#334155] hover:bg-slate-50 transition-colors"
                    >
                      <FiEye className="w-4 h-4" />
                      View Bill
                    </a>
                    <a
                      href={approval.billUrl}
                      download
                      className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg border border-[#E2E8F0] text-[15px] font-semibold text-[#334155] hover:bg-slate-50 transition-colors"
                    >
                      <FiDownload className="w-4 h-4" />
                      Download
                    </a>
                  </div>
                ) : (
                  <p className="text-[16px] text-[#94A3B8]">No bill attached</p>
                )}
              </DetailField>
              <DetailField label="Related Event">
                <p className="text-[16px] text-[#334155]">{approval.relatedEvent || '—'}</p>
              </DetailField>
              {approval.status === 'rejected' && approval.rejectReason && (
                <DetailField label="Reject Reason">
                  <p className="text-[16px] text-[#B91C1C] bg-[#FEF2F2] rounded-lg px-3 py-2.5 break-words">{approval.rejectReason}</p>
                </DetailField>
              )}
            </div>
          </div>

          <div className="px-7 py-5">
            <SectionTitle Icon={FiClock}>Activity Timeline</SectionTitle>
            <ol className="relative flex flex-col gap-4 pl-5">
              <span className="absolute left-[5px] top-1.5 bottom-1.5 w-px bg-[#E2E8F0]" />
              {(approval.timeline ?? []).map((item, i) => (
                <li key={`${item.label}-${i}`} className="relative">
                  <span className="absolute -left-5 top-1.5 w-[12px] h-[12px] rounded-full bg-[#2B7FFF] ring-4 ring-[#EEF4FF]" />
                  <p className="text-[15px] font-semibold text-[#1E293B]">{item.label}</p>
                  {item.date && <p className="text-[14px] text-[#64748B]">{formatDate(item.date)}</p>}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Fixed footer */}
        <div className="px-7 py-4 border-t border-[#F1F5F9] shrink-0">
          {isPending && rejecting && (
            <div className="mb-4">
              <label htmlFor="reject-reason" className="block text-[14px] font-semibold text-[#334155] mb-1.5">
                Reject reason <span className="text-[#B91C1C]">*</span>
              </label>
              <textarea
                id="reject-reason"
                autoFocus
                rows={3}
                maxLength={500}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                disabled={!!submitting}
                placeholder="Tell the requester why this expense is being rejected"
                className="w-full resize-none rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:border-[#FCA5A5] focus:ring-[3px] focus:ring-[#FEE2E2] disabled:bg-[#F8FAFC]"
              />
            </div>
          )}

          {error && <p className="mb-3 text-[14px] text-[#B91C1C]">{error}</p>}

          <div className="flex items-center gap-3">
            {!isPending ? (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-12 rounded-xl border border-[#E2E8F0] text-[16px] font-semibold text-[#334155] bg-white hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Close
              </button>
            ) : rejecting ? (
              <>
                <button
                  type="button"
                  onClick={cancelReject}
                  disabled={!!submitting}
                  className="flex-1 h-12 rounded-xl border border-[#E2E8F0] text-[16px] font-semibold text-[#334155] bg-white hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => submit('reject')}
                  disabled={!trimmedReason || !!submitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-xl text-[16px] font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] transition-colors cursor-pointer border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting === 'reject' ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiXCircle className="w-4 h-4" />}
                  Submit Rejection
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => { setRejecting(true); setError(''); }}
                  disabled={!!submitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-xl border border-[#FCA5A5] text-[16px] font-semibold text-[#B91C1C] bg-white hover:bg-[#FEF2F2] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <FiXCircle className="w-4 h-4" />
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => submit('approve')}
                  disabled={!!submitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-xl text-[16px] font-semibold text-white bg-[#0F9D58] hover:bg-[#0B8043] transition-colors cursor-pointer border-0 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting === 'approve' ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiCheckCircle className="w-4 h-4" />}
                  Approve
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
