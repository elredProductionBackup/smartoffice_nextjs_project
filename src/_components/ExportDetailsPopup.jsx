import { useState } from "react";

const ExportDetailsPopup = ({ onClose }) => {
  const [fields, setFields] = useState({
    phone: true,
    email: true,
    location: true,
    modeOfTravel: true,
    etdEta: false,
    spouseName: true,
    pickup: true,
    documentsUploaded: true,
    flightDetails: true,
    carDetails: false,
    hotelDetails: true,
  });

  const toggleField = (key) => {
    setFields((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderRow = (label, key) => {
    const value = fields[key];
    return (
      <div className="flex items-center justify-between py-[6px]" key={key}>
        <span className="text-[20px] font-bold text-[#333333] uppercase">
          {label}
        </span>
        <button
          type="button"
          onClick={() => toggleField(key)}
          className="flex items-center justify-between w-[95px] gap-2"
        >
          <span
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              value ? "bg-[#0f52ba]" : "bg-[#E0E0E0]"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                value ? "translate-x-4" : "translate-x-1"
              }`}
            />
          </span>
          <span className="text-[18px]  font-semibold text-[#666666]">
            {value ? "Show" : "Hide"}
          </span>
        </button>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-60 bg-black/40 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white w-[480px] h-[846px] max-h-[90vh] rounded-[20px] p-[40px] flex flex-col gap-[16px] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <div className="flex items-center justify-between mb-[8px]">
          <h2 className="text-[24px] text-center font-bold text-[#333333]">
            Do you want to hide few fields for export?
          </h2>
        </div>

        {/* Toggles list */}
        <div className="flex flex-col gap-[4px] mt-[8px]">
          {renderRow("Phone", "phone")}
          {renderRow("Email", "email")}
          {renderRow("Location", "location")}
          {renderRow("Mode of travel", "modeOfTravel")}
          {renderRow("ETD & ETA", "etdEta")}
          {renderRow("Spouse name", "spouseName")}
          {renderRow("Pickup", "pickup")}
          {renderRow("Documents uploaded", "documentsUploaded")}
          {renderRow("Flight details", "flightDetails")}
          {renderRow("Car details", "carDetails")}
          {renderRow("Hotel details", "hotelDetails")}
        </div>

        {/* Helper text */}
        <div className="mt-auto pt-[16px] text-center font-medium text-[15px] text-[#666666]">
          Fields you hide will not be visible in exported document
        </div>

        {/* Footer buttons */}
        <div className="mt-[12px] flex items-center justify-between gap-[12px]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-[43px] w-[130px] rounded-full bg-[#999999] text-white text-[20px] font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            className="flex-1 h-[43px] w-[130px] rounded-full text-white text-[20px] font-semibold cursor-pointer"
            style={{
              backgroundImage: "linear-gradient(90deg, #5597ED 0%, #00449C 100%)",
            }}
          >
            Export
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportDetailsPopup;

