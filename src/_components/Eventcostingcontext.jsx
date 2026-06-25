import React, { createContext, useContext, useMemo, useState } from "react";

// ---------- helpers ----------
export const uid = (p = "id") => `${p}_${Math.random().toString(36).slice(2, 9)}`;
export const fmt = (n) => Math.round(n || 0).toLocaleString("en-IN");

// ---------- shared category list ----------
// Each budget "section" (used by BudgetBreakup) maps to one or more
// expense "category" values (used by ExpenseItems). This is the key that
// keeps the two views in sync.
export const SECTIONS_CONFIG = [
  { id: "venue", name: "Venue & Decor", categories: ["Venue Rental", "Printing & Stationary"] },
  { id: "catering", name: "Catering", categories: ["Food & Beverages"] },
  { id: "logistics", name: "Logistics & AV", categories: ["Resource Cost", "Event Management"] },
  { id: "stay", name: "Accommodation & Travel", categories: ["Accommodation Charges", "Reimbursement of Event Expenditure (Misc)"] },
];

export const CATEGORIES = SECTIONS_CONFIG.flatMap((s) => s.categories);

const categoryToSectionId = (category) => {
  const sec = SECTIONS_CONFIG.find((s) => s.categories.includes(category));
  return sec ? sec.id : SECTIONS_CONFIG[SECTIONS_CONFIG.length - 1].id;
};

const sumSubItems = (subItems) => subItems.reduce((s, si) => s + (Number(si.amount) || 0), 0);

const makeSubItem = (description, attendees, unitCost) => ({
  id: uid("sub"),
  description,
  attendees,
  unitCost,
  amount: attendees && unitCost ? attendees * unitCost : "",
});

// ---------- expense items ----------
// Each expense is the single source of truth for actual spend AND carries
// its own per-version planned figures (qty + unitCost), so BudgetBreakup
// can show one editable row per expense that lines up 1:1 with ExpenseItems.
const INITIAL_EXPENSES = [
  {
    id: uid("exp"),
    category: "Venue Rental",
    description: "Banquet hall booking for annual conference",
    vendorName: "Taj Convention Centre",
    date: "2026-07-10",
    remark: "Includes setup & teardown",
    approvalStatus: "Approved",
    subItems: [makeSubItem("Day 1 Hall Rent", 1, 90000), makeSubItem("Day 2 Hall Rent", 1, 95000)],
    plan: { v_50: { qty: 1, unitCost: 150000 }, v_75: { qty: 1, unitCost: 185000 } },
  },
  {
    id: uid("exp"),
    category: "Food & Beverages",
    description: "Catering for 75 attendees across 2 days",
    vendorName: "Spice Route Caterers",
    date: "2026-07-10",
    remark: "Veg + Non-veg buffet",
    approvalStatus: "Approved",
    subItems: [makeSubItem("Day 1 Lunch", 75, 1200), makeSubItem("Day 2 Lunch", 75, 900)],
    plan: { v_50: { qty: 50, unitCost: 2000 }, v_75: { qty: 75, unitCost: 2100 } },
  },
  {
    id: uid("exp"),
    category: "Printing & Stationary",
    description: "Badges, banners and delegate kits",
    vendorName: "PrintHub Solutions",
    date: "2026-07-05",
    remark: "",
    approvalStatus: "Rejected",
    subItems: [makeSubItem("Delegate Kits", 75, 250), makeSubItem("Banners", 4, 1125)],
    plan: { v_50: { qty: 50, unitCost: 300 }, v_75: { qty: 75, unitCost: 300 } },
  },
  {
    id: uid("exp"),
    category: "Resource Cost",
    description: "Sound, lighting and AV crew for main hall",
    vendorName: "Decibel Events",
    date: "2026-07-09",
    remark: "Includes drone camera add-on",
    approvalStatus: "Approved",
    subItems: [
      makeSubItem("Sound System", 1, 30000),
      makeSubItem("Lighting Rig", 1, 21000),
      makeSubItem("Drone Camera Add-on", 1, 5000),
    ],
    plan: { v_50: { qty: 1, unitCost: 45000 }, v_75: { qty: 1, unitCost: 56000 } },
  },
  {
    id: uid("exp"),
    category: "Event Management",
    description: "Photography and videography coverage",
    vendorName: "Lens & Light Studio",
    date: "2026-07-10",
    remark: "2 photographers, 1 videographer",
    approvalStatus: "Pending",
    subItems: [makeSubItem("Photography", 2, 9000), makeSubItem("Videography", 1, 18000)],
    plan: { v_50: { qty: 1, unitCost: 30000 }, v_75: { qty: 1, unitCost: 36000 } },
  },
  {
    id: uid("exp"),
    category: "Accommodation Charges",
    description: "Guest rooms for outstation speakers",
    vendorName: "Taj Convention Centre",
    date: "2026-07-09",
    remark: "3 rooms, 2 nights",
    approvalStatus: "Pending",
    subItems: [makeSubItem("Speaker Rooms (2N)", 3, 7000)],
    plan: { v_50: { qty: 1, unitCost: 40000 }, v_75: { qty: 1, unitCost: 60000 } },
  },
];

