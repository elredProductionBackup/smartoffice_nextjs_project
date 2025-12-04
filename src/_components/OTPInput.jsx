"use client";
import { useEffect, useRef, useState } from "react";

export default function OtpInput({ length = 6, onComplete }) {
  const [otp, setOtp] = useState(Array(length).fill(""));
  const inputRefs = useRef([]);
  const [timeLeft, setTimeLeft] = useState(30);

  // Timer
  useEffect(() => {
    if (timeLeft === 0) return;
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const handleChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return; // allow only digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input
    if (value && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }

    // When all digits entered
    if (newOtp.every((v) => v !== "")) {
      onComplete?.(newOtp.join(""));
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-evenly gap-4 mb-10">
      <div className="w-full">
        <label className="text-[#333] text-lg text-left block">
          Enter OTP
        </label>
      </div>
      <div className="w-full flex justify-between">
        {otp.map((value, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            maxLength={1}
            value={value}
            onChange={(e) => handleChange(e.target.value, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className="w-14 h-14 rounded-lg border border-[#CBD5E0] bg-[#F7FAFC]
                 text-center text-xl focus:outline-blue-500"
          />
        ))}
      </div>

      <div className="w-full">
        <p className="text-sm text-[#333] text-right">
          Time Remaining: {`00:${timeLeft.toString().padStart(2, "0")}`}
        </p>
      </div>
    </div>
  );
}
