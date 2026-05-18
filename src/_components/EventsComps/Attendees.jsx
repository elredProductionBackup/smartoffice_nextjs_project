import Image from "next/image";
import { useEffect, useState } from "react";
import { FiBell } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { fetchEventMembers } from "@/store/events/eventsThunks";
import TitleTooltip from "../UI/TitleTooltip";
import PhonePopup from "../UI/PhonePopup";
import { openEventsModal } from "@/store/events/eventsUiSlice";
import { formatMember } from "@/utils/formatMember";
import { useSearchParams } from "next/navigation";
import Pagination from "../UI/Pagination";


const Attendees = ({ eventId }) => {
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;
  const membersTotal = useSelector(
    (state) => state.events.membersTotal[eventId] || 0
  );

  const {
    membersMap,
    membersLoading,
    membersFetched,
  } = useSelector((state) => state.events);

  const membersList = membersMap[eventId] || [];
  const isMembersLoading = membersLoading[eventId];
  const isMembersFetched = membersFetched[eventId];
  console.log(membersList ?? 'not here')

  // const [selectedRow, setSelectedRow] = useState(null);

  useEffect(() => {
    if (!eventId) return;

    dispatch(
      fetchEventMembers({
        eventId,
        page: currentPage,
        limit: 10,
      })
    );
  }, [eventId, currentPage]);


  function formatTitles(titles) {
    if (!titles?.length) return "";
    const vals = titles.map(t => t.value);
    if (vals.length <= 2) return vals.map(v => v[0].toUpperCase() + v.slice(1)).join(" | ");
    const firstTwo = vals.slice(0, 2).map(v => v[0].toUpperCase() + v.slice(1));
    return `${firstTwo.join(" | ")} | +${vals.length - 2}`;
  }

  if (isMembersLoading && !isMembersFetched) {
    return <div className="p-10 text-center">Loading attendees...</div>;
  }

  return (
    <div className="flex flex-col h-full">

      <div className="sticky top-0 z-20 bg-[#F2F7FF] ">
        <div className="flex items-center py-[16px] px-[30px] font-bold text-lg text-[#333333]">
          <div className="flex-3">Name / Title</div>
          <div className="flex-1">Actions</div>
        </div>
      </div>

      {!isMembersLoading && isMembersFetched && (
        !membersList || membersList.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center items-center text-center">
            <div className="h-[80px] w-[80px] rounded-full bg-[#D3E3FD] grid place-items-center mb-[30px]">
              <Image
                src={'/logo/no-member.svg'}
                alt="Fallback logo"
                width={50}
                height={50}
              />
            </div>

            <h2 className="mb-3 text-2xl font-semibold text-[#333333]">
              No attendees yet
            </h2>

            <p className="text-base font-normal text-[#666666]">
              Looks like no attendees signed up yet
            </p>
          </div>
        ) : (
          membersList.map((member, index) => {
            const fullName = `${member.firstName || ""} ${member.lastName || ""}`.trim();
            const display = formatTitles(member?.title);
            const formattedTitles =
              member?.title?.map(t => t.value[0].toUpperCase() + t.value.slice(1)) || [];

            return (
              <div
                key={member.userCode || index}
                onClick={() => {
                  const formattedMember = formatMember(member);

                  dispatch(
                    openEventsModal({
                      type: "ATTENDEE_POPUP",
                      payload: formattedMember,
                    })
                  );
                }}
                className={`
            flex items-center py-[20px] px-[30px]
            cursor-pointer transition-all duration-200
            hover:bg-[#E7F0FF]
            hover:shadow-[0px_4px_4px_0px_#C7C7C740]
            ${index !== membersList.length - 1 ? "border-b border-[#D4DFF1]" : ""}
          `}
              >
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

                    <TitleTooltip
                      display={display}
                      fullList={formattedTitles}
                    />
                  </div>
                </div>

                <div className="flex flex-1 gap-4 text-[#666666]">
                  <a
                    href={`mailto:${member.email}`}
                    onClick={(e) => e.stopPropagation()}
                    className="w-10 h-10 bg-[#E6EBF2] rounded-full flex items-center justify-center"
                  >
                    <span className="oui--email"></span>
                  </a>

                  <PhonePopup
                    phone={member.phoneNumber}
                    memberId={member.userCode}
                    openUpwards={
                      membersList.length > 3 && index > membersList.length - 3
                    }
                  />

                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="w-10 h-10 bg-[#E6EBF2] rounded-full flex items-center justify-center"
                  >
                    <FiBell size={24} />
                  </button>
                </div>
              </div>
            );
          })
        )
      )}
      <Pagination
        total={membersTotal}
        currentPage={currentPage}
        perPage={10}
      />
    </div>
  );
};

export default Attendees;