// ---------- budget versions ----------
// Just an ordered list of version labels now (no PAX count) — qty/unitCost
// per expense, per version, lives on the expense itself (expense.plan).
const INITIAL_VERSIONS = [
  { id: "v_50", label: "V1" },
  { id: "v_75", label: "V2" },
];

// ---------- context ----------
const EventCostingContext = createContext(null);

export function EventCostingProvider({ children }) {
  const [versions, setVersions] = useState(INITIAL_VERSIONS);
  const [expenses, setExpenses] = useState(INITIAL_EXPENSES);
  const [overallBudget, setOverallBudget] = useState(2000000);

  const latestVersion = versions[versions.length - 1];

  const getPlan = (expense, versionId) => expense.plan?.[versionId] || { qty: 0, unitCost: 0 };

  // Planned grand total for a given version, across all expenses.
  const versionTotal = (versionId) =>
    expenses.reduce((s, e) => {
      const p = getPlan(e, versionId);
      return s + (Number(p.qty) || 0) * (Number(p.unitCost) || 0);
    }, 0);

  const latestGrandTotal = useMemo(() => versionTotal(latestVersion.id), [expenses, latestVersion]);

  // Planned total per section for a version (used by Budget Distribution popup).
  const sectionPlanTotals = (versionId) => {
    const out = {};
    for (const sec of SECTIONS_CONFIG) out[sec.id] = 0;
    for (const e of expenses) {
      const secId = categoryToSectionId(e.category);
      const p = getPlan(e, versionId);
      out[secId] += (Number(p.qty) || 0) * (Number(p.unitCost) || 0);
    }
    return out;
  };

  // Planned total per exact category name, for a version (used by the
  // "Budget Distribution" pie chart — one slice per category, not section).
  const categoryPlanTotals = (versionId) => {
    const out = {};
    for (const c of CATEGORIES) out[c] = 0;
    for (const e of expenses) {
      const p = getPlan(e, versionId);
      out[e.category] = (out[e.category] || 0) + (Number(p.qty) || 0) * (Number(p.unitCost) || 0);
    }
    return out;
  };

  // Actual approved spend per exact category name (used by the
  // "Actual Amount Spent" pie chart).
  const categoryActualTotals = useMemo(() => {
    const out = {};
    for (const c of CATEGORIES) out[c] = 0;
    for (const e of expenses) {
      // if (e.approvalStatus !== "Approved") continue;
      out[e.category] = (out[e.category] || 0) + sumSubItems(e.subItems);
    }
    return out;
  }, [expenses]);

  // Actual spend per section, split by approval status.
  const sectionActuals = useMemo(() => {
    const out = {};
    for (const sec of SECTIONS_CONFIG) out[sec.id] = { approved: 0, pending: 0, rejected: 0, all: 0 };
    for (const exp of expenses) {
      const secId = categoryToSectionId(exp.category);
      const total = sumSubItems(exp.subItems);
      out[secId].all += total;
      if (exp.approvalStatus === "Approved") out[secId].approved += total;
      else if (exp.approvalStatus === "Pending") out[secId].pending += total;
      else if (exp.approvalStatus === "Rejected") out[secId].rejected += total;
    }
    return out;
  }, [expenses]);

  const totalApprovedSpend = useMemo(
    // () => Object.values(sectionActuals).reduce((s, v) => s + v.approved, 0),
    () => Object.values(sectionActuals).reduce((s, v) => s + v.approved + v.pending + v.rejected, 0),
    [sectionActuals]
  );

  // ---- version handlers ----
  const handleAddVersion = () => {
    setVersions((vs) => {
      const newVersion = { id: uid("v"), label: `V${vs.length + 1}` };
      const prevId = vs[vs.length - 1].id;
      // seed the new version's plan on every expense from the previous version
      setExpenses((items) =>
        items.map((e) => ({
          ...e,
          plan: { ...e.plan, [newVersion.id]: { ...(e.plan?.[prevId] || { qty: 0, unitCost: 0 }) } },
        }))
      );
      return [...vs, newVersion];
    });
  };

  const handleRemoveVersion = (versionId) =>
    setVersions((vs) => (vs.length > 1 ? vs.filter((v) => v.id !== versionId) : vs));

  const handlePlanChange = (expenseId, versionId, field, value) =>
    setExpenses((items) =>
      items.map((e) =>
        e.id !== expenseId
          ? e
          : {
              ...e,
              plan: {
                ...e.plan,
                [versionId]: { ...(e.plan?.[versionId] || { qty: 0, unitCost: 0 }), [field]: value },
              },
            }
      )
    );

  // ---- expense handlers ----
  const handleAddExpense = (category) => {
    if (!category) return;
    setExpenses((items) => [
      ...items,
      {
        id: uid("exp"),
        category,
        description: "",
        vendorName: "",
        date: "",
        remark: "",
        approvalStatus: "Pending",
        subItems: [makeSubItem("", "", "")],
        plan: Object.fromEntries(versions.map((v) => [v.id, { qty: 0, unitCost: 0 }])),
      },
    ]);
  };

  const handleRemoveExpense = (expenseId) => setExpenses((items) => items.filter((e) => e.id !== expenseId));

  const handleExpenseChange = (expenseId, field, value) =>
    setExpenses((items) => items.map((e) => (e.id === expenseId ? { ...e, [field]: value } : e)));

  const handleAddSubItem = (expenseId) =>
    setExpenses((items) =>
      items.map((e) => (e.id === expenseId ? { ...e, subItems: [...e.subItems, makeSubItem("", "", "")] } : e))
    );

  const handleRemoveSubItem = (expenseId, subItemId) =>
    setExpenses((items) =>
      items.map((e) => (e.id !== expenseId ? e : { ...e, subItems: e.subItems.filter((si) => si.id !== subItemId) }))
    );

  const handleSubItemChange = (expenseId, subItemId, field, value) =>
    setExpenses((items) =>
      items.map((e) => {
        if (e.id !== expenseId) return e;
        return {
          ...e,
          subItems: e.subItems.map((si) => {
            if (si.id !== subItemId) return si;
            const updated = { ...si, [field]: value };
            const a = Number(updated.attendees) || 0;
            const c = Number(updated.unitCost) || 0;
            updated.amount = a && c ? a * c : "";
            return updated;
          }),
        };
      })
    );

  const value = {
    sections: SECTIONS_CONFIG,
    versions,
    latestVersion,
    latestGrandTotal,
    expenses,
    sectionActuals,
    totalApprovedSpend,
    overallBudget,
    setOverallBudget,
    getPlan,
    versionTotal,
    sectionPlanTotals,
    categoryPlanTotals,
    categoryActualTotals,
    handleAddVersion,
    handleRemoveVersion,
    handlePlanChange,
    handleAddExpense,
    handleRemoveExpense,
    handleExpenseChange,
    handleAddSubItem,
    handleRemoveSubItem,
    handleSubItemChange,
    categoryToSectionId,
  };

  return <EventCostingContext.Provider value={value}>{children}</EventCostingContext.Provider>;
}

export function useEventCosting() {
  const ctx = useContext(EventCostingContext);
  if (!ctx) throw new Error("useEventCosting must be used within an EventCostingProvider");
  return ctx;
}