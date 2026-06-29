export function categorySlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function categoriesToSections(categories) {
  return categories.map((cat) => ({
    id: categorySlug(cat.name),
    name: cat.name,
    items: [],
  }));
}

export function categoriesToSectionBudgets(categories, budget) {
  const map = {};

  categories.forEach((cat) => {
    map[categorySlug(cat.name)] = Math.round(
      (cat.percentage / 100) * budget
    );
  });

  return map;
}

export function getItemTotal(values, itemId) {
  const v = values[itemId];

  if (!v) return 0;

  return v.qty * v.unitCost;
}

export function getSectionTotal(values, section) {
  return section.items.reduce(
    (sum, item) => sum + getItemTotal(values, item.id),
    0
  );
}

export function fmt(n) {
  if (n === 0) return "0";

  return n.toLocaleString("en-IN");
}