// "use client";

// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { useBudgetTypeStore } from "@/store/useBudgetTypeStore";
// import { addBudgetCategory } from "@/services/expense.service";

// export default function BudgetChecklist() {
//   const router = useRouter();
//   const [portfolios, setPortfolios] = useState([]);
//   const [selectedId, setSelectedId] = useState("");

//   // Category Form State
//   const [newCatName, setNewCatName] = useState("");
//   const [newCatPercent, setNewCatPercent] = useState("0");

//   const {
//     budgetTypes: budgetTypesList,
//     loading: budgetTypeLoading,
//     fetchBudgetTypes,
//   } = useBudgetTypeStore();

//   useEffect(() => {
//     fetchBudgetTypes();
//   }, [fetchBudgetTypes]);

//   useEffect(() => {
//     if (budgetTypesList.length > 0) {
//       let savedList = [];
//       const saved = localStorage.getItem("smartoffice_portfolio_budgets");
//       if (saved) {
//         try {
//           savedList = JSON.parse(saved);
//         } catch (e) {
//           console.error("Failed to parse saved portfolios:", e);
//         }
//       }

//       const mergedPortfolios = budgetTypesList.map((item) => {
//         // const id = item.budgetTypeId ?? item._id ?? item.id ?? '';
//         // const name = item.name ?? item.title ?? item.budgetType ?? item.label ?? 'Unknown Budget Type';

//         // const savedItem = savedList.find(s => s.id === id) || 
//         //                   savedList.find(s => s.name?.toLowerCase() === name.toLowerCase());

//         return {
//           _id:item?.budgetTypeId,
//           name: item?.budgetType,
//           categoriesCount:item?.categoriesCount,
//           totalPercentage:item?.totalPercentage,
//         };
//       });

//       setPortfolios(mergedPortfolios);

//       if (mergedPortfolios.length > 0) {
//         if (!selectedId || !mergedPortfolios.some(p => p.id === selectedId)) {
//           setSelectedId(mergedPortfolios[0].id);
//         }
//       }
//     }
//   }, [budgetTypesList]);

//   const savePortfolios = (updated) => {
//     setPortfolios(updated);
//     localStorage.setItem("smartoffice_portfolio_budgets", JSON.stringify(updated));
//     // Notify same-tab listeners (e.g. Eventcosting dropdown, EventBudgetPopup)
//     window.dispatchEvent(
//       new StorageEvent("storage", {
//         key: "smartoffice_portfolio_budgets",
//         newValue: JSON.stringify(updated),
//       })
//     );
//   };

//   const selectedPortfolio = portfolios.find((p) => p.id === selectedId) || portfolios[0];

//   const handleAddCategory = async (e) => {
//     e.preventDefault();
//     const catName = newCatName.trim();
//     if (catName.length < 2) {
//       alert("Category name must be at least 2 characters long.");
//       return;
//     }

//     const percentVal = Number(newCatPercent) || 0;
//     const currentAllocated =
//       selectedPortfolio?.categories.reduce((sum, c) => sum + c.percentage, 0) || 0;

//     if (currentAllocated + percentVal > 100) {
//       alert("Total allocation cannot exceed 100%!");
//       return;
//     }

//     try {
//       await addBudgetCategory({
//         budgetTypeId: selectedId,
//         budgetCategory: catName,
//         percentage: percentVal,
//       });

//       // Force refreshing the store budgetTypes cached data so the list is updated from the database
//       await fetchBudgetTypes(true);

//       const updatedCategories = [
//         ...(selectedPortfolio?.categories || []),
//         { name: catName, percentage: percentVal },
//       ];

//       const updatedPortfolios = portfolios.map((p) =>
//         p.id === selectedId ? { ...p, categories: updatedCategories } : p
//       );

//       savePortfolios(updatedPortfolios);
//       setNewCatName("");
//       setNewCatPercent("0");
//     } catch (error) {
//       console.error("Error adding budget category:", error);
//       alert(error?.response?.data?.message || "Failed to add budget category on the server.");
//     }
//   };

//   const handleDeleteCategory = (catIndex) => {
//     const updatedCategories = selectedPortfolio.categories.filter((_, i) => i !== catIndex);
//     const updatedPortfolios = portfolios.map((p) =>
//       p.id === selectedId ? { ...p, categories: updatedCategories } : p
//     );
//     savePortfolios(updatedPortfolios);
//   };

