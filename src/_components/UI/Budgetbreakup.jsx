import React, { Fragment, useState, useMemo } from "react";
// import { GitBranch, X, Plus, Trash2, AlertTriangle } from "lucide-react";
import { FiGitBranch, FiTrash2, FiAlertTriangle   } from "react-icons/fi";
import { FaXTwitter } from "react-icons/fa6";
import { FaPlus } from "react-icons/fa";
// ---------- helpers ----------
const fmt = (n) => Math.round(n || 0).toLocaleString("en-IN");
const uid = (p = "id") => `${p}_${Math.random().toString(36).slice(2, 9)}`;

// ---------- dummy data ----------
const INITIAL_SECTIONS = [
  { id: "venue", name: "Venue & Decor", items: [
    { id: "v1", description: "Banquet Hall Rental" },
    { id: "v2", description: "Stage & Backdrop" },
    { id: "v3", description: "Floral Decoration" },
  ]},
  { id: "catering", name: "Catering", items: [
    { id: "c1", description: "Dinner Buffet (Veg)" },
    { id: "c2", description: "Dinner Buffet (Non-Veg)" },
    { id: "c3", description: "Welcome Drinks" },
  ]},
  { id: "logistics", name: "Logistics & AV", items: [
    { id: "l1", description: "Sound System" },
    { id: "l2", description: "Lighting" },
    { id: "l3", description: "Photography & Video" },
  ]},
];

const makeValues = (qtyUnitMap) =>
  Object.fromEntries(Object.entries(qtyUnitMap).map(([k, v]) => [k, { qty: v[0], unitCost: v[1] }]));

const INITIAL_VERSIONS = [
  {
    id: "v_50",
    label: "V1",
    paxLabel: "50 PAX",
    sectionBudgets: { venue: 150000, catering: 100000, logistics: 60000 },
    values: makeValues({
      v1: [1, 100000], v2: [1, 30000], v3: [1, 20000],
      c1: [50, 1200], c2: [50, 1400], c3: [50, 200],
      l1: [1, 25000], l2: [1, 20000], l3: [1, 15000],
    }),
  },
  {
    id: "v_75",
    label: "V2",
    paxLabel: "75 PAX",
    sectionBudgets: { venue: 175000, catering: 142500, logistics: 65000 },
    values: makeValues({
      v1: [1, 120000], v2: [1, 35000], v3: [1, 20000],
      c1: [75, 1200], c2: [75, 1400], c3: [75, 200],
      l1: [1, 28000], l2: [1, 22000], l3: [1, 15000],
    }),
  },
];

const INITIAL_ACTUALS = makeValues({
  v1: [1, 125000], v2: [1, 38000], v3: [1, 24000],
  c1: [70, 1250], c2: [78, 1450], c3: [80, 220],
  l1: [1, 30000], l2: [1, 21000], l3: [1, 18000],
});

const INITIAL_EXPENSE_SUBITEMS = {
  venue: [{ expenseId: "exp_v1", subItemId: "si_v1", label: "Valet Parking", attendees: 1, unitCost: 8000, amount: 8000 }],
  catering: [],
  logistics: [{ expenseId: "exp_l1", subItemId: "si_l1", label: "Drone Camera Add-on", attendees: 1, unitCost: 5000, amount: 5000 }],
};

// ---------- small reusable input ----------
function EditableCell({ value, onChange, isHighlighted, className = "" }) {
  return (
    <input
      type="number"
      min="0"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className={`w-full text-sm text-right bg-transparent border border-transparent rounded hover:border-gray-300 focus:border-blue-400 focus:bg-white focus:outline-none px-1 py-0.5 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
        isHighlighted ? "font-semibold" : ""
      } ${className}`}
    />
  );
}

// Pair of Qty/Cost/Total cells for a single version+item — collapses 3 nearly-identical blocks into 1
function VersionCells({ vals, prevVals, onQty, onCost }) {
  const qtyChanged = prevVals && vals.qty !== prevVals.qty;
  const costChanged = prevVals && vals.unitCost !== prevVals.unitCost;
  const total = vals.qty * vals.unitCost;
  return (
    <>
      <td className={`py-2 px-2 border-b border-l border-gray-100 ${qtyChanged ? "bg-yellow-50" : ""}`}>
        <EditableCell value={vals.qty} onChange={onQty} isHighlighted={qtyChanged} className={qtyChanged ? "text-yellow-800" : ""} />
      </td>
      <td className={`py-2 px-2 border-b border-gray-100 ${costChanged ? "bg-yellow-50" : ""}`}>
        <EditableCell value={vals.unitCost} onChange={onCost} isHighlighted={costChanged} className={costChanged ? "text-yellow-800" : ""} />
      </td>
      <td className={`py-2 px-3 text-right border-b border-gray-100 font-medium ${qtyChanged || costChanged ? "bg-yellow-50 text-yellow-900" : "text-gray-700"}`}>
        {fmt(total)}
      </td>
    </>
  );
}

