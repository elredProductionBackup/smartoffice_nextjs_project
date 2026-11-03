"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import PointDropdown from "@/_components/UI/PointDropdown";
import { fetchMasterConfig } from "@/store/events/eventsThunks";
import { useBudgetTypeStore } from "@/store/useBudgetTypeStore";

// Event type (portfolio) as single-select chips, with the points picker beside the label
export function EventTypeChips({ value, onChange, error, dataError }) {
  const dispatch = useDispatch();
  const pointsMaster = useSelector((state) => state.events.pointsMaster) || [];
  const { budgetTypes, fetchBudgetTypes } = useBudgetTypeStore();

  useEffect(() => {
    fetchBudgetTypes(true);
  }, [fetchBudgetTypes]);

  useEffect(() => {
    dispatch(fetchMasterConfig());
  }, [dispatch]);

  const selectedId = value?.type?.budgetTypeId ?? value?.type;

  return (
    <div className="flex flex-col" data-error={dataError ?? ""}>
      <div className="flex items-center justify-between gap-3 mb-[8px] min-h-[30px]">
        <span id="event-type-label" className="text-[14px] text-[#333333] font-[700]">
          Type of event<span className="text-red-500 ml-0.5">*</span>
        </span>
        <PointDropdown
          compact
          value={value?.points}
          onChange={(p) => onChange("points", p)}
          dynamicPoints={pointsMaster}
        />
      </div>

      <div role="radiogroup" aria-labelledby="event-type-label" className="flex flex-wrap gap-2">
        {budgetTypes.length === 0 && (
          <span className="text-[14px] text-[#999999] py-2">Loading portfolios…</span>
        )}
        {budgetTypes.map((item) => {
          const selected = selectedId === item.budgetTypeId;
          return (
            <button
              key={item.budgetTypeId}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange("type", item.budgetTypeId)}
              className={`h-[40px] px-4 rounded-full border-[1.4px] text-[14px] cursor-pointer select-none transition-colors ${
                selected
                  ? "border-[#0B57D0] bg-[#F2F7FF] text-[#0B57D0] font-semibold"
                  : `bg-white text-[#333333] font-medium hover:border-[#9DBBEB] ${error ? "border-red-400" : "border-[#E3EAF5]"}`
              }`}
            >
              {item.budgetType}
            </button>
          );
        })}
      </div>

      {error && <p className="text-[12px] text-red-500 mt-1.5">{error}</p>}
    </div>
  );
}
