import { useEffect, useRef, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { ExpenseItemCard } from "./Expenseitemcard";

const PLACEHOLDER = "Select Expense Category";
const MENU_MAX_HEIGHT = 280;

/* Custom dropdown matching the app's other selects; opens upward when there's no room below */
function CategorySelect({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleToggle = () => {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUp(spaceBelow < MENU_MAX_HEIGHT + 16 && rect.top > spaceBelow);
    }
    setOpen((o) => !o);
  };

  const select = (val) => {
    onChange(val);
    setOpen(false);
  };

  const itemClass =
    "block w-full text-left px-4 py-2.5 border-none rounded-lg transition-colors duration-150 font-['Nunito_Sans'] font-medium text-[16px] leading-[136%]";

  return (
    <div ref={ref} className="relative flex-1">
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-[14px] bg-white text-[15px] cursor-pointer outline-none text-left focus:border-[#1A73E8] transition-colors"
        style={{ color: value ? "#1e293b" : "#94a3b8" }}
      >
        <span className="truncate">{value || PLACEHOLDER}</span>
        <ChevronDown
          className="w-4 h-4 ml-2 shrink-0 text-slate-500 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {open && (
        <div
          className={`absolute left-0 w-full bg-white rounded-[14px] z-[9999] overflow-y-auto p-2 ${
            openUp ? "bottom-[calc(100%+6px)]" : "top-[calc(100%+6px)]"
          }`}
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.13)", maxHeight: `${MENU_MAX_HEIGHT}px` }}
        >
          <button
            type="button"
            onMouseDown={() => select("")}
            className={`${itemClass} cursor-pointer text-slate-400 ${
              !value ? "bg-indigo-50" : "bg-transparent hover:bg-slate-50"
            }`}
          >
            {PLACEHOLDER}
          </button>
          {options.length === 0 ? (
            <div className="py-4 text-center text-[14px] text-slate-400">No categories available</div>
          ) : (
            options.map((opt, i) => {
              const isSelected = opt.name === value;
              return (
                <button
                  key={`${opt.name}-${i}`}
                  type="button"
                  disabled={opt.disabled}
                  onMouseDown={() => !opt.disabled && select(opt.name)}
                  className={`${itemClass} ${
                    opt.disabled
                      ? "text-slate-300 cursor-not-allowed bg-transparent"
                      : `text-[#333333] cursor-pointer ${isSelected ? "bg-indigo-50" : "bg-transparent hover:bg-slate-50"}`
                  }`}
                >
                  {opt.name}
                  {opt.disabled && <span className="ml-2 text-[13px] text-slate-400">(already added)</span>}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export function ExpenseItemsSection({
  budgetCategories,
  expenseItems,
  onAddExpense,
  onRemoveExpense,
  onSubItemChange,
  onSaveExpense,
  readOnly = false,
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
      {!readOnly && (
      <div className="flex items-center gap-3 mb-6">
        <CategorySelect
          value={selectedCategory}
          onChange={setSelectedCategory}
          options={budgetCategories.map((cat) => ({
            name: cat.name,
            disabled: expenseItems.some((e) => e.category === cat.name),
          }))}
        />
        <button
          onClick={handleAdd}
          disabled={!selectedCategory}
          className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-[14px] text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Add new item
        </button>
      </div>
      )}

      <div className="space-y-4">
        {expenseItems.map((expense) => (
          <ExpenseItemCard
            key={expense.id}
            expense={expense}
            onRemove={onRemoveExpense}
            onSubItemChange={onSubItemChange}
            onSave={onSaveExpense}
            readOnly={readOnly}
          />
        ))}
      </div>
    </div>
  );
}