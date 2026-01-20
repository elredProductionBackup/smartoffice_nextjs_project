import { DateInput } from "./DateInput";
import { TimeInput } from "./TimeInput";

export default function DateTimeRangePicker({
  startDate,
  endDate,
  startTime,
  endTime,
  onStartDateChange,
  onEndDateChange,
  onStartTimeChange,
  onEndTimeChange,
  error,
}) {
  return (
    <div className="flex flex-col">
      <label className="text-[16px] mb-[6px] block text-[#333333] font-[700]">Date & Time</label>

      <div className="flex items-center justify-between gap-[8px]">
        <div className="flex gap-[5px] flex-1">
            <DateInput value={startDate} onChange={onStartDateChange} />
            <TimeInput value={startTime} onChange={onStartTimeChange} />
        </div>

        <span className="text-[15px] font-[500]">to</span>

        <div className="flex gap-[5px] flex-1">
            <DateInput value={endDate} onChange={onEndDateChange} />
            <TimeInput value={endTime} onChange={onEndTimeChange} />
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex items-center gap-[6px] pl-[10px] text-[14px] text-[#666666] font-[600] mt-[10px]">
        <span className="bi--globe"></span> Time zone – <span className="font-[700]">GMT+05:30 (Calcutta)</span>
      </div>
    </div>
  );
}
