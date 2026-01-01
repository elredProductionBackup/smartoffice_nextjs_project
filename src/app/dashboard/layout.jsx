// "use client";

// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import dashboardLogo from "@/assets/logo/mage_dashboard.svg";
// import checklistLogo from "@/assets/logo/mage_shop.svg";
// import memberLogo from "@/assets/logo/tdesign_member.svg";
// import vendorsLogo from "@/assets/logo/vendors.svg";
// import resourcesLogo from "@/assets/logo/mynaui_database.svg";
// import archiveLogo from "@/assets/logo/ion_archive-outline.svg";
// import alliancesLogo from "@/assets/logo/la_handshake.svg";
// import Image from 'next/image'
// import Header from "@/_components/Header";

// export default function DashboardLayout({ children }) {
//   const pathname = usePathname();

//   const menu = [
//     { name: "Dashboard", path: "/dashboard/profile", logo: dashboardLogo },
//     { name: "Checklist", path: "/dashboard/checklist", logo: checklistLogo },
//     { name: "Members", path: "/dashboard/members?tab=members", logo: memberLogo },
//     { name: "Vendors", path: "/dashboard/vendors", logo: vendorsLogo },
//     { name: "Resources", path: "/dashboard/resources", logo: resourcesLogo },
//     { name: "Archive", path: "/dashboard/archive", logo: archiveLogo },
//     { name: "Alliances", path: "/dashboard/alliances", logo: alliancesLogo },
//   ];

//   return (
//     <div className="h-screen flex flex-col">
//       {/* 🔵 Navbar */}
//       <Header/>

//       {/* Main */}
//       <div className="flex flex-1">
//         <div className="p-5">
//           {/* Sidebar */}
//           <div className="w-21 bg-[#F2F7FF] h-full p-5 rounded-2xl">
//             {/* <h2 className="text-xl font-bold mb-4">Dashboard</h2> */}

//             <ul className="space-y-10">
//               {menu.map((item) => {
//                 const active = pathname === item.path;

//                 return (
//                   <li key={item.path}>
//                     <Link
//                       href={item.path}
//                       className={` h-11 w-11 flex items-center justify-center rounded-md transition
//                       ${
//                         active
//                           ? "bg-[#D3E3FD] text-white font-medium"
//                           : "hover:bg-blue-100"
//                       }
//                     `}
//                     >
//                       <Image src={item?.logo} alt={item.name}/>
//                     </Link>
//                   </li>
//                 );
//               })}
//             </ul>
//           </div>
//         </div>

//         {/* Dynamic Nested Page */}
//         <div className="flex-1 my-5 mx-5 overflow-y-auto ">{children}</div>
//       </div>
//     </div>
//   );
// }

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import dashboardLogo from "@/assets/logo/mage_dashboard.svg";
import checklistLogo from "@/assets/logo/mage_shop.svg";
import memberLogo from "@/assets/logo/tdesign_member.svg";
import vendorsLogo from "@/assets/logo/vendors.svg";
import resourcesLogo from "@/assets/logo/mynaui_database.svg";
import archiveLogo from "@/assets/logo/ion_archive-outline.svg";
import alliancesLogo from "@/assets/logo/la_handshake.svg";
import actionableLogo from "@/assets/logo/actionable.svg";
import Image from "next/image";
import Header from "@/_components/Header";
import useGlobalLoader from "@/store/useGlobalLoader";
import { useEffect } from "react";
import ProtectedRoute from "@/_components/ProtectedRoute";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const { hideLoader } = useGlobalLoader.getState();

  useEffect(() => {
    hideLoader();
  }, []);

  function removeAllParams(url) {
    return url.split("?")[0];
  }

  const menu = [
    { name: "Dashboard", path: "/dashboard/profile", logo: dashboardLogo },
    { name: "Checklist", path: "/dashboard/checklist", logo: checklistLogo },
    { name: "Vendors", path: "/dashboard/actionable", logo: actionableLogo },
    {
      name: "Members",
      path: "/dashboard/members?tab=members",
      logo: memberLogo,
    }, // ⬅ FIXED
    // { name: "Vendors", path: "/dashboard/vendors?tab=hotels", logo: vendorsLogo },
    // { name: "Resources", path: "/dashboard/resources", logo: resourcesLogo },
    // { name: "Archive", path: "/dashboard/archive", logo: archiveLogo },
    // { name: "Alliances", path: "/dashboard/alliances", logo: alliancesLogo },
  ];

  return (
    <ProtectedRoute>
      <div className="h-screen flex flex-col">
        {/* Navbar */}
        <Header />

        {/* Main */}
        <div className="flex flex-1 max-h-[calc(100vh - 80px)]">
          <div className="p-5">
            <div className="w-21 bg-[#F2F7FF] h-full p-5 rounded-2xl">
              <ul className="space-y-10">
                {menu.map((item) => {
                  // ⭐ Correct Active Logic
                  // const active = pathname.startsWith(item.path);
                  const active = pathname == removeAllParams(item.path);
                  return (
                    <li key={item.path}>
                      <Link
                        href={item.path}
                        className={`h-11 w-11 flex items-center justify-center rounded-md transition
                        ${
                          active
                            ? "bg-[#D3E3FD] font-medium"
                            : "hover:bg-blue-100"
                        }`}
                      >
                        <Image src={item.logo} alt={item.name} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

<<<<<<< Updated upstream
        {/* Nested Page */}
        <div className="flex-1 flex flex-col my-5 mx-5 overflow-y-auto">{children}</div>
=======
          {/* Nested Page */}
          <div className="flex-1 my-5 mx-5 overflow-y-auto">{children}</div>
        </div>
>>>>>>> Stashed changes
      </div>
    </ProtectedRoute>
  );
}
