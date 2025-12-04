// import Image from "next/image";
// import { useState } from "react";
// import { FaWhatsapp, FaEnvelope, FaPhone } from "react-icons/fa";
// import { FiEdit2 } from "react-icons/fi";
// import callIcon from "@/assets/logo/call.svg";
// import { useVendorPopup } from "@/store/useVendorPopup";

// // ---------------------------------------------------------
// // SAMPLE DATA
// // ---------------------------------------------------------
// const vendorData = [
//   {
//     id: 1,
//     vendorName: "The Silver Sands Resort",
//     person: { name: "Amit Sharma", role: "Head of Hospitality" },
//     phone: "9876543210",
//     gst: "34XYZRT6543",
//     note: "This is the most used venue in Mumbai",
//   },
//   {
//     id: 2,
//     vendorName: "The Urban Retreat",
//     person: { name: "Rajesh Mehta", role: "Manager of Events" },
//     phone: "9876543211",
//     gst: "67GHJKL4567",
//     note: "Known for its sleek modern design",
//   },
//   {
//     id: 3,
//     vendorName: "The Royal Banquet Hall",
//     person: { name: "Sanjay Gupta", role: "Event Coordinator" },
//     phone: "9876501231",
//     gst: "89MNOPQ8910",
//     note: "Famous for hosting grand celebrations",
//   },
//   {
//     id: 4,
//     vendorName: "Lakeside Pavilion",
//     person: { name: "Nisha Verma", role: "Sales Executive" },
//     phone: "9876505678",
//     gst: "12RSTUVW2345",
//     note: "Offers stunning views of the water",
//   },
//   {
//     id: 5,
//     vendorName: "Golden Horizon Palace",
//     person: { name: "Karan Singh", role: "Operations Head" },
//     phone: "9811223344",
//     gst: "45ABCDE7689",
//     note: "Top choice for upscale corporate events",
//   },
//   {
//     id: 6,
//     vendorName: "Royal Heritage Villa",
//     person: { name: "Simran Kaur", role: "Client Relations Manager" },
//     phone: "9033445566",
//     gst: "78WXYZ2345",
//     note: "Heritage-themed venue with premium service",
//   },
//   {
//     id: 7,
//     vendorName: "Sunset Garden Venue",
//     person: { name: "Manish Gupta", role: "Venue Specialist" },
//     phone: "9900112233",
//     gst: "90QWERT5678",
//     note: "Best for outdoor engagements and receptions",
//   },
//   {
//     id: 8,
//     vendorName: "EventSpot Grandeur Hall",
//     person: { name: "Pooja Jain", role: "Events Lead" },
//     phone: "8888999966",
//     gst: "33HJKLQ2345",
//     note: "Great acoustics and modern lighting setup",
//   },
//   {
//     id: 9,
//     vendorName: "The Elegant Orchid Venue",
//     person: { name: "Sachin Rao", role: "Senior Coordinator" },
//     phone: "9700123456",
//     gst: "09PLMNB9876",
//     note: "Popular for intimate weddings",
//   },
//   {
//     id: 10,
//     vendorName: "Galaxy Luxe Convention Center",
//     person: { name: "Anjali Deshmukh", role: "Business Manager" },
//     phone: "9822334455",
//     gst: "27QAZWSX3456",
//     note: "Premium convention venue with 3,000+ capacity",
//   },
// ];

// export default function VendorTable({ data = vendorData }) {
//   const [openPhoneFor, setOpenPhoneFor] = useState(null);

//   const openVendorPopup = useVendorPopup((s) => s.openPopup);

//   const togglePhonePopup = (e, id) => {
//     e.stopPropagation();
//     setOpenPhoneFor((prev) => (prev === id ? null : id));
//   };

//   return (
//     <div className="bg-[#F2F7FF] h-[calc(100vh-226px)] rounded-[20px] p-5 overflow-auto">
//       {/* HEADER */}
//       <div className="grid grid-cols-5 px-4 py-4 sticky top-0 bg-[#F2F7FF] z-10 text-[#333] font-semibold text-lg border-b border-[#D4DFF1]">
//         <div>Vendor Name</div>
//         <div>Person of Contact</div>
//         <div className="text-center">Actions</div>
//         <div>GST</div>
//         <div>Note</div>
//       </div>

//       {/* ROWS */}
//       {data.map((item, index) => {
//         const popupDirection =
//           index >= data.length - 2 ? "bottom-full mb-3" : "top-12";

