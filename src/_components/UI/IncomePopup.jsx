'use client';

import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import CustomDatePicker from './CustomDatePicker';
import { addIncome, deleteIncome, getIncome } from '@/services/income.service';

const TAG_COLORS = {
  default: { bg: '#e8f0fe', text: '#1a56db', border: '#c3d3fc' },
};

const formatRupees = (value) => {
  if (!value && value !== 0) return '';
  return Number(value).toLocaleString('en-IN');
};

const today = () => {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${d.getFullYear()}`;
};

const toInputDate = (str) => {
  if (!str) return '';
  const [dd, mm, yyyy] = str.split('-');
  return `${yyyy}-${mm}-${dd}`;
};

const fromInputDate = (str) => {
  if (!str) return '';
  const [yyyy, mm, dd] = str.split('-');
  return `${dd}-${mm}-${yyyy}`;
};

const epochToDisplayDate = (ms) => {
  if (!ms) return '';
  const d = new Date(ms);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${d.getFullYear()}`;
};


const EMPTY_FORM = { type: '', amount: '', date: today(), description: '' };

const mapIncomeRecord = (record) => ({
  id: record.incomeId,
  type: record.incomeType,
  amount: Number(record.incomeAmount),
  date: epochToDisplayDate(record.incomeDate),
  description: record.incomeRemarks || '',
  createdAt: record.createdAt || 0,
});

