import React, { useState, useRef, useEffect } from 'react';
import { FiBell } from 'react-icons/fi';
import Image from "next/image";
import Link from "next/link";
import callIcon from "@/assets/logo/call.svg";
import MemberDetailsModal from "./MemberDetailsModal";
import ExportAsExcelButton from "./ExportAsExcelButton";
import AddVehicleModal from "./AddVehicleModal";

const LogisticsContent = () => {
  const phonePopupRef = useRef(null);
  const [openPhoneFor, setOpenPhoneFor] = useState(null);
  const [copiedPhoneFor, setCopiedPhoneFor] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [memberForVehicle, setMemberForVehicle] = useState(null);
  const [vehicleDetails, setVehicleDetails] = useState({});

  const handleCopyPhone = (e, phone, memberId) => { 
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedPhoneFor(memberId);
    setTimeout(() => {
      setCopiedPhoneFor(null);
    }, 2000);
  };
 
  const showPhoneDetails = (e, memberId) => {
    e.stopPropagation();
    setOpenPhoneFor((prev) => (prev === memberId ? null : memberId));
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        openPhoneFor &&
        phonePopupRef.current &&
        !phonePopupRef.current.contains(e.target)
      ) {
        setOpenPhoneFor(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openPhoneFor]);

  const dummyData = [
    {
      date: "22 Aug",
      records: [
        {
          id: 1,
          eta: "1:00 PM",
          travelMode: "6E 123",
          member: "Ellen Dissinger",
          title: [{value: "Speaker"}],
          avatar: "https://randomuser.me/api/portraits/women/44.jpg",
          email: "ellen@example.com",
          phone: "+91 9876543210"
        },
        {
          id: 2,
          eta: "4:00 PM",
          travelMode: "Rajdhani",
          member: "Arjun Patel",
          title: [{value: "Guest"}],
          avatar: "https://randomuser.me/api/portraits/men/44.jpg",
          email: "arjun@example.com",
          phone: "+91 9123456780"
        },
        {
          id: 3,
          eta: "8:00 PM",
          travelMode: "Self",
          member: "Lila Reyes",
          title: [{value: "Event Manager"}],
          avatar: "https://randomuser.me/api/portraits/women/68.jpg",
          email: "lila@example.com",
          phone: "+91 9988776655"
        },
        {
          id: 4,
          eta: "10:30 PM",
          travelMode: "Vande Bharat",
          member: "Sophie Lin",
          title: [{value: "Developer"}],
          avatar: "https://randomuser.me/api/portraits/women/22.jpg",
          email: "sophie@example.com",
          phone: "+91 9334455667"
        },
      ],
    },
    {
      date: "23 Aug",
      records: [
        {
          id: 5,
          eta: "9:00 AM",
          travelMode: "AI 678",
          member: "Nina O'Sullivan",
          title: [{value: "VIP Guest"}],
          avatar: "https://randomuser.me/api/portraits/women/62.jpg",
          email: "nina@example.com",
          phone: "+91 9876123450"
        },
        {
          id: 6,
          eta: "11:15 AM",
          travelMode: "BA 112",
          member: "John Smith",
          title: [{value: "Investor"}],
          avatar: "https://randomuser.me/api/portraits/men/32.jpg",
          email: "john@example.com",
          phone: "+91 9001122334"
        },
        {
          id: 7,
          eta: "2:00 PM",
          travelMode: "Self",
          member: "Priya Sharma",
          title: [{value: "Coordinator"}],
          avatar: "https://randomuser.me/api/portraits/women/12.jpg",
          email: "priya@example.com",
          phone: "+91 9556677889"
        },
      ],
    },
    {
      date: "24 Aug",
      records: [
        {
          id: 8,
          eta: "8:00 AM",
          travelMode: "Shatabdi",
          member: "Kenji Tanaka",
          title: [{value: "Designer"}],
          avatar: "https://randomuser.me/api/portraits/men/15.jpg",
          email: "kenji@example.com",
          phone: "+91 9223344556"
        },
        {
          id: 9,
          eta: "3:30 PM",
          travelMode: "EK 500",
          member: "Fatima Ali",
          title: [{value: "Sponsor"}],
          avatar: "https://randomuser.me/api/portraits/women/15.jpg",
          email: "fatima@example.com",
          phone: "+91 9667788990"
        },
      ],
    }
  ];

  return (
    <div className="w-full rounded-[24px] relative">
      {/* Table Headers */}
      <div className="flex pb-4 text-[14px] md:text-[15px] font-bold text-gray-700">
        <div className="w-[15%] text-left">Date</div>
        <div className="w-[85%] grid grid-cols-12 gap-2">
          <div className="col-span-2 text-left pl-2">ETA</div>
          <div className="col-span-3 text-center">Mode of travel</div>
          <div className="col-span-3 text-left pl-6">Member name</div>
          <div className="col-span-2 text-center">Vehicle Details</div>
          <div className="col-span-2 text-center">Actions</div>
        </div>
      </div>

      {/* Table Body */}
      <div className="flex flex-col">
        {dummyData.map((group, groupIndex) => (
          <div key={groupIndex} className="flex flex-col">
            <div className="flex">
              {/* Date Column */}
              <div className="w-[15%] text-left font-bold text-[18px] md:text-[22px] text-[#222] pt-5">
                {group.date}
              </div>

              {/* Records Column */}
              <div className="w-[85%] flex flex-col">
                {group.records.map((item, recordIndex) => (
                  <div
                    key={item.id}
                    className={`grid grid-cols-12 gap-2 items-center py-5 ${
                      recordIndex !== group.records.length - 1 ? 'border-b border-gray-200/80' : ''
                    }`}
                  >
                    {/* ETA */}
                    <div className="col-span-2 text-left pl-2 text-gray-500 font-medium text-[16px]">
                      {item.eta}
                    </div>

                    {/* Mode of travel */}
                    <div className="col-span-3 text-center text-gray-500 font-medium text-[16px]">
                      {item.travelMode}
                    </div>

                    {/* Member name */}
                    <div 
                      className="col-span-3 flex font-600 items-center gap-4 pl-6 cursor-pointer p-1.5 -ml-1.5 rounded-lg transition"
                      onClick={() => {
                        const memberForModal = {
                          ...item,
                          name: item.member,
                          // Prefer real avatar, fall back to local dummy
                          avatar: item.avatar || "/image/dummy.jpg",
                          email: item.email || "ellen@example.com",
                          phone: item.phone || "+91 9876543210",
                          spouse: item.spouse || "Julia Dissinger",
                          children: item.children || [],
                          documents: item.documents || [],
                          location: item.location || { city: "Mumbai", state: "Maharashtra", country: "India" },
                          title: item.title || [{ value: "UX Designer" }],
                          pickup: item.pickup || "Mumbai, India",
                          // Show ETA as DATE | TIME (using group.date from list)
                          eta: `${group.date} | ${item.eta}`,
                          hotelDetails: item.hotelDetails || "Novotel Hyderabad Airport",
                          modeOfTravel: item.modeOfTravel || item.travelMode || "Flight, Bus",
                          flightDetails: item.flightDetails || "AY101",
                          // Separate car details into two lines
                          pickupCarDetails: item.pickupCarDetails || "Pickup - Car - TG 09 0001",
                          dropoffCarDetails: item.dropoffCarDetails || "Drop off - Car - TG 09 0001",
                          carDetails: item.carDetails,
                        };
                        setSelectedMember(memberForModal);
                      }}
                    >
                      <img
                        src={item.avatar || "/image/dummy.jpg"}
                        alt={item.member}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <span className="text-gray-800 font-semibold text-[15px]">{item.member}</span>
                    </div>

                    {/* Vehicle Details */}
                    <div className="col-span-2 flex flex-col items-center gap-2">
                      {vehicleDetails[item.id] ? (
                        <div className="flex flex-col gap-1.5 w-full items-center">
                          {vehicleDetails[item.id].pickupNumber && (
                            <div className="bg-[#EEF2F9] px-4 py-1.5 rounded-full w-fit">
                              <span className="text-[#0051CC] text-[12px] font-semibold underline decoration-[#0051CC]/40">
                                Pick up - {vehicleDetails[item.id].vehicleType} - {vehicleDetails[item.id].pickupNumber}
                              </span>
                            </div>
                          )}
                          {vehicleDetails[item.id].dropOffNumber && (
                            <div className="bg-[#EEF2F9] px-4 py-1.5 rounded-full w-fit">
                              <span className="text-[#0051CC] text-[12px] font-semibold underline decoration-[#0051CC]/40">
                                Drop off - {vehicleDetails[item.id].vehicleType} - {vehicleDetails[item.id].dropOffNumber}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setMemberForVehicle(item);
                            setIsVehicleModalOpen(true);
                          }}
                          className="text-[#0070FF] font-semibold hover:underline transition-all cursor-pointer"
                        >
                          Add
                        </button>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex items-center justify-center gap-3">
                      {/* Email */}
                      <Link
                        href={`mailto:${item.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="w-10 h-10 bg-[#E6EBF2] rounded-full flex items-center justify-center cursor-pointer text-[#666666] text-[18px]"
                        title="Send Email"
                      >
                        <span className="oui--email"></span>
                      </Link>

                      {/* PHONE ICON + POPUP */}
                      <div
                        className="w-10 h-10 bg-[#E6EBF2] rounded-full flex items-center justify-center cursor-pointer relative text-[#666666] text-[18px]"
                        onClick={(e) => showPhoneDetails(e, item.id)}
                      >
                        <span className="proicons--call"></span>
                        {/* PHONE POPUP */}
                        {openPhoneFor === item.id && (
                          <div
                            ref={phonePopupRef}
                            className={`w-[250px] bg-white z-30 p-5 rounded-[20px] absolute shadow-[0px_3px_4px_rgba(190,190,190,0.25)]
                            ${recordIndex >= 1 ? "bottom-12" : "top-12"} -right-2 cursor-default`} 
                            onClick={(e)=>e.stopPropagation()}
                          >
                            <div
                              className={`bg-white w-[24px] h-[24px] rotate-45 absolute right-4 
                              ${recordIndex >= 1 ? "-bottom-2" : "-top-2"}`}
                            ></div>

                            <div className="uppercase text-base font-bold text-[#333333] mb-2.5 text-left">
                              Phone
                            </div>

                            <div className="min-w-[180px] flex gap-2.5 items-center justify-between">
                                  <div className="flex items-center gap-[6px] hover:underline cursor-pointer" onClick={(e) => handleCopyPhone(e, item.phone, item.id)}>
                                    <div className="bg-[#E6EBF2] rounded-full h-8 w-8 flex items-center justify-center pointer-events-none">
                                      <Image src={callIcon} alt="call" width={20} height={20} />
                                    </div>
                                    <div className="text-[#333333] text-base font-semibold pointer-events-none">
                                      {item.phone}
                                    </div>
                                  </div>
                                <div className="relative" >
                                {/* COPIED TOOLTIP */}
                                {copiedPhoneFor === item.id && (
                                  <div className="absolute -top-8 left-1/2 -translate-x-1/2
                                              bg-[#333] text-white text-xs px-2 py-1
                                              rounded-md whitespace-nowrap shadow-md z-50 pointer-events-none"
                                  >
                                    Copied
                                  </div>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => handleCopyPhone(e, item.phone, item.id)}
                                  className="cursor-pointer flex items-center justify-center"
                                  title="Copy phone number"
                                >
                                  <span className="lucide--copy pointer-events-none"></span>
                                </button>
                              </div>
                              </div>
                          </div>
                        )}
                      </div>

                      {/* Reminder / Bell */}
                      <button className="w-10 h-10 bg-[#E6EBF2] rounded-full flex items-center justify-center hover:bg-gray-200 transition text-[#666666] text-[18px]">
                        <FiBell />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Divider between Date groups */}
            {groupIndex !== dummyData.length - 1 && (
               <div className="h-px bg-gray-200/80 my-2 ml-[15%] w-[85%]"></div>
            )}
          </div>
        ))}
      </div>

      {/* Export as Excel button */}
      <div className="absolute bottom-6 right-8">
        <ExportAsExcelButton className="pointer-events-auto shadow-lg" />
      </div>

      {/* Modal conditionally rendered when a member is clicked */}
      {selectedMember && (
        <MemberDetailsModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
          hideChildren
          showLogisticsDetails
        />
      )}

      {/* Vehicle Details Modal */}
      <AddVehicleModal
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        memberName={memberForVehicle?.member}
        onDone={(data) => {
          if (memberForVehicle) {
            setVehicleDetails(prev => ({
              ...prev,
              [memberForVehicle.id]: data
            }));
          }
          setIsVehicleModalOpen(false);
        }}
      />
    </div>
  );
};

export default LogisticsContent;
