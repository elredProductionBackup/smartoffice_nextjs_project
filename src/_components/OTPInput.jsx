// "use client";
// import { sendOtp } from "@/services/auth.service";
// import { useEffect, useRef, useState } from "react";

// export default function OtpInput({
//   length,
//   onComplete,
//   otp,
//   setOtp,
//   error,
//   setError,
//   data
// }) {
//   const inputRefs = useRef([]);
//   const [timeLeft, setTimeLeft] = useState(30);

//   // Timer
//   useEffect(() => {
//     if (timeLeft === 0) return;
//     const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
//     return () => clearInterval(interval);
//   }, [timeLeft]);

//   const handleChange = (value, index) => {
//     if (!/^[0-9]?$/.test(value)) return;

//     const newOtp = [...otp];
//     newOtp[index] = value;
//     setOtp(newOtp);

//     if (value && index < length - 1) {
//       inputRefs.current[index + 1]?.focus();
//     }

//     if (newOtp.every((v) => v !== "")) {
//       onComplete?.(newOtp.join(""));
//     }
//   };

//   const handlePaste = (e) => {
//     e.preventDefault();

//     const pastedData = e.clipboardData
//       .getData("text")
//       .replace(/\D/g, "") // digits only
//       .slice(0, length);

//     if (!pastedData) return;

//     const newOtp = Array(length).fill("");

//     pastedData.split("").forEach((char, index) => {
//       newOtp[index] = char;
//     });

//     setOtp(newOtp);
//     setError(false);

//     // Focus next empty or last
//     const nextIndex = Math.min(pastedData.length, length - 1);
//     inputRefs.current[nextIndex]?.focus();

//     if (pastedData.length === length) {
//       onComplete?.(pastedData);
//     }
//   };

//   const handleKeyDown = (e, index) => {
//     if (e.key === "Backspace" && !otp[index] && index > 0) {
//       inputRefs.current[index - 1]?.focus();
//     }
//   };

//   const sendOTP = async () => {
  
//     try {
//       // showLoader()
//       const res = await sendOtp(data);
//       console.log(res,'response')
//       // if (res?.data?.success) {
//       //   // console.log(res)
//       //   // setLogin(false);
//       //   // hideLoader()
//       // }
//       // localStorage.setItem("userEmail", res?.data?.result?.[0]?.email);
//     } catch (error) {
//       // setInvalidEmail(true)
//       console.log(error)
//       // hideLoader();
//     }
//   };


//   return (
//     <div className="w-full flex flex-col gap-4 mb-10">
//       <label className="text-[#333] text-lg">Enter OTP</label>

//       <div className="w-full flex justify-between">
//         {Array.from({ length }).map((_, index) => (
//           <input
//             key={index}
//             ref={(el) => (inputRefs.current[index] = el)}
//             maxLength={1}
//             value={otp[index] || ""}
//             onFocus={() => setError(false)}
//             onPaste={handlePaste}
//             onChange={(e) => handleChange(e.target.value, index)}
//             onKeyDown={(e) => handleKeyDown(e, index)}
//             className={`w-14 h-14 rounded-lg border bg-[#F7FAFC]
//               text-center text-xl outline-none transition
//               ${
//                 error
//                   ? "border-red-500 focus:outline-red-500"
//                   : "border-[#CBD5E0] focus:outline-blue-500"
//               }`}
//           />
//         ))}
//       </div>

//       <div className="flex items-center justify-between">
//         <div className="min-h-[20px]">
//           {error && (
//             <p className="text-xs text-[#F12632]">Invalid OTP entered</p>
//           )}
//         </div>

//         <div className="text-sm text-[#333] text-right">
//           {timeLeft === 0
//             ? <p onClick={sendOTP} className="cursor-pointer">Resend OTP</p>
//             : `Time Remaining: 00:${timeLeft
//                 .toString()
//                 .padStart(2, "0")}`}
//         </div>
//       </div>
//     </div>
//   );
// }

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

  // ⏱️ Countdown timer
  useEffect(() => {
    if (timeLeft === 0) return;

    const interval = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  // 🔢 Handle digit change
  const handleChange = (value, index) => {
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

  // 📋 Handle paste (full OTP)
  const handlePaste = (e) => {
    e.preventDefault();

    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);

    if (!pastedData) return;

    const newOtp = Array(length).fill("");
    pastedData.split("").forEach((char, index) => {
      newOtp[index] = char;
    });

    setOtp(newOtp);
    setError(false);

    const nextIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[nextIndex]?.focus();

    if (pastedData.length === length) {
      onComplete?.(pastedData);
    }
  };

  // ⌫ Backspace navigation
  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // 🔁 Resend OTP (RESTART TIMER)
  const resendOtp = async () => {
    if (timeLeft > 0) return;

    try {
      const res = await sendOtp(data);

      if (res?.data?.success) {
        setTimeLeft(30); // ✅ restart timer
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
      <div className="w-full flex justify-between">
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            maxLength={1}
            value={otp[index] || ""}
            onFocus={() => setError(false)}
            onPaste={handlePaste}
            onChange={(e) => handleChange(e.target.value, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`w-14 h-14 rounded-lg border bg-[#F7FAFC]
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
            <span
              onClick={resendOtp}
              className="cursor-pointer text-[#F12632] font-medium"
            >
              Resend OTP
            </span>
          ) : (
            `Time Remaining: 00:${timeLeft.toString().padStart(2, "0")}`
          )}
        </div>
      </div>
    </div>
  );
}