//   const getPortfolioStats = (portfolio) => {
//     const categoriesCount = portfolio.categories?.length || 0;
//     const allocatedPercent =
//       portfolio.categories?.reduce((sum, c) => sum + c.percentage, 0) || 0;
//     return { categoriesCount, allocatedPercent };
//   };

//   return (
//     <div className="w-full h-auto p-6 md:p-4 font-nunito">
//       {/* Back button */}
//       <button
//         onClick={() => router.push("/dashboard/events")}
//         className="flex items-center gap-2 text-sm font-semibold text-[#1e293b] hover:text-blue-600 transition-colors mb-8 cursor-pointer"
//       >
//         <span className="text-[16px]">←</span> Back to Events
//       </button>

//       {/* Page Title */}
//       <div className="mb-8">
//         <h1 className="text-[32px] font-bold text-slate-900 tracking-tight mb-1">
//           Budget Checklist
//         </h1>
//         <p className="text-slate-500 text-sm">
//           Manage budget allocations across different portfolios
//         </p>
//       </div>
//       {/* Portfolio Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
//         {portfolios.map((portfolio) => {
//           const isSelected = portfolio.id === selectedId;
//           // const { categoriesCount, allocatedPercent } = getPortfolioStats(portfolio);
//           return (
//             <div
//               key={portfolio.id}
//               onClick={() => setSelectedId(portfolio.id)}
//               className={`p-5 rounded-2xl bg-white border-2 transition-all duration-200 cursor-pointer shadow-md ${
//                 isSelected
//                   ? "border-[#2B7FFF] bg-[#2B7FFF]/[0.03] shadow-blue-100"
//                   : "border-slate-100 hover:border-slate-200 hover:shadow-lg"
//               }`}
//             >
//               <h3 className="text-[15px] font-bold text-slate-800 mb-2">{portfolio.name}</h3>
//               <p className="text-[13px] text-slate-500 font-medium mb-1">
//                 {portfolio?.categoriesCount} categories
//               </p>
//               <p className="text-[13px] text-slate-500 font-medium">
//                 {portfolio?.totalPercentage}% allocated
//               </p>
//             </div>
//           );
//         })}
//       </div>

//       {/* Selected Portfolio Detail Card */}
//       {selectedPortfolio && (
//         <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8">
//           {/* Portfolio name */}
//           <h2 className="text-[17px] font-bold text-[#2B7FFF] mb-5"> 
//             {selectedPortfolio.name}
//           </h2>

//           {/* Progress Bar */}
//           <div className="mb-6">
//             <div className="flex justify-between items-center mb-2">
//               <span className="text-[14px] font-semibold text-slate-700">
//                 Total Budget Allocated
//               </span>
//               <span className="text-[14px] font-semibold text-slate-700">
//                 {getPortfolioStats(selectedPortfolio).allocatedPercent}%
//               </span>
//             </div>
//             <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
//               <div
//                 className="h-full bg-slate-400 rounded-full transition-all duration-300"
//                 style={{
//                   width: `${getPortfolioStats(selectedPortfolio).allocatedPercent}%`,
//                 }}
//               />
//             </div>
//           </div>

//           {/* Budget Categories */}
//           <div className="mb-6">
//             <h3 className="text-[15px] font-bold text-slate-800 mb-4">Budget Categories</h3>

//             {selectedPortfolio.categoriesCount === 0 ? (
//               <div className="py-10 flex justify-center items-center text-slate-400 text-sm border-b border-slate-100 mb-6">
//                 No categories yet. Add your first category below.
//               </div>
//             ) : (
//               <div className="divide-y divide-slate-100 border-b border-slate-100 mb-6">
//                 {/* {selectedPortfolio.categories.map((cat, index) => (
//                   <div key={index} className="py-4 flex justify-between items-center">
//                     <span className="font-semibold text-slate-800 text-[15px]">
//                       {index + 1}. {cat.name}
//                     </span>
//                     <div className="flex items-center gap-6">
//                       <span className="font-bold text-[#2B7FFF] text-[15px]">
//                         {cat.percentage}%
//                       </span>
//                       <button
//                         onClick={() => handleDeleteCategory(index)}
//                         className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer text-sm"
//                         title="Delete"
//                       >
//                         🗑️
//                       </button>
//                     </div>
//                   </div>
//                 ))} */}
//               </div>
//             )}
//           </div>

