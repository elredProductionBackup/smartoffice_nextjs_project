// Translate the server's shapes into the shapes your existing components
// already expect. Keeping this in one place means the components don't change.
//
// NOTE: use the server _id / budgetCategoryId as the stable id everywhere
// instead of categorySlug(name). Slugs break on rename and collide.

// API category (#8) -> UI category  { id, name, percentage }
export const apiCategoryToUi = (c) => ({
  id: c.budgetCategoryId || c._id,
  name: c.budgetCategory,
  percentage: Number(c.percentage) || 0,
});

// API category -> UI "section" used by BudgetBreakupTable { id, name, items }
export const apiCategoryToSection = (c) => ({
  id: c.budgetCategoryId || c._id,
  name: c.budgetCategory,
  items: [],
});

// Event budget breakup (#7) -> pie data for "Budget Distribution"
// row: { budgetCategoryId, budgetType, percentage, amount }
export const eventBudgetToPieData = (rows) =>
  rows.map((r) => ({
    name: r.budgetType,
    value: Math.round(r.amount || 0),
    percentage: (Number(r.percentage) || 0).toFixed(0),
  }));

// Event budget breakup (#7) -> { [budgetCategoryId]: amount } for section budgets
export const eventBudgetToSectionBudgets = (rows) =>
  rows.reduce((acc, r) => {
    acc[r.budgetCategoryId || r._id] = Math.round(r.amount || 0);
    return acc;
  }, {});

// Category version (#9) -> flat UI rows. The API models qty/rate/totalSplit as
// PARALLEL ARRAYS per split; the UI table wants { qty, unitCost } per row.
// This flattens splits[] into one row per split, taking the last array entry
// as the current value. Adjust the index rule to whatever your table means.
export const versionSplitsToUiRows = (version) => {
  const splits = Array.isArray(version.splits) ? version.splits : [];
  return splits.map((sp) => {
    const last = (arr) =>
      Array.isArray(arr) ? Number(arr[arr.length - 1]) || 0 : Number(arr) || 0;
    return {
      versionId: version.budgetCategoryVersionId || version._id,
      splitName: sp.splitName,
      qty: last(sp.qty),
      unitCost: last(sp.rate),
      total: last(sp.totalSplit),
    };
  });
};

// Stable row id used by the table: encodes the version + split it maps back to.
export const rowId = (versionId, splitName) => `${versionId}::${splitName}`;
export const parseRowId = (id) => {
  const [versionId, splitName] = String(id).split("::");
  return { versionId, splitName };
};

// Assemble everything BudgetBreakupTable needs from the API:
//  - sections:        categories, each with its splits as items
//  - sectionBudgets:  { [categoryId]: amount } from the #7 breakup
//  - values:          { [rowId]: { qty, unitCost } } from the current splits
//  - actuals:         { [rowId]: { qty, unitCost } } from event expenses (#11/#5)
//  - actualsBySection { [categoryId]: totalSpent }
export const buildBreakup = ({ categories, eventBudget, versions, expenses }) => {
  const versionByCat = {};
  versions.forEach((v) => {
    versionByCat[v.budgetCategoryId || v._id] = v;
  });

  const sectionBudgets = eventBudgetToSectionBudgets(eventBudget);
  const values = {};
  const sections = categories.map((c) => {
    const catId = c.budgetCategoryId || c._id;
    const v = versionByCat[catId];
    const vId = v?.budgetCategoryVersionId || v?._id;
    const splits = Array.isArray(v?.splits) ? v.splits : [];
    const items = splits.map((sp) => {
      const last = (a) =>
        Array.isArray(a) ? Number(a[a.length - 1]) || 0 : Number(a) || 0;
      const id = rowId(vId, sp.splitName);
      values[id] = { qty: last(sp.qty), unitCost: last(sp.rate) };
      return { id, description: sp.splitName };
    });
    return { id: catId, name: c.budgetCategory, items };
  });

  const actuals = {};
  const actualsBySection = {};
  expenses.forEach((e) => {
    const vId = e.budgetCategoryVersionId;
    const id = vId ? rowId(vId, e.splitName) : null;
    const qty = Number(e.qty) || 0;
    const rate = Number(e.rate) || 0;
    const total = Number(e.totalExpense ?? e.total) || qty * rate;
    if (id) actuals[id] = { qty, unitCost: rate };
    // attribute to the category that owns this version
    const cat = versions.find(
      (v) => (v.budgetCategoryVersionId || v._id) === vId
    );
    const catId = cat?.budgetCategoryId || cat?._id;
    if (catId) actualsBySection[catId] = (actualsBySection[catId] || 0) + total;
  });

  return { sections, sectionBudgets, values, actuals, actualsBySection };
};

// Expense (#5) -> UI expense card. Shapes differ between the general (#4/#5)
// and event (#11) responses, so read defensively.
export const apiExpenseToCard = (e) => ({
  id: e.budgetExpenseId || e.expenseId || e._id,
  category: e.budgetType || e.desc || "",
  vendorName: e.vendorName || "",
  amount: Number(e.total ?? e.totalExpense) || 0,
  remark: e.remark || "",
  approvalStatus: e.approvedStatus || "Pending",
  attachment: e.attachment || [],
});