export default function IncomePopup({ onClose }) {
  // Income sources now live entirely on the backend (addIncome/deleteIncome/
  // getIncome) — no localStorage mock data, so there's nothing to fall out of
  // sync with real incomeIds.
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    try {
      localStorage.removeItem('smartoffice_income_sources');
    } catch {}

    (async () => {
      setLoading(true);
      try {
        const result = await getIncome();
        console.log('getIncome result:', result);
        const list = result?.result || [];
        setSources(list.map(mapIncomeRecord));
      } catch (error) {
        console.error('Failed to fetch incomes:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalIncome = sources.reduce((acc, s) => acc + Number(s.amount), 0);

  const handleAddSource = async () => {
    if (!form.type || !form.amount || isNaN(Number(form.amount))) return;

    setSubmitting(true);
    try {
      const [dd, mm, yyyy] = form.date.split('-');
      const incomeDate = new Date(`${yyyy}-${mm}-${dd}`).getTime();

      const result = await addIncome({
        incomeType: form.type,
        incomeAmount: Number(form.amount),
        incomeDate,
        incomeRemarks: form.description || '',
      });
      console.log('addIncome result:', result);

      // `result.result` may contain more than the just-created record (e.g. the
      // full income list), so pick the most recently created one rather than
      // assuming index [0] is the new entry.
      const list = result?.result || [];
      const created = list.reduce(
        (latest, item) => (!latest || (item.createdAt || 0) > (latest.createdAt || 0) ? item : latest),
        null,
      );
      if (!created?.incomeId) {
        throw new Error('addIncome did not return a saved record');
      }

      setSources((prev) => [...prev, mapIncomeRecord(created)]);

      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (error) {
      console.error('Failed to add income:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSource = async (incomeId) => {
    setDeletingId(incomeId);
    try {
      const result = await deleteIncome(incomeId);
      console.log('deleteIncome result:', result);
      setSources((prev) => prev.filter((s) => s.id !== incomeId));
    } catch (error) {
      console.error('Failed to delete income:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <>
      {/* ── Overlay ── */}
      <div
        className="fixed inset-0 z-9998 backdrop-blur-sm"
        style={{ background: 'rgba(15,23,42,0.45)' }}
        onClick={onClose}
      />

      {/* ── Modal ── */}
      <div
        className="fixed z-9999 flex flex-col overflow-hidden bg-white rounded-[20px] w-[800px] h-[900px] max-w-[95vw] max-h-[92vh] font-nunito"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-6 pt-5 pb-5"
          style={{ background: 'linear-gradient(135deg,#f0fdf4,#e8f8f0)' }}
        >
          <div className="flex items-center gap-2.5">
            <h2 className="m-0 text-[30px] font-bold text-[#333333]">
              Income Management
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-black/5 text-slate-500 text-base cursor-pointer border-none transition-colors duration-200 hover:bg-black/10 hover:text-slate-700"
            style={{ background: undefined }}
          >
            <FiX />
          </button>
        </div>

        {/* ── Total Income Banner ── */}
        <div
          className="px-6 py-3.5 flex items-center justify-between border-b border-slate-100"
          style={{ background: 'linear-gradient(135deg,#f0fdf4,#e8f8f0)' }}
        >
          <div>
            <div className="text-[16px] text-[#727272] font-bold tracking-[-1px] mb-0.5">
              Total Income 2026
            </div>
            <div className="text-[34px] tracking-[-2px] font-extrabold text-[#0B57D0]">
              ₹{formatRupees(totalIncome)}
            </div>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="flex items-center text-white text-[16px] font-medium rounded-full px-4 py-[9px] border-none cursor-pointer whitespace-nowrap transition-opacity duration-200 hover:opacity-90"
            style={{
              background: 'linear-gradient(135deg,#5597ED,#00449C)',
              boxShadow: '0 2px 8px rgba(85,151,237,0.3)',
            }}
          >
            Add Income Source
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        {/* scrollbar-hide: scrollbarWidth (Firefox) + ::-webkit-scrollbar (Chrome) kept as inline/style-tag */}
        <div
          className="flex-1 overflow-y-auto px-6 py-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style>{`.income-scroll::-webkit-scrollbar { display: none; }`}</style>

          {/* ── Add New Income Source Form ── */}
          {showForm && (
            <div className="bg-[#f0f4ff] border border-[#c7d7fb] rounded-[14px] p-[18px] mb-[18px]">
              <div className="text-[16px] leading-[136%] font-bold text-[#0B57D0] mb-3.5">
                Add New Income Source
              </div>

              {/* Row 1 */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-[14px] font-bold text-[#333333] mb-1">
                    Income Type
                  </label>
                  <input
                    name="type"
                    type="text"
                    placeholder="e.g. Initiation fee"
                    value={form.type}
                    onChange={handleFormChange}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSource()}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[0.84rem] text-slate-800 bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[14px] font-bold text-[#333333] mb-1">
                    Amount
                  </label>
                  <input
                    name="amount"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.amount}
                    onChange={handleFormChange}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSource()}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[0.84rem] text-slate-800 bg-white outline-none"
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-[14px] font-bold text-[#333333] mb-1">
                    Date
                  </label>
                  <CustomDatePicker
                    value={form.date}
                    onChange={(dateStr) => setForm((prev) => ({ ...prev, date: dateStr }))}
                  />
                </div>
                <div>
                  <label className="block text-[14px] font-bold text-[#333333] mb-1">
                    Remarks
                  </label>
                  <input
                    name="description"
                    type="text"
                    placeholder="Brief remarks"
                    value={form.description}
                    onChange={handleFormChange}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSource()}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[0.84rem] text-slate-800 bg-white outline-none"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex gap-2.5">
                <button
                  onClick={handleAddSource}
                  disabled={submitting}
                  className="bg-[linear-gradient(95.15deg,#5597ED_3.84%,#00449C_96.38%)] text-white border-none rounded-full w-40 h-[35px] tracking-[-2%] font-medium text-[16px] leading-[100%] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Adding…' : 'Add Source'}
                </button>
                <button
                  onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
                  disabled={submitting}
                  className="text-white bg-[#999999] rounded-full w-40 h-[35px] leading-[100%] tracking-[-2%] font-medium text-[16px] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* ── Income Sources List ── */}
          {loading && (
            <div className="text-center text-slate-400 text-[0.9rem] py-6">
              Loading income sources…
            </div>
          )}

          {!loading && sources.length > 0 && (
            <div>
              <div className="text-[20px] leading-[136%] font-bold text-[#333333] mb-2.5">
                Income Sources
              </div>
              <div className="flex flex-col gap-2.5">
                {sources.map((src) => {
                  const tag = TAG_COLORS.default;
                  return (
                    <div
                      key={src.id}
                      className="group bg-white border border-slate-200 rounded-xl px-4 py-3.5 flex items-center justify-between gap-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2.5 mb-1">
                          {/* Tag color is dynamic runtime value — must be inline */}
                          <span
                            className="rounded-full px-3 py-0.5 text-[0.75rem] font-semibold whitespace-nowrap"
                            style={{
                              background: tag.bg,
                              color: tag.text,
                              border: `1px solid ${tag.border}`,
                            }}
                          >
                            {src.type}
                          </span>
                          <span className="text-[0.78rem] text-slate-400">
                            {formatDisplayDate(src.date)}
                          </span>
                        </div>
                        {src.description && (
                          <div className="text-[0.82rem] text-slate-500">
                            {src.description}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-[16px] font-extrabold text-[#0B57D0] whitespace-nowrap">
                          ₹{formatRupees(src.amount)}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteSource(src.id)}
                          disabled={deletingId === src.id}
                          className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500 cursor-pointer border-none transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <FiX className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 pt-3.5 pb-5 border-t border-slate-100 bg-white">
          <div className="flex gap-2.5 justify-center">
            <button
              onClick={onClose}
              className="text-white border-none rounded-full font-medium text-[20px] tracking-[-2%] leading-[100%] cursor-pointer transition-opacity duration-200 hover:opacity-90 h-[43px] w-[180px] bg-[linear-gradient(95.15deg,#5597ED_3.84%,#00449C_96.38%)]"
            >
              Export
            </button>
            <button
              onClick={onClose}
              className="text-white border-none rounded-full font-medium text-[20px] tracking-[-2%] leading-[100%] cursor-pointer transition-opacity duration-200 hover:opacity-80 h-[43px] w-[180px] bg-[#999999]"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function formatDisplayDate(str) {
  // dd-mm-yyyy → Jan 15, 2026
  if (!str) return '';
  const [dd, mm, yyyy] = str.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(mm, 10) - 1]} ${parseInt(dd, 10)}, ${yyyy}`;
}
