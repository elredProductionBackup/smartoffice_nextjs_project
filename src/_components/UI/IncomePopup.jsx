'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FiTrendingUp, FiX, FiPlus, FiChevronDown } from 'react-icons/fi';

const INCOME_TYPES = [
  'Initiation fee',
  'Yearly Subscription',
  'Corpus Fund',
  'Portfolio Income',
  'Event Participation',
  'Subsidies',
  'Other',
];

// Dynamic runtime colors — cannot be expressed as Tailwind classes
const TAG_COLORS = {
  'Initiation fee': { bg: '#e8f0fe', text: '#1a56db', border: '#c3d3fc' },
  'Yearly Subscription': { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
  'Corpus Fund': { bg: '#fef3c7', text: '#b45309', border: '#fde68a' },
  'Portfolio Income': { bg: '#fce7f3', text: '#be185d', border: '#fbcfe8' },
  'Sponsorship': { bg: '#ede9fe', text: '#7c3aed', border: '#ddd6fe' },
  'Event Revenue': { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
  'Other': { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
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

const INITIAL_SOURCES = [
  { id: 1, type: 'Initiation fee', date: '15-01-2026', description: 'New member joining fee', amount: 50000 },
  { id: 2, type: 'Yearly Subscription', date: '01-01-2026', description: 'Annual membership subscriptions', amount: 75000 },
];

const EMPTY_FORM = { type: 'Initiation fee', amount: '', date: today(), description: '' };

/* ── Custom Income-Type Dropdown ── */
function IncomeTypeDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative w-full">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white text-[0.84rem] text-slate-800 cursor-pointer outline-none text-left"
      >
        {value}
        <FiChevronDown
          className="ml-2 shrink-0 text-slate-500 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {/* Dropdown panel — matches the reference image */}
      {open && (
        <div className="absolute top-[calc(100%+6px)] left-0 w-[336px] h-[298px] bg-white rounded-[14px] z-[9999] overflow-y-auto p-2"
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.13)' }}
        >
          {INCOME_TYPES.map((t, i) => {
            const isSelected = t === value;
            return (
              <button
                key={t}
                type="button"
                onMouseDown={() => { onChange(t); setOpen(false); }}
                className={[
                  'block w-full text-left px-4 py-2.5 cursor-pointer border-none rounded-lg transition-colors duration-150',
                  "font-['Nunito_Sans'] font-medium text-[16px] leading-[136%] tracking-[0%] text-[#333333]",
                  isSelected ? 'bg-indigo-50' : 'bg-transparent hover:bg-slate-50',
                ].join(' ')}
              >
                {t}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function IncomePopup({ onClose }) {
  const [sources, setSources] = useState(INITIAL_SOURCES);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [nextId, setNextId] = useState(3);

  const totalIncome = sources.reduce((acc, s) => acc + Number(s.amount), 0);

  const handleAddSource = () => {
    if (!form.amount || isNaN(Number(form.amount))) return;
    setSources((prev) => [...prev, { ...form, id: nextId, amount: Number(form.amount) }]);
    setNextId((n) => n + 1);
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <>
      {/* ── Overlay ── */}
      <div
        className="fixed inset-0 z-[9998] backdrop-blur-sm"
        style={{ background: 'rgba(15,23,42,0.45)' }}
        onClick={onClose}
      />

      {/* ── Modal ── */}
      <div
        className="fixed z-[9999] flex flex-col overflow-hidden bg-white rounded-[20px] w-[800px] h-[900px] max-w-[95vw] max-h-[92vh] font-nunito"
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
          className="px-6 py-[14px] flex items-center justify-between border-b border-slate-100"
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
                  <IncomeTypeDropdown
                    value={form.type}
                    onChange={(t) => setForm((prev) => ({ ...prev, type: t }))}
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
                  <input
                    name="date"
                    type="date"
                    value={toInputDate(form.date)}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, date: fromInputDate(e.target.value) }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[0.84rem] text-slate-800 bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[14px] font-bold text-[#333333] mb-1">
                    Description
                  </label>
                  <input
                    name="description"
                    type="text"
                    placeholder="Brief description"
                    value={form.description}
                    onChange={handleFormChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[0.84rem] text-slate-800 bg-white outline-none"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex gap-2.5">
                <button
                  onClick={handleAddSource}
                  className="bg-[linear-gradient(95.15deg,#5597ED_3.84%,#00449C_96.38%)] text-white border-none rounded-full w-[160px] h-[35px] tracking-[-2%] font-medium text-[16px] leading-[100%] cursor-pointer"
                >
                  Add Source
                </button>
                <button
                  onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
                  className="text-white bg-[#999999] rounded-full w-[160px] h-[35px] leading-[100%] tracking-[-2%] font-medium text-[16px] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* ── Income Sources List ── */}
          {sources.length > 0 && (
            <div>
              <div className="text-[20px] leading-[136%] font-bold text-[#333333] mb-2.5">
                Income Sources
              </div>
              <div className="flex flex-col gap-2.5">
                {sources.map((src) => {
                  const tag = TAG_COLORS[src.type] || TAG_COLORS['Other'];
                  return (
                    <div
                      key={src.id}
                      className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 flex items-start justify-between gap-3"
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
                      <div className="text-[16px] font-extrabold text-[#0B57D0] whitespace-nowrap">
                        ₹{formatRupees(src.amount)}
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
