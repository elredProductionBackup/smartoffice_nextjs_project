// "use client";

// const ButtonComp = ({ title, setLogin, sendOTP, email }) => {
//   return (
//     <div
//       onClick={() => {
//         if (!email.length) return;
//         sendOTP();
//       }}
//       className={`h-15 rounded-full w-full flex items-center justify-center text-xl font-medium text-white  ${
//         email.length
//           ? "bg-[#0B57D0] cursor-pointer"
//           : "bg-[#0B57D0]/50 cursor-not-allowed"
//       }`}
//     >
//       {title}
//     </div>
//   );
// };

// export default ButtonComp;

"use client";

const ButtonComp = ({ title, email }) => {
  const isEnabled = email.length > 0;

  return (
    <button
      type="submit" // 🔑 ENTER key works automatically
      disabled={!isEnabled}
      className={`h-15 rounded-full w-full flex items-center justify-center text-xl font-medium text-white transition ${
        isEnabled
          ? "bg-[#0B57D0] cursor-pointer"
          : "bg-[#0B57D0]/50 cursor-not-allowed"
      }`}
    >
      {title}
    </button>
  );
};

export default ButtonComp;