export default function BudgetBreakup() {
  const [sections, setSections] = useState(INITIAL_SECTIONS);
  const [versions, setVersions] = useState(INITIAL_VERSIONS);
  const [actuals, setActuals] = useState(INITIAL_ACTUALS);
  const [expenseSubItemsBySection, setExpenseSubItemsBySection] = useState(INITIAL_EXPENSE_SUBITEMS);

  const [showAddVersion, setShowAddVersion] = useState(false);
  const [newPax, setNewPax] = useState("");
  const [addItemSectionId, setAddItemSectionId] = useState(null);
  const [newItemDesc, setNewItemDesc] = useState("");

  const latestVersion = versions[versions.length - 1];

  // ---- derived totals ----
  const expenseActualsBySection = useMemo(() => {
    const out = {};
    for (const sec of sections) {
      const subTotal = (expenseSubItemsBySection[sec.id] || []).reduce((s, si) => s + (si.amount || 0), 0);
      const itemsTotal = sec.items.reduce((s, item) => {
        const av = actuals[item.id] || { qty: 0, unitCost: 0 };
        return s + av.qty * av.unitCost;
      }, 0);
      out[sec.id] = subTotal + itemsTotal;
    }
    return out;
  }, [sections, actuals, expenseSubItemsBySection]);

  const totalActualSpent = useMemo(
    () => Object.values(expenseActualsBySection).reduce((s, n) => s + n, 0),
    [expenseActualsBySection]
  );
  const latestGrandTotal = useMemo(
    () => Object.values(latestVersion.sectionBudgets).reduce((s, n) => s + n, 0),
    [latestVersion]
  );
  const isOverallOverBudget = totalActualSpent > latestGrandTotal && totalActualSpent > 0;

  // ---- handlers ----
  const handleVersionValueChange = (versionId, itemKey, field, value) =>
    setVersions((vs) =>
      vs.map((v) =>
        v.id !== versionId
          ? v
          : { ...v, values: { ...v.values, [itemKey]: { ...(v.values[itemKey] || { qty: 0, unitCost: 0 }), [field]: value } } }
      )
    );

  const handleSectionBudgetChange = (versionId, sectionId, value) =>
    setVersions((vs) =>
      vs.map((v) => (v.id !== versionId ? v : { ...v, sectionBudgets: { ...v.sectionBudgets, [sectionId]: value } }))
    );

  const handleActualChange = (itemId, field, value) =>
    setActuals((a) => ({ ...a, [itemId]: { ...(a[itemId] || { qty: 0, unitCost: 0 }), [field]: value } }));

  const handleSubItemChange = (expenseId, subItemId, field, value) =>
    setExpenseSubItemsBySection((prev) => {
      const next = {};
      for (const [secId, list] of Object.entries(prev)) {
        next[secId] = list.map((si) => {
          if (si.expenseId !== expenseId || si.subItemId !== subItemId) return si;
          const updated = { ...si, [field]: field === "label" ? value : value === "" ? "" : Number(value) };
          updated.amount = (Number(updated.attendees) || 0) * (Number(updated.unitCost) || 0);
          return updated;
        });
      }
      return next;
    });

  const handleAddVersion = () => {
    const pax = parseInt(newPax, 10);
    if (!pax || pax <= 0) return;
    const base = latestVersion;
    setVersions((vs) => [
      ...vs,
      {
        id: uid("v"),
        label: `V${vs.length + 1}`,
        paxLabel: `${pax} PAX`,
        sectionBudgets: { ...base.sectionBudgets },
        values: JSON.parse(JSON.stringify(base.values)),
      },
    ]);
    setNewPax("");
    setShowAddVersion(false);
  };

  const handleRemoveVersion = (versionId) => setVersions((vs) => (vs.length > 1 ? vs.filter((v) => v.id !== versionId) : vs));

  const handleAddItem = (sectionId) => {
    if (!newItemDesc.trim()) return;
    const itemId = uid("item");
    setSections((secs) =>
      secs.map((s) => (s.id !== sectionId ? s : { ...s, items: [...s.items, { id: itemId, description: newItemDesc.trim() }] }))
    );
    setVersions((vs) => vs.map((v) => ({ ...v, values: { ...v.values, [itemId]: { qty: 0, unitCost: 0 } } })));
    setNewItemDesc("");
    setAddItemSectionId(null);
  };

  const handleRemoveItem = (sectionId, itemId) =>
    setSections((secs) => secs.map((s) => (s.id !== sectionId ? s : { ...s, items: s.items.filter((i) => i.id !== itemId) })));

  const handleRemoveSection = (sectionId) => setSections((secs) => secs.filter((s) => s.id !== sectionId));

  const colCount = 3 * versions.length + 4;

  return (
    <div className="border-t border-gray-200 pt-6 bg-white py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Budget Breakup</h3>
          <p className="text-xs text-gray-500 mt-0.5">Click any cell to edit • Yellow = changed from previous version • Red = over budget</p>
        </div>
        <div className="flex items-center gap-2">
          {showAddVersion ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={newPax}
                onChange={(e) => setNewPax(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddVersion(); if (e.key === "Escape") setShowAddVersion(false); }}
                placeholder="PAX count (e.g. 50)"
                className="w-44 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button onClick={handleAddVersion} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">Add</button>
              <button onClick={() => setShowAddVersion(false)} className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
            </div>
          ) : (
            <button onClick={() => setShowAddVersion(true)} className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors">
              <FiGitBranch className="w-4 h-4" /> Add Version
            </button>
          )}
        </div>
      </div>

      {/* Version pills */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {versions.map((v) => (
          <div key={v.id} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${v.id === latestVersion.id ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300"}`}>
            <span>{v.label} — {v.paxLabel}</span>
            {versions.length > 1 && (
              <button onClick={() => handleRemoveVersion(v.id)} className="opacity-60 hover:opacity-100 transition-opacity ml-0.5">
                <FaXTwitter className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-green-50 text-green-700 border-green-200">
          <span>Actual Amount</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200 w-[200px]">Category / Item</th>
              {versions.map((v) => (
                <th key={v.id} colSpan={3} className="text-center py-3 px-2 font-semibold text-gray-700 border-b border-l border-gray-200">
                  <div className="text-xs text-gray-500 font-normal">Considering {v.paxLabel}</div>
                  <div>Budget Amount — {v.label}</div>
                </th>
              ))}
              <th colSpan={3} className="text-center py-3 px-2 font-semibold text-green-700 border-b border-l border-gray-200 bg-green-50">Actual Amount</th>
              <th className="py-3 px-2 border-b border-l border-gray-200 w-8" />
            </tr>
            <tr className="bg-gray-50 text-xs text-gray-500">
              <th className="text-left py-2 px-4 border-b border-gray-200 font-normal" />
              {versions.map((v) => (
                <Fragment key={v.id + "-sub"}>
                  <th className="py-2 px-2 text-right border-b border-l border-gray-200 font-medium w-14">Qty</th>
                  <th className="py-2 px-2 text-right border-b border-gray-200 font-medium w-24">Amt wo GST</th>
                  <th className="py-2 px-2 text-right border-b border-gray-200 font-medium w-24">Total</th>
                </Fragment>
              ))}
              <th className="py-2 px-2 text-right border-b border-l border-gray-200 font-medium bg-green-50 w-14">Qty</th>
              <th className="py-2 px-2 text-right border-b border-gray-200 font-medium bg-green-50 w-24">Amt wo GST</th>
              <th className="py-2 px-2 text-right border-b border-gray-200 font-medium bg-green-50 w-24">Total</th>
              <th className="py-2 px-2 border-b border-l border-gray-200 w-8" />
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => {
              const latestSectionBudget = latestVersion.sectionBudgets[section.id] ?? 0;
              const actualSectionTotal = expenseActualsBySection[section.id] || 0;
              const sectionOverBudget = actualSectionTotal > latestSectionBudget && actualSectionTotal > 0;

              return (
                <Fragment key={section.id}>
                  {/* Section header row */}
                  <tr className="bg-gray-100 group">
                    <td className="py-2.5 px-4 font-semibold text-gray-800 border-b border-gray-200">{section.name}</td>
                    {versions.map((v, vi) => {
                      const sTotal = v.sectionBudgets[section.id] ?? 0;
                      const prevTotal = vi > 0 ? versions[vi - 1].sectionBudgets[section.id] ?? 0 : null;
                      const changed = prevTotal !== null && sTotal !== prevTotal;
                      return (
                        <Fragment key={v.id + "-s"}>
                          <td className="py-2.5 px-2 border-b border-l border-gray-200" />
                          <td className="py-2.5 px-2 border-b border-gray-200" />
                          <td className={`py-2.5 px-2 font-semibold text-right border-b border-gray-200 ${changed ? "bg-yellow-100" : ""}`}>
                            <EditableCell value={sTotal} onChange={(val) => handleSectionBudgetChange(v.id, section.id, val)} isHighlighted={changed} className={changed ? "text-yellow-800 font-semibold" : "font-semibold text-gray-800"} />
                          </td>
                        </Fragment>
                      );
                    })}
                    <td className="py-2.5 px-2 border-b border-l border-gray-200 bg-green-50" />
                    <td className="py-2.5 px-2 border-b border-gray-200 bg-green-50" />
                    <td className={`py-2.5 px-3 font-semibold text-right border-b border-gray-200 ${sectionOverBudget ? "bg-red-100 text-red-700" : "bg-green-50 text-gray-800"}`}>
                      <div className="flex items-center justify-end gap-1">
                        {sectionOverBudget && <FiAlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                        ₹{fmt(actualSectionTotal)}
                      </div>
                    </td>
                    <td className="py-2.5 px-2 border-b border-l border-gray-200 text-center">
                      <button onClick={() => handleRemoveSection(section.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>

                  {/* Expense sub-item rows */}
                  {(expenseSubItemsBySection[section.id] || []).map((si) => (
                    <tr key={si.subItemId} className="bg-green-50/40">
                      <td className="py-1.5 px-4 border-b border-gray-100 pl-7">
                        <input
                          type="text"
                          value={si.label}
                          onChange={(e) => handleSubItemChange(si.expenseId, si.subItemId, "label", e.target.value)}
                          placeholder="—"
                          className="w-full text-sm italic text-gray-600 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-400 focus:outline-none px-0 py-0.5 transition-colors placeholder:not-italic placeholder:text-gray-400"
                        />
                      </td>
                      {versions.map(() => (
                        <Fragment key={uid("blank")}>
                          <td className="py-1 px-2 border-b border-l border-gray-100" />
                          <td className="py-1 px-2 border-b border-gray-100" />
                          <td className="py-1 px-3 border-b border-gray-100" />
                        </Fragment>
                      ))}
                      <td className="py-1 px-2 border-b border-l border-gray-100 bg-green-50/60">
                        <EditableCell value={si.attendees} onChange={(val) => handleSubItemChange(si.expenseId, si.subItemId, "attendees", val)} />
                      </td>
                      <td className="py-1 px-2 border-b border-gray-100 bg-green-50/60">
                        <EditableCell value={si.unitCost} onChange={(val) => handleSubItemChange(si.expenseId, si.subItemId, "unitCost", val)} />
                      </td>
                      <td className="py-1 px-3 border-b border-gray-100 bg-green-50/60 text-right text-sm font-medium text-green-700">
                        {fmt(si.amount)}
                      </td>
                      <td className="py-1.5 px-2 border-b border-l border-gray-100" />
                    </tr>
                  ))}

                  {/* Budget item rows */}
                  {section.items.map((item) => {
                    const av = actuals[item.id] || { qty: 0, unitCost: 0 };
                    const actualTotal = av.qty * av.unitCost;
                    const latestVals = latestVersion.values[item.id] || { qty: 0, unitCost: 0 };
                    const budgetTotal = latestVals.qty * latestVals.unitCost;
                    const over = actualTotal > budgetTotal && budgetTotal > 0 && actualTotal > 0;

                    return (
                      <tr key={item.id} className="group hover:bg-gray-50 transition-colors">
                        <td className="py-2 px-4 text-gray-700 border-b border-gray-100 pl-7">{item.description}</td>
                        {versions.map((v, vi) => {
                          const vals = v.values[item.id] || { qty: 0, unitCost: 0 };
                          const prevVals = vi > 0 ? versions[vi - 1].values[item.id] || { qty: 0, unitCost: 0 } : null;
                          return (
                            <VersionCells
                              key={v.id + item.id}
                              vals={vals}
                              prevVals={prevVals}
                              onQty={(val) => handleVersionValueChange(v.id, item.id, "qty", val)}
                              onCost={(val) => handleVersionValueChange(v.id, item.id, "unitCost", val)}
                            />
                          );
                        })}
                        <td className={`py-2 px-2 border-b border-l border-gray-100 ${over ? "bg-red-50" : "bg-green-50/20"}`}>
                          <EditableCell value={av.qty} onChange={(val) => handleActualChange(item.id, "qty", val)} className={over ? "text-red-700" : ""} />
                        </td>
                        <td className={`py-2 px-2 border-b border-gray-100 ${over ? "bg-red-50" : "bg-green-50/20"}`}>
                          <EditableCell value={av.unitCost} onChange={(val) => handleActualChange(item.id, "unitCost", val)} className={over ? "text-red-700" : ""} />
                        </td>
                        <td className={`py-2 px-3 text-right border-b border-gray-100 font-medium ${over ? "bg-red-100 text-red-700" : "bg-green-50/20 text-gray-700"}`}>
                          <div className="flex items-center justify-end gap-1">
                            {over && <FiAlertTriangle className="w-3 h-3 text-red-500" />}
                            {fmt(actualTotal)}
                          </div>
                        </td>
                        <td className="py-2 px-2 border-b border-l border-gray-100 text-center">
                          <button onClick={() => handleRemoveItem(section.id, item.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-colors">
                            <FaXTwitter className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Add item row */}
                  <tr className="bg-gray-50/50">
                    <td colSpan={colCount} className="py-1.5 px-4 border-b border-gray-100">
                      {addItemSectionId === section.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newItemDesc}
                            onChange={(e) => setNewItemDesc(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleAddItem(section.id); if (e.key === "Escape") setAddItemSectionId(null); }}
                            placeholder="Item description..."
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            autoFocus
                          />
                          <button onClick={() => handleAddItem(section.id)} className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors">Add</button>
                          <button onClick={() => setAddItemSectionId(null)} className="px-2 py-1 border border-gray-300 text-gray-600 text-xs rounded hover:bg-gray-50 transition-colors">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => { setAddItemSectionId(section.id); setNewItemDesc(""); }} className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors py-0.5">
                          <FaPlus className="w-3 h-3" /> Add item to {section.name}
                        </button>
                      )}
                    </td>
                  </tr>
                </Fragment>
              );
            })}

            {/* Grand total row */}
            <tr className="bg-gray-100 font-bold">
              <td className="py-3 px-4 text-gray-900 border-t border-gray-300">Grand Total</td>
              {versions.map((v) => {
                const vTotal = Object.values(v.sectionBudgets).reduce((s, n) => s + n, 0);
                return (
                  <Fragment key={v.id + "-gt"}>
                    <td className="py-3 px-2 border-t border-l border-gray-300" />
                    <td className="py-3 px-2 border-t border-gray-300" />
                    <td className="py-3 px-3 text-right border-t border-gray-300 text-gray-900">₹{fmt(vTotal)}</td>
                  </Fragment>
                );
              })}
              <td className="py-3 px-2 border-t border-l border-gray-300 bg-green-50" />
              <td className="py-3 px-2 border-t border-gray-300 bg-green-50" />
              <td className={`py-3 px-3 text-right border-t border-gray-300 font-bold ${isOverallOverBudget ? "text-red-700 bg-red-100" : "text-gray-900 bg-green-50"}`}>
                <div className="flex items-center justify-end gap-1">
                  {isOverallOverBudget && <FiAlertTriangle className="w-4 h-4 text-red-500" />}
                  ₹{fmt(totalActualSpent)}
                </div>
              </td>
              <td className="py-3 px-2 border-t border-l border-gray-300" />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-xs text-gray-500 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-300" />
          <span>Changed from previous version</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-red-100 border border-red-300" />
          <span>Over budget (actual &gt; latest version)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <FiAlertTriangle className="w-3.5 h-3.5 text-red-500" />
          <span>Budget exceeded</span>
        </div>
      </div>
    </div>
  );
}