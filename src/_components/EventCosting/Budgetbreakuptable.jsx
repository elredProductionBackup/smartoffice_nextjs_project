import { Fragment, useState } from "react";
import { AlertTriangle, Plus, Trash2, X } from "lucide-react";
import { fmt } from "./utils";
import { EditableCell } from "./EditableCell";

export function BudgetBreakupTable({
  sections,
  versions,
  latestVersion,
  actuals,
  totalActualSpent,
  expenseActualsBySection,
  expenseSubItemsBySection,
  onSectionBudgetChange,
  onVersionValueChange,
  onActualChange,
  onSubItemFieldChange,
  onRemoveSection,
  onRemoveItem,
  onAddItem,
}) {
  const [addItemSectionId, setAddItemSectionId] = useState(null);
  const [newItemDesc, setNewItemDesc] = useState("");

  const isOverallOverBudget =
    totalActualSpent > Object.values(latestVersion.sectionBudgets).reduce((s, v) => s + v, 0) &&
    totalActualSpent > 0;

  const submitNewItem = (sectionId) => {
    if (!newItemDesc.trim()) return;
    onAddItem(sectionId, newItemDesc.trim());
    setNewItemDesc("");
    setAddItemSectionId(null);
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm border-collapse min-w-[900px]">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200 w-[200px]">
              Category / Item
            </th>
            {versions.map((v) => (
              <th
                key={v.id}
                colSpan={3}
                className="text-center py-3 px-2 font-semibold text-gray-700 border-b border-l border-gray-200"
              >
                <div className="text-xs text-gray-500 font-normal">{v.label ==="V1" && "Considering as initial version"}
                   {/* {v.paxLabel} */}
                </div>
                <div>Budget Amount — {v.label}</div>
              </th>
            ))}
            <th colSpan={3} className="text-center py-3 px-2 font-semibold text-green-700 border-b border-l border-gray-200 bg-green-50">
              Actual Amount
            </th>
            <th className="py-3 px-2 border-b border-l border-gray-200 w-8" />
          </tr>
          <tr className="bg-gray-50 text-xs text-gray-500">
            <th className="text-left py-2 px-4 border-b border-gray-200 font-normal" />
            {versions.map((v) => (
              <Fragment key={v.id + "-sub-header"}>
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
                  <td className="py-2.5 px-4 font-semibold text-gray-800 border-b border-gray-200">
                    <span>{section.name}</span>
                  </td>
                  {versions.map((v, vi) => {
                    const sTotal = v.sectionBudgets[section.id] ?? 0;
                    const prevV = vi > 0 ? versions[vi - 1] : null;
                    const prevTotal = prevV ? (prevV.sectionBudgets[section.id] ?? 0) : null;
                    const changed = prevTotal !== null && sTotal !== prevTotal;
                    return (
                      <Fragment key={v.id + "-s-cols"}>
                        <td className="py-2.5 px-2 border-b border-l border-gray-200" />
                        <td className="py-2.5 px-2 border-b border-gray-200" />
                        <td className={`py-2.5 px-2 font-semibold text-right border-b border-gray-200 ${changed ? "bg-yellow-100" : ""}`}>
                          <EditableCell
                            value={sTotal}
                            onChange={(val) => onSectionBudgetChange(v.id, section.id, val)}
                            isHighlighted={changed}
                            className={changed ? "text-yellow-800 font-semibold" : "font-semibold text-gray-800"}
                          />
                        </td>
                      </Fragment>
                    );
                  })}
                  <td className="py-2.5 px-2 border-b border-l border-gray-200 bg-green-50" />
                  <td className="py-2.5 px-2 border-b border-gray-200 bg-green-50" />
                  <td className={`py-2.5 px-3 font-semibold text-right border-b border-gray-200 ${sectionOverBudget ? "bg-red-100 text-red-700" : "bg-green-50 text-gray-800"}`}>
                    <div className="flex items-center justify-end gap-1">
                      {sectionOverBudget && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                      ₹{fmt(actualSectionTotal)}
                    </div>
                  </td>
                  <td className="py-2.5 px-2 border-b border-l border-gray-200 text-center">
                    <button
                      onClick={() => onRemoveSection(section.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>

                {/* Expense sub-item rows — only those not already shown as budget item rows */}
                {(expenseSubItemsBySection[section.id] || [])
                  .filter((si) => !section.items.some((item) => item.id === si.subItemId))
                  .map((si, siIdx) => (
                    <tr key={`exp-si-${section.id}-${siIdx}`} className="bg-green-50/40">
                      <td className="py-1.5 px-4 border-b border-gray-100 pl-7">
                        <input
                          type="text"
                          value={si.label}
                          onChange={(e) => onSubItemFieldChange(si.expenseId, si.subItemId, "description", e.target.value)}
                          placeholder="—"
                          className="w-full text-sm italic text-gray-600 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-400 focus:outline-none px-0 py-0.5 transition-colors placeholder:not-italic placeholder:text-gray-400"
                        />
                      </td>
                      {versions.map((v) => {
                        const vKey = `${si.expenseId}-${si.subItemId}`;
                        const vals = v.values[vKey] || { qty: 0, unitCost: 0 };
                        const total = vals.qty * vals.unitCost;
                        return (
                          <Fragment key={v.id + `-exp-si-${siIdx}`}>
                            <td className="py-1 px-2 border-b border-l border-gray-100">
                              <input
                                type="number"
                                min="0"
                                value={vals.qty}
                                placeholder="Qty"
                                onChange={(e) => onVersionValueChange(v.id, vKey, "qty", parseFloat(e.target.value) || 0)}
                                className="w-full text-sm text-right bg-transparent border border-transparent rounded hover:border-gray-300 focus:border-blue-400 focus:bg-white focus:outline-none px-1 py-0.5 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                            </td>
                            <td className="py-1 px-2 border-b border-gray-100">
                              <input
                                type="number"
                                min="0"
                                value={vals.unitCost}
                                placeholder="Amt"
                                onChange={(e) => onVersionValueChange(v.id, vKey, "unitCost", parseFloat(e.target.value) || 0)}
                                className="w-full text-sm text-right bg-transparent border border-transparent rounded hover:border-gray-300 focus:border-blue-400 focus:bg-white focus:outline-none px-1 py-0.5 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                            </td>
                            <td className="py-1 px-3 border-b border-gray-100 text-right text-sm font-medium text-gray-700">
                              {total > 0 ? fmt(total) : "0"}
                            </td>
                          </Fragment>
                        );
                      })}
                      <td className="py-1 px-2 border-b border-l border-gray-100 bg-green-50/60">
                        <input
                          type="number"
                          min="0"
                          value={si.attendees === "" ? "0" : si.attendees}
                          onChange={(e) => onSubItemFieldChange(si.expenseId, si.subItemId, "attendees", e.target.value)}
                          placeholder="Qty"
                          className="w-full text-sm text-right text-gray-700 bg-transparent border border-transparent rounded hover:border-gray-300 focus:border-blue-400 focus:bg-white focus:outline-none px-1 py-0.5 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </td>
                      <td className="py-1 px-2 border-b border-gray-100 bg-green-50/60">
                        <input
                          type="number"
                          min="0"
                          value={si.unitCost === "" ? "0" : si.unitCost}
                          onChange={(e) => onSubItemFieldChange(si.expenseId, si.subItemId, "unitCost", e.target.value)}
                          placeholder="Amt"
                          className="w-full text-sm text-right text-gray-700 bg-transparent border border-transparent rounded hover:border-gray-300 focus:border-blue-400 focus:bg-white focus:outline-none px-1 py-0.5 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </td>
                      <td className="py-1 px-3 border-b border-gray-100 bg-green-50/60 text-right text-sm font-medium text-green-700">
                        {si.amount > 0 ? fmt(si.amount) : "0"}
                      </td>
                      <td className="py-1.5 px-2 border-b border-l border-gray-100" />
                    </tr>
                  ))}

                {/* Budget item rows */}
                {section.items.map((item) => (
                  <tr key={item.id} className="group hover:bg-gray-50 transition-colors">
                    <td className="py-2 px-4 text-gray-700 border-b border-gray-100 pl-7">{item.description}</td>
                    {versions.map((v, vi) => {
                      const vals = v.values[item.id] || { qty: 0, unitCost: 0 };
                      const prevV = vi > 0 ? versions[vi - 1] : null;
                      const prevVals = prevV ? (prevV.values[item.id] || { qty: 0, unitCost: 0 }) : null;
                      const qtyChanged = prevVals !== null && vals.qty !== prevVals.qty;
                      const costChanged = prevVals !== null && vals.unitCost !== prevVals.unitCost;
                      const total = vals.qty * vals.unitCost;

                      return (
                        <Fragment key={v.id + item.id + "-cols"}>
                          <td className={`py-2 px-2 border-b border-l border-gray-100 ${qtyChanged ? "bg-yellow-50" : ""}`}>
                            <EditableCell
                              value={vals.qty}
                              onChange={(val) => onVersionValueChange(v.id, item.id, "qty", val)}
                              isHighlighted={qtyChanged}
                              className={qtyChanged ? "text-yellow-800" : ""}
                            />
                          </td>
                          <td className={`py-2 px-2 border-b border-gray-100 ${costChanged ? "bg-yellow-50" : ""}`}>
                            <EditableCell
                              value={vals.unitCost}
                              onChange={(val) => onVersionValueChange(v.id, item.id, "unitCost", val)}
                              isHighlighted={costChanged}
                              className={costChanged ? "text-yellow-800" : ""}
                            />
                          </td>
                          <td className={`py-2 px-3 text-right border-b border-gray-100 font-medium ${qtyChanged || costChanged ? "bg-yellow-50 text-yellow-900" : "text-gray-700"}`}>
                            {fmt(total)}
                          </td>
                        </Fragment>
                      );
                    })}
                    {(() => {
                      const av = actuals[item.id] || { qty: 0, unitCost: 0 };
                      const actualTotal = av.qty * av.unitCost;
                      const vv = latestVersion.values[item.id] || { qty: 0, unitCost: 0 };
                      const budgetTotal = vv.qty * vv.unitCost;
                      const over = actualTotal > budgetTotal && budgetTotal > 0 && actualTotal > 0;
                      return (
                        <Fragment key={item.id + "-actual-cols"}>
                          <td className={`py-2 px-2 border-b border-l border-gray-100 ${over ? "bg-red-50" : "bg-green-50/20"}`}>
                            <EditableCell
                              value={av.qty}
                              onChange={(val) => onActualChange(item.id, "qty", val)}
                              className={over ? "text-red-700" : ""}
                              editable={false}
                            />
                          </td>
                          <td className={`py-2 px-2 border-b border-gray-100 ${over ? "bg-red-50" : "bg-green-50/20"}`}>
                            <EditableCell
                              value={av.unitCost}
                              onChange={(val) => onActualChange(item.id, "unitCost", val)}
                              className={over ? "text-red-700" : ""}
                               editable={false}
                            />
                          </td>
                          <td className={`py-2 px-3 text-right border-b border-gray-100 font-medium ${over ? "bg-red-100 text-red-700" : "bg-green-50/20 text-gray-700"}`}>
                            <div className="flex items-center justify-end gap-1">
                              {over && <AlertTriangle className="w-3 h-3 text-red-500" />}
                              {fmt(actualTotal)}
                            </div>
                          </td>
                        </Fragment>
                      );
                    })()}
                    <td className="py-2 px-2 border-b border-l border-gray-100 text-center">
                      <button
                        onClick={() => onRemoveItem(section.id, item.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Add item row */}
                <tr className="bg-gray-50/50">
                  <td colSpan={3 * versions.length + 4} className="py-1.5 px-4 border-b border-gray-100">
                    {addItemSectionId === section.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newItemDesc}
                          onChange={(e) => setNewItemDesc(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") submitNewItem(section.id);
                            if (e.key === "Escape") setAddItemSectionId(null);
                          }}
                          placeholder="Item description..."
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          autoFocus
                        />
                        <button
                          onClick={() => submitNewItem(section.id)}
                          className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setAddItemSectionId(null)}
                          className="px-2 py-1 border border-gray-300 text-gray-600 text-xs rounded hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setAddItemSectionId(section.id);
                          setNewItemDesc("");
                        }}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors py-0.5"
                      >
                        <Plus className="w-3 h-3" /> Add item to {section.name}
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
              const vTotal = Object.values(v.sectionBudgets).reduce((sum, n) => sum + n, 0);
              return (
                <Fragment key={v.id + "-gt-cols"}>
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
                {isOverallOverBudget && <AlertTriangle className="w-4 h-4 text-red-500" />}
                ₹{fmt(totalActualSpent)}
              </div>
            </td>
            <td className="py-3 px-2 border-t border-l border-gray-300" />
          </tr>
        </tbody>
      </table>
    </div>
  );
}