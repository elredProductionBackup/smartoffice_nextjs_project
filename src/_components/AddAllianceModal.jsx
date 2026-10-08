import React, { useEffect, useState } from "react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9\s-]{7,15}$/;

const AddAllianceModal = ({ isOpen, onClose, onDone, title, fields = [] }) => {
  const emptyForm = () => Object.fromEntries(fields.map((f) => [f.key, ""]));
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setForm(emptyForm());
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = () => {
    const next = {};
    fields.forEach(({ key, label, type }) => {
      const value = form[key]?.trim();
      if (!value) next[key] = `${label} is required`;
      else if (type === "email" && !EMAIL_REGEX.test(value)) next[key] = "Enter a valid email";
      else if (type === "tel" && !PHONE_REGEX.test(value)) next[key] = "Enter a valid phone number";
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleDone = () => {
    if (!validate()) return;
    const trimmed = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v.trim()])
    );
    onDone(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
      <div className="bg-white rounded-[28px] w-[500px] p-10 shadow-xl relative animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="mb-[20px]">
          <h2 className="text-[24px] font-bold text-[#333]">{title}</h2>
        </div>

        <div className="space-y-6">
          {fields.map(({ key, label, placeholder, type = "text" }) => (
            <div key={key}>
              <label className="block text-[16px] font-bold text-[#333] mb-3">
                {label}
              </label>
              <input
                type={type}
                placeholder={placeholder}
                value={form[key] ?? ""}
                onChange={(e) => handleChange(key, e.target.value)}
                className={`w-full h-[50px] bg-[#F5F5F5] rounded-[12px] px-5 outline-none text-[#333] font-medium placeholder:text-[#999] border
                  ${errors[key] ? "border-red-400" : "border-transparent"}`}
              />
              {errors[key] && (
                <p className="text-[13px] text-red-500 mt-1.5 ml-1">{errors[key]}</p>
              )}
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-6 mt-12 justify-center">
          <button
            onClick={onClose}
            className="w-[120px] h-[43px] rounded-full bg-[#9E9E9E] text-white font-semibold text-[20px] hover:bg-[#8E8E8E] transition-all flex items-center justify-center cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleDone}
            className="w-[120px] h-[43px] rounded-full bg-gradient-to-r from-[#63A1F2] to-[#0151CC] text-white font-semibold text-[20px] hover:opacity-90 transition-all shadow-md flex items-center justify-center cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddAllianceModal;
