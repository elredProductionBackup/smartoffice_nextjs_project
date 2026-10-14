import React, { useEffect, useState } from "react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9]{7,15}$/; // checked after spaces/dashes are stripped

// Strips spaces and dashes so "+91 99999-99999" is sent as "+919999999999"
const normalizePhone = (value) => value.replace(/[\s-]/g, "");

// Field options: required (default true), minLength, maxLength
const AddAllianceModal = ({ isOpen, onClose, onDone, title, fields = [] }) => {
  const emptyForm = () => Object.fromEntries(fields.map((f) => [f.key, ""]));
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setForm(emptyForm());
      setErrors({});
      setSaving(false);
      setSubmitError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
    setSubmitError("");
  };

  const validate = () => {
    const next = {};
    fields.forEach(({ key, label, type, required = true, minLength, maxLength }) => {
      const value = form[key]?.trim();
      if (!value) {
        if (required) next[key] = `${label} is required`;
      } else if (minLength && value.length < minLength) {
        next[key] = `${label} must be at least ${minLength} characters`;
      } else if (maxLength && value.length > maxLength) {
        next[key] = `${label} must be at most ${maxLength} characters`;
      } else if (type === "email" && !EMAIL_REGEX.test(value)) {
        next[key] = "Enter a valid email";
      } else if (type === "tel" && !PHONE_REGEX.test(normalizePhone(value))) {
        next[key] = "Enter a valid phone number (7–15 digits)";
      }
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // onDone may return a promise; the popup stays open (with the error) if it rejects
  const handleDone = async () => {
    if (saving || !validate()) return;

    const values = Object.fromEntries(
      fields.map(({ key, type }) => {
        const value = form[key]?.trim() ?? "";
        if (type === "tel") return [key, normalizePhone(value)];
        if (type === "email") return [key, value.toLowerCase()];
        return [key, value];
      })
    );

    setSaving(true);
    setSubmitError("");
    try {
      await onDone(values);
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Something went wrong. Please try again.";
      // Duplicate name goes under the name field, anything else under the form
      if (/already exists/i.test(message) && fields.some((f) => f.key === "name")) {
        setErrors((prev) => ({ ...prev, name: message }));
      } else {
        setSubmitError(message);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
      <div className="bg-white rounded-[28px] w-[500px] p-10 shadow-xl relative animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="mb-[20px]">
          <h2 className="text-[24px] font-bold text-[#333]">{title}</h2>
        </div>

        <div className="space-y-6">
          {fields.map(({ key, label, placeholder, type = "text", required = true, maxLength }) => (
            <div key={key}>
              <label className="block text-[16px] font-bold text-[#333] mb-3">
                {label}
                {required && <span className="ml-0.5 text-red-500">*</span>}
              </label>
              <input
                type={type}
                placeholder={placeholder}
                maxLength={maxLength}
                disabled={saving}
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

        {submitError && (
          <p className="mt-6 text-center text-[14px] text-red-500">{submitError}</p>
        )}

        {/* Buttons */}
        <div className={`flex gap-6 justify-center ${submitError ? "mt-6" : "mt-12"}`}>
          <button
            onClick={onClose}
            disabled={saving}
            className="w-[120px] h-[43px] rounded-full bg-[#9E9E9E] text-white font-semibold text-[20px] hover:bg-[#8E8E8E] transition-all flex items-center justify-center cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleDone}
            disabled={saving}
            className="w-[120px] h-[43px] rounded-full bg-gradient-to-r from-[#63A1F2] to-[#0151CC] text-white font-semibold text-[20px] hover:opacity-90 transition-all shadow-md flex items-center justify-center cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Done"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddAllianceModal;
