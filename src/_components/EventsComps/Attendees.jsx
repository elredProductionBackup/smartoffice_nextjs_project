import Image from "next/image";
import { useEffect, useState } from "react";
import { FiMail, FiPhone, FiBell } from "react-icons/fi";
import { DUMMY_ATTENDEES } from "@/assets/helpers/sampleEvents";
import { useDispatch, useSelector } from "react-redux";
import { fetchEventMembers } from "@/store/events/eventsThunks";

const Attendees = ({ eventId }) => {
  const dispatch = useDispatch();

  const {
    membersList,
    membersLoading,
    membersFetched,
  } = useSelector((state) => state.events);

  const [selectedRow, setSelectedRow] = useState(null);

  useEffect(() => {
    if (!eventId) return;

    dispatch(fetchEventMembers({ eventId }));

  }, [eventId]);

  console.log(membersList)

  if (membersLoading && !membersFetched) {
    return <div className="p-10 text-center">Loading attendees...</div>;
  }

  return (
    <div className="flex flex-col">

      <div className="sticky top-0 z-20 bg-[#F2F7FF] ">
        <div className="flex items-center py-[16px] px-[30px] font-bold text-lg text-[#333333]">
          <div className="flex-3">Name / Title</div>
          <div className="flex-1">Actions</div>
        </div>
      </div>

      {/* Rows */}
{membersList?.map((member, index) => {
  const fullName = `${member.firstName || ""} ${member.lastName || ""}`.trim();

  return (
    <div
      key={member.userCode || index}
      onClick={() => setSelectedRow(member.userCode)}
      className={`
        flex items-center py-[20px] px-[30px]
        cursor-pointer transition-all duration-200
        hover:bg-[#E7F0FF]
        hover:shadow-[0px_4px_4px_0px_#C7C7C740]
        ${index !== membersList.length - 1 ? "border-b border-[#D4DFF1]" : ""}
      `}
    >
      {/* LEFT SIDE */}
      <div className="flex flex-3 items-center gap-4">
        <Image
          src={member.dpURL || "/default-avatar.png"}
          alt={fullName}
          width={48}
          height={48}
          className="rounded-full min-w-[48px] h-[48px] object-cover border border-[#D4DFF1]"
        />

        <div>
          <p className="font-semibold text-[18px] text-[#333]">
            {fullName || "No Name"}
          </p>

          <p className="text-[16px] text-[#666]">
            {member.title?.map((t) => t.value).join(", ") || "No Title"}
          </p>
        </div>
      </div>

      {/* RIGHT ACTIONS */}
      <div className="flex flex-1 gap-4 text-[#666666]">
        <a
          href={`mailto:${member.email}`}
          onClick={(e) => e.stopPropagation()}
          className="w-10 h-10 bg-[#E6EBF2] rounded-full flex items-center justify-center"
        >
          <span className="oui--email"></span>
        </a>

        <a
          href={`tel:${member.phoneNumber}`}
          onClick={(e) => e.stopPropagation()}
          className="w-10 h-10 bg-[#E6EBF2] rounded-full flex items-center justify-center"
        >
          <span className="proicons--call"></span>
        </a>

        <button
          onClick={(e) => e.stopPropagation()}
          className="w-10 h-10 bg-[#E6EBF2] rounded-full flex items-center justify-center"
        >
          <FiBell size={24} />
        </button>
      </div>
    </div>
  );
})}
    </div>
  );
};

export default Attendees;
