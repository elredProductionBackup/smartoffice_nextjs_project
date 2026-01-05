// "use client";
// import logo from "@/assets/logo/logo.svg";
// import Image from "next/image";
// import { useSearchParams } from "next/navigation";
// import LoginComponent from "@/_components/LoginComponent";
// import OTPComponent from "@/_components/OTPComponent";
// import { useState } from "react";
// import { sendOtp } from "@/services/auth.service";
// import { isValidEmail } from "@/utils/isValidEmail";
// import useGlobalLoader from "@/store/useGlobalLoader";
// import GuestRoute from "@/_components/GuestRoute";

// const Login = () => {
//   const params = useSearchParams();
//   const code = params.get("networkClusterCode");
//   const { showLoader, hideLoader } = useGlobalLoader.getState();

//   const [login, setLogin] = useState(true);
//   const [invalidEmail, setInvalidEmail] = useState(false);
//   const [emailData, setEmailData] = useState({
//     email: "",
//     networkClusterCode: code,
//     hashId: "elRed",
//   });

//   const sendOTP = async () => {
//     if (!isValidEmail(emailData.email)) {
//       setInvalidEmail(true);
//       return;
//     }

//     try {
//       showLoader();
//       const res = await sendOtp(emailData);
//       if (res?.data?.success) {
//         setLogin(false);
//         localStorage.setItem("userEmail", res?.data?.result?.[0]?.email);
//         hideLoader();
//       } else if (res?.status == 500) {
//         setInvalidEmail(true);
//       }

//       hideLoader();
//     } catch (error) {
//       setInvalidEmail(true);
//       hideLoader();
//       console.log(error, "error");
//     }
//   };


//   return (
//     <GuestRoute>
//       <div className="h-screen flex items-center justify-center">
//         <div className="w-full sm:max-w-lg mx-5 flex flex-col items-center">
//           <Image src={logo} alt="smart-office" className="mb-15" />
//           {login ? (
//             <LoginComponent
//               setLogin={setLogin}
//               email={emailData?.email}
//               setEmail={setEmailData}
//               sendOTP={sendOTP}
//               invalidEmail={invalidEmail}
//               setInvalidEmail={setInvalidEmail}
//             />
//           ) : (
//             <OTPComponent
//               email={emailData?.email}
//               networkClusterCode={emailData?.networkClusterCode}
//               data={emailData}
//             />
//           )}
//         </div>
//       </div>
//     </GuestRoute>
//   );
// };

// export default Login;

import { Suspense } from "react";
import Login from "./Login";

console.log('login')
export default function Page() {
  return (
    <Suspense fallback={null}>
      <Login />
    </Suspense>
  );
}
