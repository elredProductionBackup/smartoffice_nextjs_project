"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import searchIcon from "@/assets/logo/search.svg";
import DashboardActionableList from "@/_components/DashboardActionableList";
// import { actionableData } from "@/assets/helpers/sampleActionable";
import { useDispatch, useSelector } from "react-redux";
import { fetchDashboardActionables } from "@/store/dashboard/dashboardThunks";

export default function ProfilePage() {
  const dispatch = useDispatch();

  const { items, loading } = useSelector(
    (state) => state.dashboard
  );

  useEffect(() => {
    dispatch(fetchDashboardActionables());
  }, [dispatch]);
  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <div className="mx-50">
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
      </div>

      <div className="dashboard-items mt-[20px] grid grid-cols-2 gap-4 flex-1 min-h-0 w-full overflow-y-auto">
        <DashboardActionableList
          data={items}
          loading={loading}
        />
      </div>
    </div>
  );
}
