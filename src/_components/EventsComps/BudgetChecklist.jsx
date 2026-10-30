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

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const BudgetChecklist = () => {
  const dispatch = useDispatch();
const router = useRouter();
const searchParams = useSearchParams();

const selectedBudgetTypeId = searchParams.get("budgetTypeId");

  const [categoryName, setCategoryName] = useState("");
  const [percentage, setPercentage] = useState("");
  const [adding, setAdding] = useState(false);

  const {
    budgetTypes,
    selectedBudgetType,
    categories,
    loadingTypes,
    loadingCategories,
  } = useSelector((state) => state.budget);

  useEffect(() => {
    dispatch(fetchBudgetTypes());
  }, [dispatch]);
useEffect(() => {
  if (!budgetTypes?.length) return;

  // URL has budgetTypeId
  if (selectedBudgetTypeId) {
    const selected = budgetTypes.find(
      item => item.budgetTypeId === selectedBudgetTypeId
    );

    if (
      selected &&
      selected?.budgetTypeId !==
        selectedBudgetType?.budgetTypeId
    ) {
      dispatch(setSelectedBudgetType(selected));
    }
  } else {
    // Default first item
    dispatch(setSelectedBudgetType(budgetTypes[0]));
  }
}, [
  budgetTypes,
  selectedBudgetTypeId,
  dispatch,
]);
useEffect(() => {
  if (!selectedBudgetType?.budgetTypeId) return;

  const current =
    searchParams.get("budgetTypeId");

  if (
    current !== selectedBudgetType.budgetTypeId
  ) {
    const params = new URLSearchParams(
      searchParams.toString()
    );

    params.set(
      "budgetTypeId",
      selectedBudgetType.budgetTypeId
    );

    router.replace(
      `?${params.toString()}`,
      { scroll: false }
    );
  }
}, [selectedBudgetType]);
  useEffect(() => {
    if (selectedBudgetType?.budgetTypeId) {
      dispatch(
        fetchBudgetCategories(
          selectedBudgetType.budgetTypeId
        )
      );
    }
  }, [selectedBudgetType, dispatch]);
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
    if (adding) return; // guard against double submits while the request is in flight
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

    setAdding(true);
    dispatch(
      addBudgetCategory({
        budgetTypeId: selectedBudgetType.budgetTypeId,
        budgetCategory: categoryName,
        percentage: newPercentage,
      })
    )
      .then((res) => {
        if (res.type === 'budget/addCategory/fulfilled') {
          setCategoryName("");
          setPercentage("");
        }
      })
      .finally(() => setAdding(false));
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
    <div className="flex flex-col pb-20 md:h-[calc(100vh-80px)] md:overflow-auto md:pb-[20px]">

      {/* Header */}

      <div className="flex items-center gap-3 md:gap-5 mt-4 md:mt-5 mb-4 md:mb-6">
        <span
          className="maki--arrow rotate-180 cursor-pointer shrink-0"
          onClick={() => router.back()}
        />
        <h2 className="font-heading text-[24px] md:text-[32px] font-semibold">
          Budget Checklist
        </h2>
      </div>

      {/* Budget Cards */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 mb-6 md:mb-8">

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
                cursor-pointer rounded-2xl border p-4 sm:p-5 transition-all duration-300
                hover:shadow-lg hover:-translate-y-1
                ${active
                  ? "border-blue-600 bg-blue-50 shadow-md"
                  : "border-gray-200 bg-white shadow-sm hover:shadow-md"
                }
              `}
            >
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 break-words">
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
                  {item.totalPercentAllocation}%
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
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 md:p-8">

          <h2 className="text-blue-600 text-lg sm:text-xl font-semibold mb-4 md:mb-6 break-words">
            {selectedBudgetType.budgetType}
          </h2>

          {/* Progress */}

          <div className="flex justify-between gap-3 mb-2">
            <span>Total Budget Allocated</span>

            <span>
              {totalPercentage}%
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-gray-200 mb-6 md:mb-8">
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
            <div className="space-y-3 sm:space-y-4 mb-6 md:mb-8">
              {categories.map((item) => (
                <div
                  key={item.budgetCategoryId}
                  className="border border-gray-200 rounded-xl p-3 sm:p-4 flex justify-between items-center gap-3 hover:shadow-sm transition"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-[16px] break-words">
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
                    className="w-10 h-10 shrink-0 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 transition"
                    aria-label="Delete category"
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

          <div className="my-6 md:my-8 h-[1px] w-[100%] bg-gray-200" />

          {/* Add Category */}

          <h3 className="font-semibold text-lg mb-4 md:mb-5">
            Add New Category
          </h3>

          <div className="flex flex-col sm:flex-row gap-4">

            <div className="sm:flex-1">
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

            <div className="w-full sm:w-[140px]">
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
              disabled={remainingPercentage <= 0 || adding}
              className={`w-full sm:w-auto px-8 rounded-xl h-[52px] self-end text-white ${adding ? "opacity-70 cursor-wait" : ""} ${remainingPercentage <= 0
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