//         return (
//           <div
//             key={item.id}
//             className="grid grid-cols-5 px-4 py-6 border-b border-[#E2E8F6] text-[#333]"
//           >
//             {/* VENDOR NAME */}
//             <div className="text-lg font-semibold">{item.vendorName}</div>

//             {/* PERSON */}
//             <div>
//               <div className="font-semibold">{item.person.name}</div>
//               <div className="text-sm text-[#666]">{item.person.role}</div>
//             </div>

//             {/* ACTIONS */}
//             <div className="flex justify-center gap-4 items-center">
//               <div className="p-3 bg-[#E6EBF2] rounded-full cursor-pointer">
//                 <FaWhatsapp size={20} className="text-[#666]" />
//               </div>

//               <div className="p-3 bg-[#E6EBF2] rounded-full cursor-pointer">
//                 <FaEnvelope size={20} className="text-[#666]" />
//               </div>

//               {/* PHONE */}
//               <div
//                 className="relative p-3 bg-[#E6EBF2] rounded-full cursor-pointer"
//                 onClick={(e) => togglePhonePopup(e, item.id)}
//               >
//                 <FaPhone size={20} className="text-[#666]" />

//                 {openPhoneFor === item.id && (
//                   <div
//                     className={`absolute right-0 z-40 w-56 bg-white shadow-[0px_3px_4px_0px_rgba(190,190,190,0.25)] rounded-2xl p-4 ${popupDirection}`}
//                   >
//                     <div
//                       className={`w-4 h-4 bg-white rotate-45 absolute right-5 ${
//                         index >= data.length - 2 ? "-bottom-2" : "-top-2"
//                       }`}
//                     />

//                     <div className="uppercase text-sm font-bold mb-3">Phone</div>

//                     <div className="flex items-center gap-3">
//                       <div className="bg-[#E6EBF2] h-9 w-9 rounded-full flex items-center justify-center">
//                         <Image src={callIcon} alt="call" width={20} />
//                       </div>
//                       <div className="font-semibold text-base">{item.phone}</div>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* GST */}
//             <div className="font-medium">{item.gst}</div>

//             {/* NOTE — opens popup */}
//             <div className="flex justify-between items-start bg-white px-3 py-2 rounded-lg border border-[#E0E0E0] text-sm">
//               <span className="text-[#333]">{item.note}</span>

//               <FiEdit2
//                 size={16}
//                 className="text-[#666] cursor-pointer ml-2"
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   openVendorPopup({ id: item.id, note: item.note });
//                 }}
//               />
//             </div>
//           </div>
//         );
//       })}
//     </div>
//   );
// }

import Image from "next/image";
import { useState } from "react";
import { FaWhatsapp, FaEnvelope, FaPhone } from "react-icons/fa";
import { FiEdit2 } from "react-icons/fi";
import callIcon from "@/assets/logo/call.svg";
import { useVendorPopup } from "@/store/useVendorPopup";

// ---------------------------------------------------------
// SAMPLE DATA
// ---------------------------------------------------------
const vendorData = [
  {
    id: 1,
    vendorName: "The Silver Sands Resort",
    person: { name: "Amit Sharma", role: "Head of Hospitality" },
    phone: "9876543210",
    gst: "34XYZRT6543",
    note: "This is the most used venue in Mumbai",
  },
  {
    id: 2,
    vendorName: "The Urban Retreat",
    person: { name: "Rajesh Mehta", role: "Manager of Events" },
    phone: "9876543211",
    gst: "67GHJKL4567",
    note: "Known for its sleek modern design",
  },
  {
    id: 3,
    vendorName: "The Royal Banquet Hall",
    person: { name: "Sanjay Gupta", role: "Event Coordinator" },
    phone: "9876501231",
    gst: "89MNOPQ8910",
    note: "Famous for hosting grand celebrations",
  },
  {
    id: 4,
    vendorName: "Lakeside Pavilion",
    person: { name: "Nisha Verma", role: "Sales Executive" },
    phone: "9876505678",
    gst: "12RSTUVW2345",
    note: "Offers stunning views of the water",
  },
  {
    id: 5,
    vendorName: "Golden Horizon Palace",
    person: { name: "Karan Singh", role: "Operations Head" },
    phone: "9811223344",
    gst: "45ABCDE7689",
    note: "Top choice for upscale corporate events",
  },
  {
    id: 6,
    vendorName: "Royal Heritage Villa",
    person: { name: "Simran Kaur", role: "Client Relations Manager" },
    phone: "9033445566",
    gst: "78WXYZ2345",
    note: "Heritage-themed venue with premium service",
  },
  {
    id: 7,
    vendorName: "Sunset Garden Venue",
    person: { name: "Manish Gupta", role: "Venue Specialist" },
    phone: "9900112233",
    gst: "90QWERT5678",
    note: "Best for outdoor engagements and receptions",
  },
  {
    id: 8,
    vendorName: "EventSpot Grandeur Hall",
    person: { name: "Pooja Jain", role: "Events Lead" },
    phone: "8888999966",
    gst: "33HJKLQ2345",
    note: "Great acoustics and modern lighting setup",
  },
  {
    id: 9,
    vendorName: "The Elegant Orchid Venue",
    person: { name: "Sachin Rao", role: "Senior Coordinator" },
    phone: "9700123456",
    gst: "09PLMNB9876",
    note: "Popular for intimate weddings",
  },
  {
    id: 10,
    vendorName: "Galaxy Luxe Convention Center",
    person: { name: "Anjali Deshmukh", role: "Business Manager" },
    phone: "9822334455",
    gst: "27QAZWSX3456",
    note: "Premium convention venue with 3,000+ capacity",
  },
];