//           {/* Add New Category */}
//           <div>
//             <h4 className="text-[14px] font-bold text-slate-800 mb-4">Add New Category</h4>
//             <form
//               onSubmit={handleAddCategory}
//               className="flex flex-col md:flex-row gap-4 items-end"
//             >
//               <div className="flex-1 w-full">
//                 <label className="block text-[12px] font-semibold text-slate-500 mb-2">
//                   Category Name
//                 </label>
//                 <input
//                   type="text"
//                   placeholder="e.g., Marketing, Salaries"
//                   value={newCatName}
//                   onChange={(e) => setNewCatName(e.target.value)}
//                   className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-[#2B7FFF] focus:bg-white text-sm font-medium text-slate-800 placeholder:text-slate-400 transition-colors"
//                 />
//               </div>

//               <div className="w-full md:w-36">
//                 <label className="block text-[12px] font-semibold text-slate-500 mb-2">
//                   Percentage
//                 </label>
//                 <div className="relative flex items-center">
//                   <input
//                     type="number"
//                     min="0"
//                     max="100"
//                     value={newCatPercent}
//                     onChange={(e) => setNewCatPercent(e.target.value)}
//                     className="w-full h-11 pl-4 pr-8 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-[#2B7FFF] focus:bg-white text-sm font-semibold text-slate-800 transition-colors"
//                   />
//                   <span className="absolute right-3 text-slate-400 text-sm font-semibold pointer-events-none">
//                     %
//                   </span>
//                 </div>
//               </div>

//               <button
//                 type="submit"
//                 className="h-11 px-6 bg-[linear-gradient(95.15deg,#5597ED_3.84%,#00449C_96.38%)] hover:opacity-90 text-white font-bold text-sm rounded-xl transition-all duration-200 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
//               >
//                 <span className="text-base font-bold">+</span> Add
//               </button>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
'use client'

import {
  addBudgetCategory,
  fetchBudgetCategories,
  fetchBudgetTypes,
  removeBudgetCategory
} from "@/store/events/budgetChecklist/budgetThunks";

