import { useState, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { categorySlug } from "./utils";
import { BudgetOverviewBar } from "./Budgetoverviewbar";
import { BudgetVersionPills } from "./Budgetversionpills";
import { BudgetBreakupTable } from "./Budgetbreakuptable";
import { ExpenseItemsSection } from "./Expenseitemssection";
import { PieChartPanel } from "./Piechartpanel";
import { updateEventBudget } from "@/services/events.service";
import {
  fetchEventDetails,
  fetchBudgetCategoryVersions,
  saveBudgetCategoryVersion,
  saveEventExpense,
} from "@/store/events/eventsThunks";
import { mapServerToCosting, buildSplitPatch, deriveBudgetCategories, makeItemId } from "./costingModel";

const EMPTY_LIST = [];
const SAVE_DEBOUNCE_MS = 700;

export function EventCostingTab({
  eventId,
  event,
  totalBudget,
  onBudgetChange,
  onCategoriesChange,
}) {
  const dispatch = useDispatch();

  // ── Server state (Redux) ──────────────────────────────────────────────────
  const rawVersions = useSelector((s) => s.events.costingMap?.[eventId]) ?? EMPTY_LIST;
  const costingLoading = useSelector((s) => s.events.costingLoading?.[eventId]) ?? false;
  const costingSaving = useSelector((s) => s.events.costingSaving) ?? false;

  useEffect(() => {
    if (eventId) dispatch(fetchBudgetCategoryVersions({ eventId }));
  }, [eventId, dispatch]);

  const model = useMemo(() => mapServerToCosting(rawVersions), [rawVersions]);

  // ── Editable working copy ─────────────────────────────────────────────────
  const [draft, setDraft] = useState({ sections: model.sections, versions: model.versions });
  const [actuals, setActuals] = useState(model.actuals);
  const [expenseItems, setExpenseItems] = useState(() => seedExpenseCards(model));

  // Only re-hydrate from the server when nothing is being saved, so a refetch
  // never wipes a cell the user is mid-edit or an expense card they just added.
  const pendingSaves = useRef(0);
  const [reconcileTick, setReconcileTick] = useState(0);

  useEffect(() => {
    if (pendingSaves.current !== 0) return;
    setDraft({ sections: model.sections, versions: model.versions });
    setActuals(model.actuals);
    setExpenseItems((prev) => {
      const seeded = seedExpenseCards(model);
      const seededCats = new Set(seeded.map((c) => c.category));
      return [...seeded, ...prev.filter((c) => !seededCats.has(c.category))];
    });
  }, [model, reconcileTick]);

  const sections = draft.sections;
  const versions = draft.versions;
  const latestVersion = versions[versions.length - 1];
  const expenseMeta = model.expenseMeta;

  const budgetCategories = useMemo(() => deriveBudgetCategories(sections), [sections]);

  // ── Budget (top bar) ──────────────────────────────────────────────────────
  const [budget, setBudget] = useState(totalBudget);
  const [savingBudget, setSavingBudget] = useState(false);
  const [showEditBudget, setShowEditBudget] = useState(false);
  const [draftBudget, setDraftBudget] = useState(totalBudget?.toString?.() ?? "0");
  const [showDistribution, setShowDistribution] = useState(false);

  useEffect(() => {
    setBudget(totalBudget);
    setDraftBudget(totalBudget?.toString?.() ?? "0");
  }, [totalBudget]);

  const catNameToId = useMemo(
    () => Object.fromEntries(sections.map((s) => [s.name, s.id])),
    [sections]
  );

  const expenseSubItemsBySection = {};
  expenseItems.forEach((exp) => {
    const sid = catNameToId[exp.category] || categorySlug(exp.category);
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

  // ── Persistence ────────────────────────────────────────────────────────────
  const splitTimers = useRef({});

  const settleSave = () => {
    pendingSaves.current = Math.max(0, pendingSaves.current - 1);
    if (pendingSaves.current === 0) setReconcileTick((t) => t + 1);
  };

  // BUDGET side → PATCH /patchBudgetCategoryVersions (still debounced; the budget
  // grid commits per cell, not per keystroke, so it doesn't hammer the API).
  const flushSplit = (section, itemId, versionsSnapshot) => {
    const patch = buildSplitPatch({ versions: versionsSnapshot, itemId, section });
    if (!patch.splitName || !patch.budgetCategoryVersionId) return;
    pendingSaves.current += 1;
    dispatch(saveBudgetCategoryVersion({ eventId, ...patch })).finally(settleSave);
  };

  // ACTUAL side → PATCH /addEditEventExpense. Returns the dispatch promise so the
  // card's Save button can await all of its lines at once.
  const flushExpense = (itemId, actual, attachment) => {
    let meta = expenseMeta[itemId];
    if (!meta) {
      const section = sections.find((s) => s.items.some((it) => it.id === itemId));
      const item = section?.items.find((it) => it.id === itemId);
      if (section && item) {
        meta = {
          budgetCategoryVersionId: section.budgetCategoryVersionId ?? section.id,
          splitName: item.splitName,
          vendorName: "",
        };
      }
    }
    if (!meta) return null; // ad-hoc line with no split yet — nothing to attach to

    const qty = Number(actual.qty) || 0;
    const rate = Number(actual.unitCost) || 0;
    pendingSaves.current += 1;
    return dispatch(
      saveEventExpense({
        eventId,
        budgetCategoryVersionId: meta.budgetCategoryVersionId,
        splitName: meta.splitName,
        vendorName: actual.vendorName ?? meta.vendorName ?? "",
        qty,
        rate,
        totalExpense: qty * rate,
        attachment, // File → set/replace · "" → remove · undefined → leave as-is
      })
    ).finally(settleSave);
  };

  // ── Handlers: versions (BUDGET side) ───────────────────────────────────────
  const handleAddVersion = (pax) => {
    setDraft((prev) => {
      const last = prev.versions[prev.versions.length - 1] || { values: {}, sectionBudgets: {} };
      const idx = prev.versions.length;
      const clone = {
        id: `v${idx + 1}`,
        label: `V${idx + 1}`,
        paxLabel: pax ? `${pax} PAX` : `V${idx + 1}`,
        versionIndex: idx,
        sectionBudgets: JSON.parse(JSON.stringify(last.sectionBudgets || {})),
        values: JSON.parse(JSON.stringify(last.values || {})),
      };
      return { ...prev, versions: [...prev.versions, clone] };
    });
  };

  const handleRemoveVersion = (versionId) => {
    setDraft((prev) =>
      prev.versions.length <= 1
        ? prev
        : { ...prev, versions: prev.versions.filter((v) => v.id !== versionId) }
    );
  };

  const handleVersionValueChange = (versionId, itemId, field, value) => {
    setDraft((prev) => {
      const versionsNext = prev.versions.map((v) =>
        v.id === versionId
          ? {
              ...v,
              values: {
                ...v.values,
                [itemId]: { ...(v.values[itemId] || { qty: 0, unitCost: 0 }), [field]: value },
              },
            }
          : v
      );
      const section = prev.sections.find((s) => s.items.some((it) => it.id === itemId));
      if (section) {
        clearTimeout(splitTimers.current[itemId]);
        splitTimers.current[itemId] = setTimeout(
          () => flushSplit(section, itemId, versionsNext),
          SAVE_DEBOUNCE_MS
        );
      }
      return { ...prev, versions: versionsNext };
    });
  };

  const handleSectionBudgetChange = (versionId, sectionId, value) => {
    setDraft((prev) => ({
      ...prev,
      versions: prev.versions.map((v) =>
        v.id === versionId
          ? { ...v, sectionBudgets: { ...v.sectionBudgets, [sectionId]: value } }
          : v
      ),
    }));
  };

  // ── Handlers: sections & items ─────────────────────────────────────────────
  const handleRemoveSection = (sectionId) => {
    setDraft((prev) => ({ ...prev, sections: prev.sections.filter((s) => s.id !== sectionId) }));
  };

  const handleAddItem = (sectionId, description) => {
    const splitName = description.trim();
    if (!splitName) return;
    setDraft((prev) => {
      const section = prev.sections.find((s) => s.id === sectionId);
      if (!section || section.items.some((item) => item.splitName === splitName)) return prev;
      const itemId = makeItemId(section.budgetCategoryVersionId, splitName);
      const nextSections = prev.sections.map((s) =>
        s.id === sectionId
          ? { ...s, items: [...s.items, { id: itemId, splitName, description: splitName }] }
          : s
      );
      const nextVersions = prev.versions.map((version) => ({
        ...version,
        values: { ...version.values, [itemId]: { qty: 0, unitCost: 0 } },
      }));
      flushSplit(
        { ...section, items: [...section.items, { id: itemId, splitName }] },
        itemId,
        nextVersions
      );
      return { sections: nextSections, versions: nextVersions };
    });
  };

  const handleRemoveItem = (sectionId, itemId) => {
    setDraft((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId ? { ...s, items: s.items.filter((i) => i.id !== itemId) } : s
      ),
    }));
  };

  // ── Handlers: expense cards (ACTUAL side) ──────────────────────────────────
  const makeSubItem = (id, description) => ({
    id,
    description,
    splitName: description,
    vendorName: "",
    billUploaded: false,
    attendees: "",
    unitCost: "",
    amount: "",
  });

  const handleAddExpense = (category) => {
    const section = sections.find((s) => s.name === category);
    const prePopulated =
      section && section.items.length > 0
        ? section.items.map((item) => ({
            ...makeSubItem(item.id, item.description),
            splitName: item.splitName,
          }))
        : [makeSubItem(Date.now().toString(), "")];
    setExpenseItems((prev) => [
      ...prev,
      {
        id: `expense-${Date.now()}`,
        category,
        subItems: prePopulated,
      },
    ]);
  };

  const handleRemoveExpense = (id) =>
    setExpenseItems((prev) => prev.filter((e) => e.id !== id));

  // Type freely — NO API call here. Only local state updates.
  const handleSubItemChange = (expenseId, subItemId, field, value) => {
    setExpenseItems((prev) =>
      prev.map((e) => {
        if (e.id !== expenseId) return e;
        return {
          ...e,
          subItems: e.subItems.map((s) => {
            if (s.id !== subItemId) return s;
            const updated = { ...s, [field]: value };
            const qty = parseFloat(field === "attendees" ? value : updated.attendees) || 0;
            const cost = parseFloat(field === "unitCost" ? value : updated.unitCost) || 0;
            updated.amount = (qty * cost).toString();
            if (field === "attachment") updated.billUploaded = value instanceof File;
            return updated;
          }),
        };
      })
    );

    // keep the table's (read-only) Actual column in sync as you type
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

  // Explicit save — fires one PATCH per line in the card, only on button click.
  const handleSaveExpense = (expenseId) => {
    const card = expenseItems.find((e) => e.id === expenseId);
    if (!card) return Promise.resolve();
    const saves = card.subItems
      .map((si) =>
        flushExpense(
          si.id,
          { qty: si.attendees, unitCost: si.unitCost, vendorName: si.vendorName },
          si.attachment
        )
      )
      .filter(Boolean);
    return Promise.all(saves);
  };

  // ── Handlers: budget editing ───────────────────────────────────────────────
  const handleSaveBudget = async () => {
    const parsed = parseFloat(draftBudget);
    if (isNaN(parsed) || parsed < 0) return;

    const prev = budget;
    setBudget(parsed);
    onBudgetChange?.(parsed);
    setShowEditBudget(false);

    if (!eventId || !event) return;
    try {
      setSavingBudget(true);
      await updateEventBudget({ eventId, event, eventBudget: parsed });
      dispatch(fetchEventDetails({ eventId, noSkip: true }));
      dispatch(fetchBudgetCategoryVersions({ eventId })); // amount = budget × perc, recomputed on read
    } catch (e) {
      setBudget(prev);
      onBudgetChange?.(prev);
    } finally {
      setSavingBudget(false);
    }
  };

  // ── Derived totals ─────────────────────────────────────────────────────────
  const expenseActualsBySection = useMemo(() => {
    const totals = {};
    sections.forEach((section) => {
      totals[section.id] = section.items.reduce((sum, item) => {
        const value = actuals[item.id] || {};
        return sum + (Number(value.qty) || 0) * (Number(value.unitCost) || 0);
      }, 0);
    });
    return totals;
  }, [sections, actuals]);

  const totalActualSpent = sections.reduce(
    (sum, s) => sum + (expenseActualsBySection[s.id] || 0),
    0
  );
  const isOverallOverBudget = totalActualSpent > budget && totalActualSpent > 0;

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

      {(costingLoading || costingSaving) && (
        <div className="mb-4 text-xs text-gray-400">
          {costingLoading ? "Loading costing…" : "Saving…"}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        <PieChartPanel
          title="Budget Distribution"
          subtitle={`Total: ₹${budget.toLocaleString("en-IN")}`}
          data={sections.map((sec) => ({
            name: sec.name,
            value: latestVersion?.sectionBudgets?.[sec.id] || 0,
          }))}
        />
        <PieChartPanel
          title="Actual Amount Spent"
          subtitle={`Total: ₹${totalActualSpent.toLocaleString("en-IN")}`}
          emptyLabel="No actuals entered yet"
          data={sections.map((sec) => ({
            name: sec.name,
            value: expenseActualsBySection[sec.id] || 0,
          }))}
        />
      </div>

      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Budget Breakup</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Click a budget cell to edit • Actuals are entered under Expense Items below
            </p>
          </div>
        </div>

        <BudgetVersionPills
          versions={versions}
          latestVersionId={latestVersion?.id}
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
          onSubItemFieldChange={handleSubItemChange}
          onRemoveSection={handleRemoveSection}
          onRemoveItem={handleRemoveItem}
          onAddItem={handleAddItem}
        />

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
        onSubItemChange={handleSubItemChange}
        onSaveExpense={handleSaveExpense}
      />

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
              <button
                onClick={handleSaveBudget}
                disabled={savingBudget}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {savingBudget ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDistribution && (
        <DistributionModal
          categories={budgetCategories}
          onClose={() => setShowDistribution(false)}
          budget={budget}
        />
      )}
    </div>
  );
}

function seedExpenseCards(model) {
  return model.sections
    .map((sec) => ({
      id: `expense-${sec.id}`,
      category: sec.name,
      subItems: sec.items.map((it) => {
        const meta = model.expenseMeta[it.id] || {};
        const a = model.actuals[it.id] || { qty: 0, unitCost: 0 };
        return {
          id: it.id,
          splitName: it.splitName,
          description: it.description,
          vendorName: meta.vendorName || "",
          billUploaded: !!meta.attachment,
          attendees: a.qty || "",
          unitCost: a.unitCost || "",
          amount: a.qty && a.unitCost ? String(a.qty * a.unitCost) : "",
        };
      }),
    }))
    .filter((c) => c.subItems.length > 0);
}

const SECTION_COLORS = ["bg-blue-500", "bg-teal-500", "bg-amber-500", "bg-purple-500", "bg-pink-500"];

function DistributionModal({ categories, onClose, budget }) {
  const totals = {};
  categories.forEach((cat) => {
    totals[cat.name] = Math.round((cat.percentage / 100) * budget);
  });
  const grandTotal = Object.values(totals).reduce((sum, v) => sum + v, 0) || 1;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg">
        <h3 className="text-base font-semibold text-gray-900 mb-2">Budget Distribution</h3>
        <p className="text-xs text-gray-500 mb-4">
          How the planned budget is distributed across categories.
        </p>

        <div className="w-full h-3 rounded-full overflow-hidden flex mb-5">
          {categories.map((cat, i) => {
            const pct = (totals[cat.name] / grandTotal) * 100;
            if (pct <= 0) return null;
            return (
              <div
                key={cat.name}
                className={SECTION_COLORS[i % SECTION_COLORS.length]}
                style={{ width: `${pct}%` }}
              />
            );
          })}
        </div>

        <div className="space-y-3">
          {categories.map((cat, i) => (
            <div key={cat.name} className="flex items-center gap-3">
              <span
                className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${SECTION_COLORS[i % SECTION_COLORS.length]}`}
              />
              <span className="text-sm text-gray-700 flex-1">{cat.name}</span>
              <span className="text-sm text-gray-500 w-12 text-right">{cat.percentage}%</span>
              <span className="text-sm font-medium text-gray-900 w-24 text-right">
                ₹{totals[cat.name].toLocaleString("en-IN")}
              </span>
            </div>
          ))}
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