"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const INITIAL_PORTFOLIOS = [
  { id: "learning", name: "Learning", categories: [] },
  { id: "forum", name: "Forum", categories: [] },
  { id: "family", name: "Family", categories: [] },
  { id: "spouse_partner", name: "Spouse partner", categories: [] },
  { id: "engagement", name: "Engagement", categories: [] },
  { id: "governance", name: "Governance", categories: [] },
  { id: "membership", name: "Membership", categories: [] },
  { id: "glc", name: "GLC", categories: [] },
  { id: "administration", name: "Administration", categories: [] },
];

export default function BudgetChecklist() {
  const router = useRouter();
  const [portfolios, setPortfolios] = useState([]);
  const [selectedId, setSelectedId] = useState("learning");

  // Category Form State
  const [newCatName, setNewCatName] = useState("");
  const [newCatPercent, setNewCatPercent] = useState("0");

  useEffect(() => {
    const saved = localStorage.getItem("smartoffice_portfolio_budgets");
    if (saved) {
      try {
        setPortfolios(JSON.parse(saved));
      } catch (e) {
        console.error(e);
        setPortfolios(INITIAL_PORTFOLIOS);
      }
    } else {
      setPortfolios(INITIAL_PORTFOLIOS);
    }
  }, []);

  const savePortfolios = (updated) => {
    setPortfolios(updated);
    localStorage.setItem("smartoffice_portfolio_budgets", JSON.stringify(updated));
    // Notify same-tab listeners (e.g. Eventcosting dropdown, EventBudgetPopup)
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "smartoffice_portfolio_budgets",
        newValue: JSON.stringify(updated),
      })
    );
  };

  const selectedPortfolio = portfolios.find((p) => p.id === selectedId) || portfolios[0];

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const percentVal = Number(newCatPercent) || 0;
    const currentAllocated =
      selectedPortfolio?.categories.reduce((sum, c) => sum + c.percentage, 0) || 0;

    if (currentAllocated + percentVal > 100) {
      alert("Total allocation cannot exceed 100%!");
      return;
    }

    const updatedCategories = [
      ...(selectedPortfolio?.categories || []),
      { name: newCatName.trim(), percentage: percentVal },
    ];

    const updatedPortfolios = portfolios.map((p) =>
      p.id === selectedId ? { ...p, categories: updatedCategories } : p
    );

    savePortfolios(updatedPortfolios);
    setNewCatName("");
    setNewCatPercent("0");
  };

  const handleDeleteCategory = (catIndex) => {
    const updatedCategories = selectedPortfolio.categories.filter((_, i) => i !== catIndex);
    const updatedPortfolios = portfolios.map((p) =>
      p.id === selectedId ? { ...p, categories: updatedCategories } : p
    );
    savePortfolios(updatedPortfolios);
  };

  const getPortfolioStats = (portfolio) => {
    const categoriesCount = portfolio.categories?.length || 0;
    const allocatedPercent =
      portfolio.categories?.reduce((sum, c) => sum + c.percentage, 0) || 0;
    return { categoriesCount, allocatedPercent };
  };

  return (
    <div className="w-full min-h-screen p-6 md:p-10 font-nunito">
      {/* Back button */}
      <button
        onClick={() => router.push("/dashboard/events")}
        className="flex items-center gap-2 text-sm font-semibold text-[#1e293b] hover:text-blue-600 transition-colors mb-8 cursor-pointer"
      >
        <span className="text-[16px]">←</span> Back to Events
      </button>

      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-[32px] font-bold text-slate-900 tracking-tight mb-1">
          Budget Checklist
        </h1>
        <p className="text-slate-500 text-sm">
          Manage budget allocations across different portfolios
        </p>
      </div>

      {/* Portfolio Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {portfolios.map((portfolio) => {
          const isSelected = portfolio.id === selectedId;
          const { categoriesCount, allocatedPercent } = getPortfolioStats(portfolio);

          return (
            <div
              key={portfolio.id}
              onClick={() => setSelectedId(portfolio.id)}
              className={`p-5 rounded-2xl bg-white border-2 transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "border-[#2B7FFF] bg-[#2B7FFF]/[0.03]"
                  : "border-slate-100 hover:border-slate-200 hover:shadow-sm"
              }`}
            >
              <h3 className="text-[15px] font-bold text-slate-800 mb-2">{portfolio.name}</h3>
              <p className="text-[13px] text-slate-500 font-medium mb-1">
                {categoriesCount} categories
              </p>
              <p className="text-[13px] text-slate-500 font-medium">
                {allocatedPercent}% allocated
              </p>
            </div>
          );
        })}
      </div>

      {/* Selected Portfolio Detail Card */}
      {selectedPortfolio && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8">
          {/* Portfolio name */}
          <h2 className="text-[17px] font-bold text-[#2B7FFF] mb-5">
            {selectedPortfolio.name}
          </h2>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[14px] font-semibold text-slate-700">
                Total Budget Allocated
              </span>
              <span className="text-[14px] font-semibold text-slate-700">
                {getPortfolioStats(selectedPortfolio).allocatedPercent}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-400 rounded-full transition-all duration-300"
                style={{
                  width: `${getPortfolioStats(selectedPortfolio).allocatedPercent}%`,
                }}
              />
            </div>
          </div>

          {/* Budget Categories */}
          <div className="mb-6">
            <h3 className="text-[15px] font-bold text-slate-800 mb-4">Budget Categories</h3>

            {selectedPortfolio.categories.length === 0 ? (
              <div className="py-10 flex justify-center items-center text-slate-400 text-sm border-b border-slate-100 mb-6">
                No categories yet. Add your first category below.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border-b border-slate-100 mb-6">
                {selectedPortfolio.categories.map((cat, index) => (
                  <div key={index} className="py-4 flex justify-between items-center">
                    <span className="font-semibold text-slate-800 text-[15px]">
                      {index + 1}. {cat.name}
                    </span>
                    <div className="flex items-center gap-6">
                      <span className="font-bold text-[#2B7FFF] text-[15px]">
                        {cat.percentage}%
                      </span>
                      <button
                        onClick={() => handleDeleteCategory(index)}
                        className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer text-sm"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Category */}
          <div>
            <h4 className="text-[14px] font-bold text-slate-800 mb-4">Add New Category</h4>
            <form
              onSubmit={handleAddCategory}
              className="flex flex-col md:flex-row gap-4 items-end"
            >
              <div className="flex-1 w-full">
                <label className="block text-[12px] font-semibold text-slate-500 mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Marketing, Salaries"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-[#2B7FFF] focus:bg-white text-sm font-medium text-slate-800 placeholder:text-slate-400 transition-colors"
                />
              </div>

              <div className="w-full md:w-36">
                <label className="block text-[12px] font-semibold text-slate-500 mb-2">
                  Percentage
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newCatPercent}
                    onChange={(e) => setNewCatPercent(e.target.value)}
                    className="w-full h-11 pl-4 pr-8 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-[#2B7FFF] focus:bg-white text-sm font-semibold text-slate-800 transition-colors"
                  />
                  <span className="absolute right-3 text-slate-400 text-sm font-semibold pointer-events-none">
                    %
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="h-11 px-6 bg-[#2B7FFF] hover:bg-[#1A6EEF] text-white font-bold text-sm rounded-xl transition-all duration-200 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <span className="text-base font-bold">+</span> Add
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
