// import Image from "next/image";

// const baseFieldClass =
//   "w-full bg-[#F6F6F6] border-[1.4px] border-[#EAEAEA] rounded-lg outline-none h-[50px]";

// export function EventsInput({
//   label,
//   icon,
//   error,
//   svg,
//   ...props
// }) {
//   return (
//     <div className="relative w-full">
//       {label && (
//         <label className="text-[16px] mb-[6px] block text-[#333333] font-[700]">
//           {label}
//         </label>
//       )}

//       <div className="relative  flex items-center">
//         {icon && (
//           <div className="absolute left-[20px] text-[#999999]  flex items-center">
//             {icon}
//           </div>
//         )}
//         { svg && (
//           <Image src={svg} alt="Icon" width={24} height={24} className="absolute left-[20px] text-[#999999] flex items-center"/>
//         )
//         }

//         <input
//           {...props}
//           className={`${baseFieldClass} ${
//             icon || svg ? "pl-[50px]" : "px-4"
//           } ${error ? "border-red-500" : ""}`}
//         />
//       </div>

//       {error && (
//         <p className="absolute -bottom-[22px] text-[12px] text-red-500">
//           {error}
//         </p>
//       )}
//     </div>
//   );
// }


import Image from "next/image";

const baseFieldClass =
  "w-full bg-[#F6F6F6] border-[1.4px] border-[#EAEAEA] rounded-lg outline-none min-h-[50px]";

export function EventsInput({
  label,
  icon,
  error,
  svg,
  isTravelField = false,
  travelData,
  ...props
}) {
  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const Row = ({ title, value }) => (
    <div className="flex justify-between text-[14px] font-[600]">
      <span className="text-[#666666]">{title}</span>
      {value && value !== "-" ? (
        <span className="text-[#333333] font-[600] truncate max-w-[60%] text-right">
          {value}
        </span>
      ) : (
        <span className="text-[#333333]">-</span>
      )}
    </div>
  );

  return (
    <div className="relative w-full">
      {label && (
        <label className="text-[16px] mb-[6px] block text-[#333] font-[700]">
          {label}
        </label>
      )}

      <div className={`relative flex ${isTravelField?'items-start': 'items-center'}`}>
        {icon && (
          <div className="absolute left-[20px] text-[#999999]  flex items-center">
            {icon}
          </div>
        )}
        {svg && (
          <Image
            src={svg}
            alt="Icon"
            width={24}
            height={24}
            className="absolute left-[20px] top-[15px]"
          />
        )}
        {/* {console.log(travelData?.reminders[0].date)} */}
        {isTravelField ? (
          <div
            onClick={props.onClick}
            className={`${baseFieldClass} ${
              svg ? "pl-[50px]" : "px-4"
            } pt-[17px] py-3 pr-4 cursor-pointer ${error ? "border-red-500" : ""}`}
          >
            <div className="flex flex-col gap-[13px]">
              <Row title="Venue link" value={travelData?.venueLink} />
              <Row title="Hotel link" value={travelData?.hotelLink} />
              <Row title="Deadlines" value={formatDate(travelData?.deadline)} />
              <Row title="Reminder" value={travelData?.reminders ? formatDate(travelData?.reminders[0]?.date):""} />
            </div>
          </div>
        ) : (
          <input
            {...props}
            className={`${baseFieldClass} ${
              icon || svg ? "pl-[50px]" : "px-4"
            } ${error ? "border-red-500" : ""}`}
          />
        )}
      </div>

      {error && (
        <p className="absolute -bottom-[22px] text-[12px] text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}