import {
  setSelectedBudgetType,
} from "@/store/events/budgetChecklist/budgetSlice";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const BudgetChecklist = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const [categoryName, setCategoryName] = useState("");
  const [percentage, setPercentage] = useState("");

  const {
    budgetTypes,
    selectedBudgetType,
    categories,
    loadingTypes,
    loadingCategories,
  } = useSelector((state) => state.budget);

  useEffect(() => {
    dispatch(fetchBudgetTypes());
  }, []);

  useEffect(() => {
    if (selectedBudgetType?.budgetTypeId) {
      dispatch(
        fetchBudgetCategories(
          selectedBudgetType.budgetTypeId
        )
      );
    }
  }, [selectedBudgetType]);

  const handleDelete = (categoryId) => {
    dispatch(
      removeBudgetCategory({
        budgetCategoryId: categoryId,
        budgetTypeId:
          selectedBudgetType.budgetTypeId,
      })
    );
  };

  const currentTotal = categories.reduce(
    (sum, item) => sum + Number(item.percentage || 0),
    0
  );

  const handleAddCategory = () => {
    const newPercentage = Number(percentage);

    if (!categoryName.trim()) {
      alert("Please enter category name.");
      return;
    }

    if (!newPercentage || newPercentage <= 0) {
      alert("Please enter a valid percentage.");
      return;
    }

    if (currentTotal + newPercentage > 100) {
      alert(
        `Total percentage cannot exceed 100%. Remaining: ${100 - currentTotal
        }%`
      );
      return;
    }

    dispatch(
      addBudgetCategory({
        budgetTypeId: selectedBudgetType.budgetTypeId,
        budgetCategory: categoryName,
        percentage: newPercentage,
      })
    ).then((res) => {
      console.log(res ?? 'not yet')
      if (res.type === 'budget/addCategory/fulfilled') {
        setCategoryName("");
        setPercentage("");
      }
    });
  };

  const totalPercentage = categories?.reduce(
    (sum, item) => sum + Number(item.percentage || 0),
    0
  );

  const remainingPercentage = Math.max(
    100 - totalPercentage,
    0
  );

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-auto pb-[20px]">

      {/* Header */}

      <div className="flex items-center gap-5 mt-5 mb-6">
        <span
          className="maki--arrow rotate-180 cursor-pointer"
          onClick={() => router.back()}
        />
        <h2 className="text-[32px] font-semibold">
          Budget Checklist
        </h2>
      </div>

      {/* Budget Cards */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">

        {budgetTypes?.map((item) => {
          const active =
            selectedBudgetType?.budgetTypeId ===
            item.budgetTypeId;

          return (
            <div
              key={item.budgetTypeId}
              onClick={() =>
                dispatch(setSelectedBudgetType(item))
              }
              className={`
                cursor-pointer rounded-2xl border p-5 transition-all duration-300
                hover:shadow-lg hover:-translate-y-1
                ${active
                  ? "border-blue-600 bg-blue-50 shadow-md"
                  : "border-gray-200 bg-white shadow-sm hover:shadow-md"
                }
              `}
            >
              <h3 className="text-xl font-semibold mb-4">
                {item.budgetType}
              </h3>

              <div className="flex justify-between mb-2">
                <span className="text-gray-500">
                  Categories
                </span>

                <span className="font-semibold">
                  {item.categoriesCount}
                </span>
              </div>

              <div className="flex justify-between mb-3">
                <span className="text-gray-500">
                  Allocated
                </span>

                <span className="font-semibold">
                  {item.totalPercentage}%
                </span>
              </div>

              {/* <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600"
                  style={{
                    width: `${item.totalPercentage}%`,
                  }}
                />
              </div> */}
            </div>
          );
        })}
      </div>

      {/* Selected Budget */}

      {selectedBudgetType && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8">

          <h2 className="text-blue-600 text-xl font-semibold mb-6">
            {selectedBudgetType.budgetType}
          </h2>

          {/* Progress */}

          <div className="flex justify-between mb-2">
            <span>Total Budget Allocated</span>

            <span>
              {totalPercentage}%
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-gray-200 mb-8">
            <div
              className="h-full rounded-full bg-blue-600"
              style={{
                width: `${totalPercentage}%`,
              }}
            />
          </div>

          {/* Categories */}

          {loadingCategories ? (
            <div className="py-10 text-center">
              Loading...
            </div>
          ) : categories?.length ? (
            <div className="space-y-4 mb-8">
              {categories.map((item) => (
                <div
                  key={item.budgetCategoryId}
                  className="border border-gray-200 rounded-xl p-4 flex justify-between items-center hover:shadow-sm transition"
                >
                  <div>
                    <p className="font-medium text-[16px]">
                      {item.budgetCategory}
                    </p>

                    <p className="text-sm text-blue-600">
                      {item.percentage}%
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(item.budgetCategoryId)
                    }
                    className="w-10 h-10 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 transition"
                  > 
                    <span className="fluent--delete-16-regular"></span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-10">
              No categories yet. Add your first category below.
            </div>
          )}

          <div className="my-8 h-[1px] w-[100%] bg-gray-200" />

          {/* Add Category */}

          <h3 className="font-semibold text-lg mb-5">
            Add New Category
          </h3>

          <div className="flex gap-4">

            <div className="flex-1">
              <label className="text-sm text-gray-500 mb-2 block">
                Category Name
              </label>

              <input
                type="text"
                value={categoryName}
                onChange={(e) =>
                  setCategoryName(e.target.value)
                }
                placeholder="e.g. Marketing, Salaries"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none"
              />
            </div>

            <div className="w-[140px]">
              <label className="text-sm text-gray-500 mb-2 block">
                Percentage
              </label>

              <input
                type="number"
                value={percentage}
                onChange={(e) =>
                  setPercentage(e.target.value)
                }
                placeholder="0.00"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none"
              />
            </div>

            <button
              disabled={remainingPercentage <= 0}
              className={`px-8 rounded-xl h-[52px] self-end text-white ${remainingPercentage <= 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600"
                }`}
              onClick={handleAddCategory}
            >
              + Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetChecklist;