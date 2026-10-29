"use client";
import { sendOtp } from "@/services/auth.service";
import { useEffect, useRef, useState } from "react";

export default function OtpInput({
  length = 6,
  onComplete,
  otp,
  setOtp,
  error,
  setError,
  data,
}) {
  const inputRefs = useRef([]);
  const [timeLeft, setTimeLeft] = useState(30);

  // Countdown timer
  useEffect(() => {
    if (timeLeft === 0) return;

    const interval = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  // Fill boxes from a multi-digit string (paste or the phone's SMS code autofill)
  const fillFrom = (digits, startIndex = 0) => {
    const newOtp = startIndex === 0 ? Array(length).fill("") : [...otp];
    digits
      .slice(0, length - startIndex)
      .split("")
      .forEach((char, i) => {
        newOtp[startIndex + i] = char;
      });

    setOtp(newOtp);
    setError(false);

    const filled = startIndex + Math.min(digits.length, length - startIndex);
    inputRefs.current[Math.min(filled, length - 1)]?.focus();

    if (newOtp.every((v) => v !== "")) {
      onComplete?.(newOtp.join(""));
    }
  };

  // Handle digit change
  const handleChange = (value, index) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length > 1) {
      // iOS / Android one-time-code autofill puts the whole code in one box
      fillFrom(digits, digits.length >= length ? 0 : index);
      return;
    }
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((v) => v !== "")) {
      onComplete?.(newOtp.join(""));
    }
  };

  // Handle paste (full OTP)
  const handlePaste = (e) => {
    e.preventDefault();

    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);

    if (!pastedData) return;

    fillFrom(pastedData, 0);
  };

  // Backspace navigation
  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Resend OTP (restarts the timer)
  const resendOtp = async () => {
    if (timeLeft > 0) return;

    try {
      const res = await sendOtp(data);

      if (res?.data?.success) {
        setTimeLeft(30); // restart timer
        setOtp(Array(length).fill("")); // clear OTP
        setError(false); // clear error
        inputRefs.current[0]?.focus(); // focus first input
      }
    } catch (err) {
      console.error("Resend OTP failed:", err);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <label className="text-[#333] text-lg">Enter OTP</label>

      {/* OTP INPUTS */}
      <div className="w-full flex justify-between gap-2">
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            type="tel"
            inputMode="numeric"
            ref={(el) => (inputRefs.current[index] = el)}
            autoComplete={index === 0 ? "one-time-code" : "off"}
            aria-label={`OTP digit ${index + 1}`}
            value={otp[index] || ""}
            onFocus={() => setError(false)}
            onPaste={handlePaste}
            onChange={(e) => handleChange(e.target.value, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`w-11 h-12 sm:w-14 sm:h-14 rounded-lg border bg-[#F7FAFC]
              text-center text-xl outline-none transition
              ${
                error
                  ? "border-red-500 focus:outline-red-500"
                  : "border-[#CBD5E0] focus:outline-blue-500"
              }`}
          />
        ))}
      </div>

      {/* ERROR + TIMER / RESEND */}
      <div className="flex items-center justify-between">
        <div className="min-h-[18px]">
          {error && (
            <p className="text-xs text-[#F12632]">
              Invalid OTP entered
            </p>
          )}
        </div>

        <div className="text-sm text-[#333] font-[500] text-right">
          {timeLeft === 0 ? (
            <button
              type="button"
              onClick={resendOtp}
              className="cursor-pointer text-[#F12632] font-medium"
            >
              Resend OTP
            </button>
          ) : (
            `Time Remaining: 00:${timeLeft.toString().padStart(2, "0")}`
          )}
        </div>
      </div>
    </div>
  );
}