export default function VendorTable({ data = vendorData }) {
  const [openPhoneFor, setOpenPhoneFor] = useState(null);
  const openVendorPopup = useVendorPopup((s) => s.openPopup);

  const togglePhonePopup = (e, id) => {
    e.stopPropagation();
    setOpenPhoneFor((prev) => (prev === id ? null : id));
  };

  return (
    <div className="bg-[#F2F7FF] h-[calc(100vh-226px)] rounded-[20px] p-5 overflow-y-auto relative">

      {/* FIXED HEADER */}
      <div className="grid grid-cols-5 px-4 py-4 sticky top-0 bg-[#F2F7FF] z-20 text-[#333] font-semibold text-lg border-b border-[#D4DFF1] shadow-[0_2px_3px_rgba(0,0,0,0.05)]">
        <div>Vendor Name</div>
        <div>Person of Contact</div>
        <div className="text-center">Actions</div>
        <div>GST</div>
        <div>Note</div>
      </div>

      {/* ROWS */}
      {data.map((item, index) => {
        const popupDirection =
          index >= data.length - 2 ? "bottom-full mb-3" : "top-12";

        return (
          <div
            key={item.id}
            className="grid grid-cols-5 px-4 py-6 border-b border-[#E2E8F6] text-[#333] relative"
          >
            {/* VENDOR NAME */}
            <div className="text-lg font-semibold">{item.vendorName}</div>

            {/* PERSON */}
            <div>
              <div className="font-semibold">{item.person.name}</div>
              <div className="text-sm text-[#666]">{item.person.role}</div>
            </div>

            {/* ACTIONS */}
            <div className="flex justify-center gap-4 items-center">
              <div className="p-3 bg-[#E6EBF2] rounded-full cursor-pointer">
                <FaWhatsapp size={20} className="text-[#666]" />
              </div>

              <div className="p-3 bg-[#E6EBF2] rounded-full cursor-pointer">
                <FaEnvelope size={20} className="text-[#666]" />
              </div>

              {/* PHONE */}
              <div
                className="relative p-3 bg-[#E6EBF2] rounded-full cursor-pointer"
                onClick={(e) => togglePhonePopup(e, item.id)}
              >
                <FaPhone size={20} className="text-[#666]" />

                {openPhoneFor === item.id && (
                  <div
                    className={`absolute right-0 z-40 w-56 bg-white shadow-[0px_3px_4px_rgba(190,190,190,0.25)] rounded-2xl p-4 ${popupDirection}`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rotate-45 absolute right-5 ${
                        index >= data.length - 2 ? "-bottom-2" : "-top-2"
                      }`}
                    />

                    <div className="uppercase text-sm font-bold mb-3">Phone</div>

                    <div className="flex items-center gap-3">
                      <div className="bg-[#E6EBF2] h-9 w-9 rounded-full flex items-center justify-center">
                        <Image src={callIcon} alt="call" width={20} />
                      </div>
                      <div className="font-semibold text-base">{item.phone}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* GST */}
            <div className="font-medium">{item.gst}</div>

            {/* NOTE — opens popup */}
            <div className="flex justify-between items-start bg-white px-3 py-2 rounded-lg border border-[#E0E0E0] text-sm">
              <span className="text-[#333]">{item.note}</span>

              <FiEdit2
                size={16}
                className="text-[#666] cursor-pointer ml-2"
                onClick={(e) => {
                  e.stopPropagation();
                  openVendorPopup({ id: item.id, note: item.note });
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
