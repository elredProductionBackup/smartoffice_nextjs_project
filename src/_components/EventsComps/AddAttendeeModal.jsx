"use client";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

const EMPTY = { name: "", company: "", designation: "", whatsapp: "", email: "" };

const digits = (s) => s.replace(/\D/g, "");
const isValidEmail = (s) => !s || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
const isValidPhone = (s) =>
  !s || (/^[+\d\s\-().]+$/.test(s) && digits(s).length >= 10 && digits(s).length <= 15);

// Trim and collapse inner whitespace on every field
const clean = (values) =>
  Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.trim().replace(/\s+/g, " ")]));

const validate = (v) => {
  const errors = {};
  if (!v.name) errors.name = "Enter the attendee's name.";
  if (!isValidPhone(v.whatsapp)) errors.whatsapp = "Enter the full number with country code, like +91 98765 43210.";
  if (!isValidEmail(v.email)) errors.email = "Enter an email like name@company.com.";
  return errors;
};

const Field = ({ id, label, required, optional, error, inputRef, ...inputProps }) => (
  <div>
    <label htmlFor={id} className="mb-1.5 flex items-baseline gap-2 text-[13.5px] font-bold text-[#475569]">
      <span>
        {label}
        {required && <span className="ml-0.5 text-[#DC2626]">*</span>}
      </span>
      {optional && <span className="text-[12.5px] font-semibold text-[#94A3B8]">Optional</span>}
    </label>
    <input
      id={id}
      ref={inputRef}
      autoComplete="off"
      aria-invalid={!!error}
      className={`w-full rounded-xl border bg-white px-3 py-2.5 text-[15px] text-[#1E293B] outline-none placeholder:text-[#94A3B8] ${
        error ? "border-[#DC2626]" : "border-[#E2E8F0] focus:border-[#0B57D0]"
      }`}
      {...inputProps}
    />
    {error && <p className="mt-[5px] text-[13px] font-bold text-[#DC2626]">{error}</p>}
  </div>
);

// onSubmit(values) may return a promise; reject it to keep the modal open. A rejection with
// `field` shows its message under that input, otherwise in the footer. A resolved string
// replaces the default "Added …" line after "Save and add another".
// Passing initialValues switches the modal to editing an existing attendee.
const AddAttendeeModal = ({ onClose, onSubmit, initialValues }) => {
  const isEdit = !!initialValues;
  const [values, setValues] = useState(() => ({ ...EMPTY, ...initialValues }));
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const refs = { name: useRef(null), whatsapp: useRef(null), email: useRef(null) };

  useEffect(() => {
    refs.name.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setMessage("");
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const addAnother = e.nativeEvent.submitter?.dataset.more === "true";
    const data = clean(values);
    const found = validate(data);
    setErrors(found);

    const firstBad = ["name", "whatsapp", "email"].find((k) => found[k]);
    if (firstBad) return refs[firstBad].current?.focus();

    setSubmitting(true);
    setFormError("");
    try {
      const note = await onSubmit?.(data, { addAnother });
      if (addAnother) {
        setValues(EMPTY);
        setMessage(typeof note === "string" ? note : `Added ${data.name}`);
        refs.name.current?.focus();
      } else {
        onClose();
      }
    } catch (err) {
      console.error("Add attendee error:", err);
      if (err?.field && refs[err.field]) {
        setErrors({ [err.field]: err.message });
        refs[err.field].current?.focus();
      } else if (err?.message && err.message !== "Duplicate attendee") {
        setFormError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] grid place-items-center bg-[rgba(20,30,55,0.35)] p-5"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-attendee-title"
        className="flex max-h-full w-full max-w-[560px] flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_20px_50px_rgba(30,50,90,0.12)]"
      >
        <div className="flex items-center justify-between gap-3 px-6 pt-[22px] pb-1.5">
          <h3 id="add-attendee-title" className="text-[22px] font-semibold text-[#1E293B]">
            {isEdit ? "Edit attendee" : "Add attendee"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid place-items-center rounded-lg p-1.5 text-[#1E293B] hover:bg-[#F1F5F9] cursor-pointer"
          >
            <X size={22} strokeWidth={1.8} />
          </button>
        </div>

        <form noValidate onSubmit={handleSubmit} className="contents">
          <div className="flex-1 overflow-auto px-6 pt-3 pb-1.5">
            <div className="mb-3.5">
              <Field
                id="attendee-name"
                name="name"
                label="Name"
                required
                placeholder="e.g. Aarav Mehta"
                value={values.name}
                onChange={handleChange}
                error={errors.name}
                inputRef={refs.name}
              />
            </div>
            <div className="mb-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field
                id="attendee-company"
                name="company"
                label="Company name"
                placeholder="e.g. Mehta Textiles"
                value={values.company}
                onChange={handleChange}
              />
              <Field
                id="attendee-designation"
                name="designation"
                label="Designation"
                optional
                placeholder="e.g. Managing Director"
                value={values.designation}
                onChange={handleChange}
              />
            </div>
            <div className="mb-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field
                id="attendee-whatsapp"
                name="whatsapp"
                label="WhatsApp number"
                inputMode="tel"
                placeholder="+91 98765 43210"
                value={values.whatsapp}
                onChange={handleChange}
                error={errors.whatsapp}
                inputRef={refs.whatsapp}
              />
              <Field
                id="attendee-email"
                name="email"
                label="Email"
                type="email"
                inputMode="email"
                placeholder="name@company.com"
                value={values.email}
                onChange={handleChange}
                error={errors.email}
                inputRef={refs.email}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 border-t border-[#E2E8F0] px-6 pt-3.5 pb-5">
            <button
              type="button"
              onClick={onClose}
              className="-ml-3 rounded-full px-3 py-1.5 font-bold text-[#475569] hover:bg-[#F1F5F9] hover:text-[#1E293B] cursor-pointer"
            >
              Cancel
            </button>
            <span className={`mr-auto min-w-0 text-sm font-bold ${formError ? "text-[#DC2626]" : "text-[#137A45]"}`}>
              {formError || message}
            </span>
            {!isEdit && (
              <button
                type="submit"
                data-more="true"
                disabled={submitting}
                className="inline-flex items-center gap-[7px] whitespace-nowrap h-9 rounded-full border border-[#0B57D0] bg-white px-4 text-[14px] font-bold text-[#0B57D0] transition hover:bg-[#D3E3FD]/50 disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer"
              >
                Save and add another
              </button>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-[7px] whitespace-nowrap h-9 rounded-full bg-[#1D72E8] px-4 text-[14px] font-bold text-white transition hover:bg-[#0B57D0] disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer"
            >
              {isEdit ? "Save changes" : "Add attendee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAttendeeModal;
