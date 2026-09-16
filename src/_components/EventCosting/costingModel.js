// EventCosting/costingModel.js
// ─────────────────────────────────────────────────────────────────────────────
// Translates the server "budgetCategoryVersion" documents into the shape the
// EventCosting UI already speaks (sections / versions / actuals), and back.
//
// SERVER MODEL (one document per CATEGORY):
//   {
//     budgetCategoryVersionId, budgetTypeId, budgetCategoryId,
//     budgetCategory (name), perc, total,
//     splits: [{
//       splitName,                 // line-item key (case-sensitive)
//       qty:[v0,v1,...],           // ← indexed by VERSION
//       rate:[v0,v1,...],
//       totalSplit:[v0,v1,...],
//       expense: { vendorName, attachment, qty, rate, totalExpense }  // the ACTUAL
//     }]
//   }
//
// UI MODEL:
//   sections  : [{ id, name, budgetCategoryVersionId, budgetCategoryId,
//                  budgetTypeId, perc, items:[{ id, splitName, description }] }]
//   versions  : [{ id, label, paxLabel, versionIndex,
//                  sectionBudgets:{ [sectionId]: number },
//                  values:{ [itemId]: { qty, unitCost } } }]
//   actuals   : { [itemId]: { qty, unitCost } }                 // from split.expense
//   expenseActualsBySection : { [sectionId]: number }
//   expenseMeta : { [itemId]: { vendorName, attachment,
//                               budgetCategoryVersionId, splitName } }
// ─────────────────────────────────────────────────────────────────────────────

const num = (v) => (typeof v === "number" ? v : parseFloat(v) || 0);
const firstNum = (v) => (Array.isArray(v) ? num(v[0]) : num(v)); // expense.qty may be [] or scalar
const asArray = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);

// Stable, collision-proof id for a split (splitName is only unique within a category)
export const makeItemId = (categoryVersionId, splitName) =>
  `${categoryVersionId}::${splitName}`;

// The category-version id can arrive as budgetCategoryVersionId (spec) or _id (live API)
const catId = (cat) => cat.budgetCategoryVersionId || cat._id;
// Percentage arrives as `perc` (spec) or `percentage` (live API)
const catPerc = (cat) => num(cat.percentage ?? cat.perc);

export function mapServerToCosting(result = []) {
  // Live API wraps the docs one level deep: result = [[ {...}, {...} ]].
  // flat() collapses that; it's a no-op if the array is already flat.
  const list = (Array.isArray(result) ? result : []).flat();

  // How many versions exist = longest split array we find (min 1)
  let versionCount = 1;
  list.forEach((cat) =>
    asArray(cat.splits).forEach((s) => {
      versionCount = Math.max(
        versionCount,
        asArray(s.qty).length,
        asArray(s.rate).length,
        asArray(s.totalSplit).length
      );
    })
  );

  const sections = list.map((cat) => ({
    id: catId(cat),
    name: cat.budgetCategory || "",
    budgetCategoryVersionId: catId(cat),
    budgetCategoryId: cat.budgetCategoryId,
    budgetTypeId: cat.budgetTypeId,
    perc: catPerc(cat),
    amount: num(cat.amount), // planned category total (used until splits exist)
    items: asArray(cat.splits).map((s) => ({
      id: makeItemId(catId(cat), s.splitName),
      splitName: s.splitName,
      description: s.splitName, // backend uses splitName as the label
    })),
  }));

  const versions = Array.from({ length: versionCount }, (_, i) => {
    const sectionBudgets = {};
    const values = {};
    list.forEach((cat) => {
      const splits = asArray(cat.splits);
      let secTotal = 0;
      splits.forEach((s) => {
        const itemId = makeItemId(catId(cat), s.splitName);
        const q = num(asArray(s.qty)[i]);
        const r = num(asArray(s.rate)[i]);
        const stored = asArray(s.totalSplit)[i];
        const t = stored != null ? num(stored) : q * r;
        values[itemId] = { qty: q, unitCost: r };
        secTotal += t;
      });
      // No splits yet → fall back to the category's planned `amount` on V1
      if (splits.length === 0) secTotal = i === 0 ? num(cat.amount) : 0;
      sectionBudgets[catId(cat)] = secTotal;
    });
    return {
      id: `v${i + 1}`,
      label: `V${i + 1}`,
      paxLabel: i === 0 ? "Initial" : `V${i + 1}`,
      versionIndex: i,
      sectionBudgets,
      values,
    };
  });

  const actuals = {};
  const expenseActualsBySection = {};
  const expenseMeta = {};
  list.forEach((cat) => {
    let secActual = 0;
    asArray(cat.splits).forEach((s) => {
      const itemId = makeItemId(catId(cat), s.splitName);
      const exp = s.expense || {};
      const q = firstNum(exp.qty);
      const r = firstNum(exp.rate);
      const t = exp.totalExpense != null ? num(exp.totalExpense) : q * r;
      actuals[itemId] = { qty: q, unitCost: r };
      expenseMeta[itemId] = {
        vendorName: exp.vendorName || "",
        attachment: exp.attachment || "",
        budgetCategoryVersionId: catId(cat),
        splitName: s.splitName,
      };
      secActual += t;
    });
    expenseActualsBySection[catId(cat)] = secActual;
  });

  // Ensure at least one empty version so the table can always render
  if (versions.length === 0) {
    versions.push({
      id: "v1",
      label: "V1",
      paxLabel: "Initial",
      versionIndex: 0,
      sectionBudgets: {},
      values: {},
    });
  }

  return { sections, versions, actuals, expenseActualsBySection, expenseMeta, versionCount };
}

// Categories for the pie charts / distribution / expense dropdown
export function deriveBudgetCategories(sections = []) {
  return sections.map((s) => ({ name: s.name, percentage: num(s.perc) }));
}

// ── UI → server ─────────────────────────────────────────────────────────────
// Build the PATCH body for ONE split from the full current versions array.
// Sends the whole qty/rate/totalSplit arrays (one entry per version) as the API
// expects, so this also handles "add version" (a new trailing index) transparently.
export function buildSplitPatch({ versions = [], itemId, section }) {
  const item = (section?.items || []).find((it) => it.id === itemId);
  const qty = versions.map((v) => num(v.values?.[itemId]?.qty));
  const rate = versions.map((v) => num(v.values?.[itemId]?.unitCost));
  const totalSplit = qty.map((q, i) => q * rate[i]);
  return {
    budgetCategoryVersionId: section?.budgetCategoryVersionId ?? section?.id,
    splitName: item?.splitName,
    qty,
    rate,
    totalSplit,
  };
}