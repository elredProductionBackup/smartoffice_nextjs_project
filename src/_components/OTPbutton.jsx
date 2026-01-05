// "use client";

// const OTPbutton = ({ title, setLogin, sendOTP, email, disabled, handleSubmit }) => {
//   return (
//     <div
//       className={`h-15 rounded-full w-full flex items-center justify-center text-xl font-medium text-white ${
//         disabled
//           ? "bg-[#0B57D0]/50 cursor-not-allowed"
//           : "bg-[#0B57D0] cursor-pointer"
//       }`}
//       onClick={handleSubmit}
//     >
//       {title}
//     </div>
//   );
// };

// export default OTPbutton;


"use client";

const OTPbutton = ({ title, disabled }) => {
  return (
    <button
      type="submit"   // 🔑 ENTER key triggers submit
      disabled={disabled}
      className={`h-14 rounded-full w-full flex items-center justify-center text-xl font-medium text-white transition ${
        disabled
          ? "bg-blue-500/50 cursor-not-allowed"
          : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
      }`}
    >
      {title}
    </button>
  );
};

export default OTPbutton;
