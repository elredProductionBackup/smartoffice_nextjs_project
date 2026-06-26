import React from "react";
import { HiOutlinePencil, HiOutlineXCircle, HiOutlineCheckCircle } from "react-icons/hi2";

const EventsMenu = ({ onEdit, onCancel, onComplete, isPast }) => {
  const itemStyle = {
    fontFamily: "'Nunito Sans', sans-serif",
    fontWeight: 500,
    fontSize: "18px",
    lineHeight: "136%",
    letterSpacing: "0%",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    cursor: "pointer",
    padding: "8px 4px",
    borderRadius: "8px",
    transition: "background-color 0.2s",
  };

  return (
    <div
      className="absolute right-0 mt-2 bg-white flex flex-col animate-in fade-in zoom-in duration-200 z-[100] w-[220px] h-[183px] rounded-[20px] p-5 gap-2.5"
      style={{
        boxShadow: "0px 4px 4px 0px #99999940",
      }}
    >
      <div
        style={itemStyle}
        className="hover:bg-gray-50"
        onClick={onEdit}
      >
        <HiOutlinePencil className="text-2xl text-[#333]" />
        <span>Edit event</span>
      </div>
      
      <div
        style={itemStyle}
        className="hover:bg-gray-50"
        onClick={onCancel}
      >
        <HiOutlineXCircle className="text-2xl text-[#333]" />
        <span>Cancel event</span>
      </div>

      <div
        style={itemStyle}
        className="hover:bg-gray-50"
        onClick={onComplete}
      >
        <HiOutlineCheckCircle className="text-2xl text-[#333]" />
        <span>Complete event</span>
      </div>
    </div>
  );
};

export default EventsMenu;
