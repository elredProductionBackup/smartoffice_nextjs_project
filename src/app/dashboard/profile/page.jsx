"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import searchIcon from "@/assets/logo/search.svg";
import DashboardActionableList from "@/_components/DashboardActionableList";
import DashboardFinanceList from "@/_components/DashboardFinanceList";
// import { actionableData } from "@/assets/helpers/sampleActionable";
import { useDispatch, useSelector } from "react-redux";
import { fetchDashboardActionables } from "@/store/dashboard/dashboardThunks";

export default function ProfilePage() {
  const dispatch = useDispatch();

  const { items, loading } = useSelector(
    (state) => state.dashboard
  );

  const refreshKey = useSelector((state) => state.actionableUi.refreshKey);

  useEffect(() => {
    dispatch(fetchDashboardActionables());
  }, [dispatch]);

  // Silent refetch when actionables changed elsewhere (assistant, WhatsApp, periodic poll)
  useEffect(() => {
    if (refreshKey) dispatch(fetchDashboardActionables({ silent: true }));
  }, [dispatch, refreshKey]);
  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-auto relative">
      {/* <div className="mx-50">
        <div className="relative border outline-none w-full h-15 border-[#E1E2E6] bg-[#F2F6FC] rounded-full px-6 ">
          <Image
            src={searchIcon}
            alt="search"
            className="absolute left-6 top-1/2 -translate-y-1/2 "
          />

          <input
            type="text"
            disabled
            className="w-full h-full bg-transparent pl-10 focus:outline-none text-base font-medium placeholder:text-[#666666] text-[#333]"
            placeholder="Who may come handy to me ?"
          />
        </div>
      </div> */}

        <div className="flex items-center gap-[20px] mt-[20px] mb-[10px]">
          <h2 className="font-heading text-[32px] font-semibold">Dashboard</h2>
        </div>

      <div className="dashboard-items grid grid-cols-2 gap-4 flex-1 min-h-0 w-full pb-[20px]">
        <DashboardActionableList
          data={items}
          loading={loading}
          fillHeight
        />
        <DashboardFinanceList fillHeight />
      </div>
    </div>
  );
}
