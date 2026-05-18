import React, { useState } from 'react';
import { IoCloseOutline } from 'react-icons/io5';
import { FiChevronDown } from 'react-icons/fi';

const AddVehicleModal = ({ isOpen, onClose, onDone, memberName }) => {
  const [vehicleType, setVehicleType] = useState('');
  const [pickupNumber, setPickupNumber] = useState('');
  const [dropOffNumber, setDropOffNumber] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
      <div className="bg-white rounded-[28px] w-[500px]  p-10 shadow-xl relative animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="mb-[20px]">
          <h2 className="text-[24px] font-bold text-[#333]">Add Vehicle Details</h2>
        </div>

        <div className="space-y-6">
          {/* Vehicle Type */}
          <div>
            <label className="block text-[16px] font-bold text-[#333] mb-3">
              Select Vehicle type
            </label>
            <div className="relative">
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full h-[50px] bg-[#F5F5F5] rounded-[12px] px-5 outline-none appearance-none text-[#666] font-medium border-none"
              >
                <option value="" disabled>Select</option>
                <option value="Car">Car</option>
                <option value="Bus">Bus</option>
                <option value="SUV">SUV</option>
                <option value="Luxury Sedan">Luxury Sedan</option>
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#666]">
                <FiChevronDown size={22} />
              </div>
            </div>
          </div>

          {/* Pickup Vehicle Number */}
          <div>
            <label className="block text-[16px] font-bold text-[#333] mb-3">
              Add pickup vehicle number
            </label>
            <input
              type="text"
              placeholder="Add number"
              value={pickupNumber}
              onChange={(e) => setPickupNumber(e.target.value)}
              className="w-full h-[50px] bg-[#F5F5F5] rounded-[12px] px-5 outline-none text-[#333] font-medium placeholder:text-[#999] border-none"
            />
          </div>

          {/* Drop off Vehicle Number */}
          <div>
            <label className="block text-[16px] font-bold text-[#333] mb-3">
              Add Drop off vehicle number
            </label>
            <input
              type="text"
              placeholder="Add number"
              value={dropOffNumber}
              onChange={(e) => setDropOffNumber(e.target.value)}
              className="w-full h-[50px] bg-[#F5F5F5] rounded-[12px] px-5 outline-none text-[#333] font-medium placeholder:text-[#999] border-none"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-6 mt-12 justify-center">
          <button
            onClick={onClose}
            className="w-[120px] h-[43px] rounded-full bg-[#9E9E9E] text-white font-semibold text-[20px] hover:bg-[#8E8E8E] transition-all flex items-center justify-center"
          >
            Cancel
          </button>
          <button
            onClick={() => onDone({ vehicleType, pickupNumber, dropOffNumber })}
            className="w-[120px] h-[43px] rounded-full bg-gradient-to-r from-[#63A1F2] to-[#0151CC] text-white font-semibold text-[20px] hover:opacity-90 transition-all shadow-md flex items-center justify-center"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddVehicleModal;
