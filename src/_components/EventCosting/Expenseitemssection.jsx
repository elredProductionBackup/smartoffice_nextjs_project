import { useState } from "react";
import { Plus } from "lucide-react";
import { ExpenseItemCard } from "./Expenseitemcard";

export function ExpenseItemsSection({
  budgetCategories,
  expenseItems,
  onAddExpense,
  onRemoveExpense,
  onFieldChange,
  onSubItemChange,
}) {
  const [selectedCategory, setSelectedCategory] = useState("");

  const handleAdd = () => {
    if (!selectedCategory) return;
    onAddExpense(selectedCategory);
    setSelectedCategory("");
  };

  return (
    <div className="mt-8 pt-6 border-t border-gray-200">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Expense Items</h3>
      <div className="flex items-center gap-3 mb-6">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Expense Category</option>
          {budgetCategories.map((cat) => {
            const alreadyAdded = expenseItems.some((e) => e.category === cat.name);
            return (
              <option key={cat.name} value={cat.name} disabled={alreadyAdded}>
                {cat.name}
                {alreadyAdded ? " (already added)" : ""}
              </option>
            );
          })}
        </select>
        <button
          onClick={handleAdd}
          disabled={!selectedCategory}
          className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Add new item
        </button>
      </div>

      <div className="space-y-4">
        {expenseItems.map((expense) => (
          <ExpenseItemCard
            key={expense.id}
            expense={expense}
            onRemove={onRemoveExpense}
            onFieldChange={onFieldChange}
            onSubItemChange={onSubItemChange}
          />
        ))}
      </div>
    </div>
  );
}