import { useDispatch, useSelector } from "react-redux";
import { closeEventFormModal } from "@/store/events/eventsUiSlice";
import { useEffect, useState } from "react";

const LocationModal = ({ form, setForm }) => {
  const dispatch = useDispatch();
  const { type } = useSelector((s) => s.eventsUi.eventFormModal);

  const [location, setLocation] = useState("");

  /* Init location */
  useEffect(() => {
    if (type !== "LOCATION") return;
    setLocation(form.location || "");
  }, [type]);

  if (type !== "LOCATION") return null;

  /* Actions */
  const handleSave = () => {
    setForm((prev) => ({
      ...prev,
      location: location.trim(),
    }));
    dispatch(closeEventFormModal());
  };

  /* UI */
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
      onClick={() => {}}
    >
      <div
        className="w-[560px] bg-white rounded-[20px] overflow-y-auto flex flex-col max-h-[85vh] px-[30px] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-[0px] pt-[30px] pb-[20px] z-[2] bg-white">
          <h2 className="text-[24px] font-[700]">Event location</h2>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col gap-[10px]">
          <div>
            <label className="font-[700] mb-[6px] block">
              Enter location or Virtual link
            </label>

            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter location or Virtual link"
              className="w-full h-[50px] px-4 bg-[#F6F6F6] border-[1.4px] border-[#EAEAEA] rounded-[8px] outline-none"
            />
          </div>

          {/* Recent locations */}
          <div className="pb-[20px]">
            <p className="text-[14px] font-[600] text-[#666] mb-[4px]">
              Recent locations
            </p>
            <p className="text-[#333] font-[500]">
              No recently used locations
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white flex justify-center gap-[60px] sticky bottom-[0px] pt-[20px] pb-[30px]">
          <button
            onClick={() => dispatch(closeEventFormModal())}
            className="w-[120px] py-[8px] rounded-[20px] bg-[#999999] text-white cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={!location.trim()}
            className={`w-[120px] py-[8px] rounded-[20px] text-white transition
              bg-[linear-gradient(95.15deg,#5597ED_3.84%,#00449C_96.38%)]
              ${
                location.trim()
                  ? "cursor-pointer"
                  : "cursor-not-allowed opacity-50"
              }`}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationModal;
