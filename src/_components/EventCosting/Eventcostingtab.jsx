import { useState } from "react";
import { categoriesToSectionBudgets, categoriesToSections, categorySlug, getSectionTotal } from "./utils";
import { BudgetOverviewBar } from "./Budgetoverviewbar";
import { BudgetVersionPills } from "./Budgetversionpills";
import { BudgetBreakupTable } from "./Budgetbreakuptable";
import { ExpenseItemsSection } from "./Expenseitemssection";
import { PieChartPanel } from "./Piechartpanel";

const DEFAULT_CATEGORIES = [
  { name: "Workshops & Training", percentage: 33 },
  { name: "Speaker Sessions", percentage: 28 },
  { name: "Books & Resources", percentage: 19 },
  { name: "Certification Programs", percentage: 20 },
];

export function EventCostingTab({
  totalBudget,
  categories = DEFAULT_CATEGORIES,
  onBudgetChange,
  onCategoriesChange,
}) {
  const [budgetCategories, setBudgetCategories] = useState(categories);
  const [budget, setBudget] = useState(totalBudget);

  const [sections, setSections] = useState(() => categoriesToSections(budgetCategories));
  const [versions, setVersions] = useState(() => {
    const sb = categoriesToSectionBudgets(budgetCategories, totalBudget);
    return [{ id: "v1", label: "V1", paxLabel: "Initial", sectionBudgets: sb, values: {} }];
  });
  const [actuals, setActuals] = useState({});
  const [expenseItems, setExpenseItems] = useState([]);

  const [showEditBudget, setShowEditBudget] = useState(false);
  const [draftBudget, setDraftBudget] = useState(totalBudget.toString());
  const [showDistribution, setShowDistribution] = useState(false);

  const latestVersion = versions[versions.length - 1];

  // ── Derived: actuals coming from expense cards, grouped by section ───────
  const expenseActualsBySection = {};
  const expenseSubItemsBySection = {};
  expenseItems.forEach((exp) => {
    const sid = categorySlug(exp.category);
    const total = exp.subItems.reduce((s, si) => s + (parseFloat(si.amount) || 0), 0);
    expenseActualsBySection[sid] = (expenseActualsBySection[sid] || 0) + total;
    if (!expenseSubItemsBySection[sid]) expenseSubItemsBySection[sid] = [];
    exp.subItems.forEach((si) => {
      if (si.description || si.amount) {
        expenseSubItemsBySection[sid].push({
          expenseId: exp.id,
          subItemId: si.id,
          label: si.description || "",
          attendees: si.attendees || "",
          unitCost: si.unitCost || "",
          amount: parseFloat(si.amount) || 0,
        });
      }
    });
  });

  const totalActualSpent = sections.reduce((sum, s) => {
    const expenseTotal = expenseActualsBySection[s.id] || 0;
    // const manualTotal = getSectionTotal(actuals, s);
    return sum + expenseTotal;
  }, 0);
  const isOverallOverBudget = totalActualSpent > budget && totalActualSpent > 0;

  // ── Handlers: versions ────────────────────────────────────────────────────
  const handleAddVersion = (pax) => {
    const nextLabel = `V${versions.length + 1}`;
    const clonedValues = JSON.parse(JSON.stringify(latestVersion.values));
    setVersions([
      ...versions,
      {
        id: `v${Date.now()}`,
        label: nextLabel,
        paxLabel: `${pax} PAX`,
        sectionBudgets: JSON.parse(JSON.stringify(latestVersion.sectionBudgets)),
        values: clonedValues,
      },
    ]);
  };

  const handleRemoveVersion = (versionId) => {
    if (versions.length <= 1) return;
    setVersions(versions.filter((v) => v.id !== versionId));
  };

  const handleVersionValueChange = (versionId, itemId, field, value) => {
    setVersions(
      versions.map((v) =>
        v.id === versionId
          ? { ...v, values: { ...v.values, [itemId]: { ...(v.values[itemId] || { qty: 0, unitCost: 0 }), [field]: value } } }
          : v
      )
    );
  };

  const handleSectionBudgetChange = (versionId, sectionId, value) => {
    setVersions(
      versions.map((v) => (v.id === versionId ? { ...v, sectionBudgets: { ...v.sectionBudgets, [sectionId]: value } } : v))
    );
  };

  // ── Handlers: actuals (manual, non-expense-driven) ───────────────────────
  const handleActualChange = (itemId, field, value) => {
    setActuals({ ...actuals, [itemId]: { ...(actuals[itemId] || { qty: 0, unitCost: 0 }), [field]: value } });
  };

  // ── Handlers: sections & items ────────────────────────────────────────────
  const handleRemoveSection = (sectionId) => {
    setSections(sections.filter((s) => s.id !== sectionId));
  };

  const makeSubItem = (id, description) => ({
    id,
    description,
    vendorName: "",
    billUploaded: false,
    attendees: "",
    unitCost: "",
    amount: "",
  });

  const handleAddItem = (sectionId, description) => {
    const itemId = `${sectionId}i${Date.now()}`;
    setSections(sections.map((s) => (s.id === sectionId ? { ...s, items: [...s.items, { id: itemId, description }] } : s)));

    // Sync to an existing expense card for this category, if one exists
    const categoryName = sections.find((s) => s.id === sectionId)?.name || "";
    const existingCard = expenseItems.find((e) => e.category === categoryName);
    if (existingCard) {
      setExpenseItems(
        expenseItems.map((e) =>
          e.id === existingCard.id ? { ...e, subItems: [...e.subItems, makeSubItem(itemId, description)] } : e
        )
      );
    }
  };

  const handleRemoveItem = (sectionId, itemId) => {
    setSections(sections.map((s) => (s.id === sectionId ? { ...s, items: s.items.filter((i) => i.id !== itemId) } : s)));
  };

  // ── Handlers: expense cards ───────────────────────────────────────────────
  const handleAddExpense = (category) => {
    const section = sections.find((s) => s.name === category);
    const prePopulated =
      section && section.items.length > 0
        ? section.items.map((item) => makeSubItem(item.id, item.description))
        : [makeSubItem(Date.now().toString(), "")];
    setExpenseItems([
      ...expenseItems,
      {
        id: `expense-${Date.now()}`,
        category,
        description: "",
        date: "",
        remark: "",
        subItems: prePopulated,
        approvalStatus: "Pending",
      },
    ]);
  };

  const handleRemoveExpense = (id) => setExpenseItems(expenseItems.filter((e) => e.id !== id));

  const handleExpenseFieldChange = (id, field, value) => {
    setExpenseItems(expenseItems.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  };

  const handleSubItemChange = (expenseId, subItemId, field, value) => {
    setExpenseItems(
      expenseItems.map((e) =>
        e.id === expenseId
          ? {
            ...e,
            subItems: e.subItems.map((s) => {
              if (s.id !== subItemId) return s;
              const updated = { ...s, [field]: value };
              const qty = parseFloat(field === "attendees" ? value : updated.attendees) || 0;
              const cost = parseFloat(field === "unitCost" ? value : updated.unitCost) || 0;
              updated.amount = (qty * cost).toString();
              return updated;
            }),
          }
          : e
      )
    );

    // Keep the budget table's "Actual" column in sync for matching sub-items
    if (field === "attendees" || field === "unitCost") {
      setActuals((prev) => {
        const current = prev[subItemId] || { qty: 0, unitCost: 0 };
        return {
          ...prev,
          [subItemId]: {
            qty: field === "attendees" ? parseFloat(value) || 0 : current.qty,
            unitCost: field === "unitCost" ? parseFloat(value) || 0 : current.unitCost,
          },
        };
      });
    }
  };

  // ── Handlers: budget editing & distribution ───────────────────────────────
  const handleSaveBudget = () => {
    const parsed = parseFloat(draftBudget);
    if (!isNaN(parsed) && parsed >= 0) {
      setBudget(parsed);
      onBudgetChange?.(parsed);
      // Re-derive section budgets for the latest version proportionally
      const newSB = categoriesToSectionBudgets(budgetCategories, parsed);
      setVersions((prev) => prev.map((v, i) => (i === prev.length - 1 ? { ...v, sectionBudgets: newSB } : v)));
    }
    setShowEditBudget(false);
  };

  const handleSaveDistribution = (cats) => {
    setBudgetCategories(cats);
    onCategoriesChange?.(cats);
    const newSecs = categoriesToSections(cats);
    setSections((prev) => newSecs.map((ns) => prev.find((p) => p.id === ns.id) ?? ns));
    const newSB = categoriesToSectionBudgets(cats, budget);
    setVersions((prev) => prev.map((v) => ({ ...v, sectionBudgets: { ...newSB, ...v.sectionBudgets } })));
    setShowDistribution(false);
  };

  return (
    <div className="p-6">
      <BudgetOverviewBar
        totalBudget={budget}
        totalActualSpent={totalActualSpent}
        isOverBudget={isOverallOverBudget}
        onEditBudget={() => {
          setDraftBudget(budget.toString());
          setShowEditBudget(true);
        }}
        onOpenDistribution={() => setShowDistribution(true)}
      />

      {/* Two pie charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        <PieChartPanel
          title="Budget Distribution"
          subtitle={`Total: ₹${budget.toLocaleString("en-IN")}`}
          data={budgetCategories.map((cat) => ({
            name: cat.name,
            value: Math.round((cat.percentage / 100) * budget),
            percentage: cat.percentage.toFixed(0),
          }))}
        />
        <PieChartPanel
          title="Actual Amount Spent"
          subtitle={`Total: ₹${totalActualSpent.toLocaleString("en-IN")}`}
          emptyLabel="No actuals entered yet"
          data={budgetCategories.map((cat) => {
            const sid = categorySlug(cat.name);
            const sec = sections.find((s) => s.id === sid);
            // const manualTotal = sec ? getSectionTotal(actuals, sec) : 0;
            const expenseTotal = expenseActualsBySection[sid] || 0;
            return { name: cat.name, value: expenseTotal };
          })}
        />
      </div>

      {/* Budget Breakup Table */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Budget Breakup</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Click any cell to edit • Yellow = changed from previous version • Red = over budget
            </p>
          </div>
        </div>

        <BudgetVersionPills
          versions={versions}
          latestVersionId={latestVersion.id}
          onAddVersion={handleAddVersion}
          onRemoveVersion={handleRemoveVersion}
        />

        <BudgetBreakupTable
          sections={sections}
          versions={versions}
          latestVersion={latestVersion}
          actuals={actuals}
          totalActualSpent={totalActualSpent}
          expenseActualsBySection={expenseActualsBySection}
          expenseSubItemsBySection={expenseSubItemsBySection}
          onSectionBudgetChange={handleSectionBudgetChange}
          onVersionValueChange={handleVersionValueChange}
          onActualChange={handleActualChange}
          onSubItemFieldChange={handleSubItemChange}
          onRemoveSection={handleRemoveSection}
          onRemoveItem={handleRemoveItem}
          onAddItem={handleAddItem}
        />

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
        </div>
      </div>

      <ExpenseItemsSection
        budgetCategories={budgetCategories}
        expenseItems={expenseItems}
        onAddExpense={handleAddExpense}
        onRemoveExpense={handleRemoveExpense}
        onFieldChange={handleExpenseFieldChange}
        onSubItemChange={handleSubItemChange}
      />

      {/* Inline "Edit Budget" modal */}
      {showEditBudget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Edit Budget</h3>
            <input
              type="number"
              min="0"
              value={draftBudget}
              onChange={(e) => setDraftBudget(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowEditBudget(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button onClick={handleSaveBudget} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline "Budget Distribution" modal */}
      {showDistribution && (
        <DistributionModal
          categories={budgetCategories}
          onClose={() => setShowDistribution(false)}
          onSave={handleSaveDistribution}
          budget={budget}
        />
      )}
    </div>
  );
}

const SECTION_COLORS = ["bg-blue-500", "bg-teal-500", "bg-amber-500", "bg-purple-500", "bg-pink-500"];

// ── Minimal self-contained distribution modal ────────────────────────────────
function DistributionModal({
  categories,
  onClose,
  onSave,
  budget
}) {
  const [draft, setDraft] = useState(categories.map((c) => ({ ...c })));
  const totals = {};

  categories.forEach((cat) => {
    totals[cat.name] = Math.round(
      (cat.percentage / 100) * budget
    );
  });

  const grandTotal = Object.values(totals).reduce(
    (sum, value) => sum + value,
    0
  );

  console.log(categories, budget)
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      {/* <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Budget Distribution</h3>
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {draft.map((cat, i) => (
            <div key={cat.name} className="flex items-center gap-3">
              <span className="flex-1 text-sm text-gray-700">{cat.name}</span>jjj
              <input
                type="number"
                min="0"
                max="100"
                value={cat.percentage}
                onChange={(e) =>
                  setDraft(draft.map((c, ci) => (ci === i ? { ...c, percentage: parseFloat(e.target.value) || 0 } : c)))
                }
                className="w-20 px-2 py-1.5 text-sm text-right border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-500 w-4">%</span>
            </div>
          ))}
        </div>

      </div> */}
      <div className="bg-white rounded-xl p-6 w-full max-w-lg">
        <h3 className="text-base font-semibold text-gray-900 mb-2">
          Budget Distribution
        </h3>

        <p className="text-xs text-gray-500 mb-4">
          How the planned budget is distributed across categories.
        </p>

        {/* Stacked bar */}
        <div className="w-full h-3 rounded-full overflow-hidden flex mb-5">
          {categories.map((cat, i) => {
            const amount = totals[cat.name];
            const pct = (amount / grandTotal) * 100;

            if (pct <= 0) return null;

            return (
              <div
                key={cat.name}
                className={
                  SECTION_COLORS[i % SECTION_COLORS.length]
                }
                style={{ width: `${pct}%` }}
              />
            );
          })}
        </div>

        <div className="space-y-3">
          {categories.map((cat, i) => {
            const amount = Math.round(
              (cat.percentage / 100) * budget
            );

            return (
              <div
                key={cat.name}
                className="flex items-center gap-3"
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${SECTION_COLORS[i % SECTION_COLORS.length]
                    }`}
                />

                <span className="text-sm text-gray-700 flex-1">
                  {cat.name}
                </span>

                <span className="text-sm text-gray-500 w-12 text-right">
                  {cat.percentage}%
                </span>

                <span className="text-sm font-medium text-gray-900 w-24 text-right">
                  ₹{amount.toLocaleString("en-IN")}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}