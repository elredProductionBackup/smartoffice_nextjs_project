const audienceMap = {
  members: "To members",
  signed: "To those who signed up",
  not_signed: "To those who not signed up",
};

const formatDate = (d) => {
  if (!d) return null;

  const date = new Date(d);

  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleDateString("en-US", { month: "short" });

  return `${weekday}, ${day} ${month}`;
};


const formatTime24 = (d) => {
  if (!d) return null;
  const date = new Date(d);
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
};


const ReadOnlyReminderRow = ({ reminder }) => {
  const hasData = Boolean(reminder);

  return (
    <div className="relative mt-[15px] border-b border-[#EAEAEA] pb-[8px]">
      <div className="w-full flex gap-[10px] items-start">
        <div className="flex-1 flex flex-col gap-[10px]">
          {/* Top Row */}
          <div className="flex gap-[5px]">
            {/* Audience */}
            <div className="flex-[2.5]">
              <div
                className="w-full h-[50px] pl-[16px] pr-[10px] bg-[#F6F6F6]
                           border-[1.4px] border-[#EAEAEA]
                           rounded-[8px] flex items-center
                           font-[600]"
              >
                <span className={`text-[#333]`}>
                  {hasData
                    ? audienceMap[reminder.audience]
                    : "Select"}
                </span>
              </div>
            </div>

            {/* Date */}
            <div className="flex-1">
              <div
                className="h-[50px] px-3 bg-[#F6F6F6] font-[600]
                           border-[1.4px] border-[#EAEAEA]
                           rounded-[8px] flex items-center"
              >
                <span className={`whitespace-nowrap text-[#333]`}>
                  {hasData ? formatDate(reminder.datetime) : "Date"}
                </span>
              </div>
            </div>

            {/* Time */}
            <div className="w-[90px]">
              <div
                className="h-[50px] px-3 bg-[#F6F6F6]
                           border-[1.4px] border-[#EAEAEA] font-[600]
                           rounded-[8px] flex items-center justify-center"
              >
                <span className={`whitespace-nowrap text-[#333]`}>
                  {hasData ? formatTime24(reminder.datetime) : "Time"}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {hasData && reminder.note ? (
            <div className="flex items-center w-full  px-[10px] gap-[10px] text-[#333333]">
                <span className="solar--chat-line-outline"></span> 
                <div
                className="w-full font-[500] line-clamp-1
                            border-bottom-[1.4px] border-[#EAEAEA]
                            rounded-[8px]"
                >{reminder.note}
                </div>
            </div>
          ):(
            <div className="flex items-center w-full  px-[10px] gap-[10px] text-[#333333]">
                <span className="solar--chat-line-outline"></span> 
                <div
                className="w-full font-[500] line-clamp-1
                            border-bottom-[1.4px] border-[#EAEAEA]
                            rounded-[8px]"
                >Note or reminder will be filled here...
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReadOnlyReminderRow