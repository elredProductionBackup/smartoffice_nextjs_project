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
  required = false,
}) {
  return (
    <div className="flex flex-col">
      <label className="text-[16px] mb-[6px] block text-[#333333] font-[700]">
        Date & Time
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[8px]">
        <div className="flex gap-[5px] flex-1">
            <DateInput value={startDate} onChange={onStartDateChange} />
            <TimeInput value={startTime} onChange={onStartTimeChange} />
        </div>

        <span className="text-[15px] font-[500] self-center sm:self-auto">to</span>

        <div className="flex gap-[5px] flex-1">
            <DateInput value={endDate} onChange={onEndDateChange} right={true}/>
            <TimeInput value={endTime} onChange={onEndTimeChange} />
        </div>
      </div>

      {error && <p className="relative -bottom-[5px] text-[12px] text-red-500">{error}</p>}

      <div className="flex items-center gap-[6px] pl-[10px] text-[14px] text-[#666666] font-[600] mt-[10px]">
        <span className="bi--globe"></span> Time zone – <span className="font-[700]">GMT+05:30 (Calcutta)</span>
      </div>
    </div>
  );
}
