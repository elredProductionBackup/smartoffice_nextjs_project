"use client";

import logo from "@/assets/logo/logo.svg";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import LoginComponent from "@/_components/LoginComponent";
import OTPComponent from "@/_components/OTPComponent";
import { useState } from "react";
import { sendOtp } from "@/services/auth.service";
import { isValidEmail } from "@/utils/isValidEmail";
import useGlobalLoader from "@/store/useGlobalLoader";
import GuestRoute from "@/_components/GuestRoute";

const Login = () => {
  const params = useSearchParams();
  const code = params.get("networkClusterCode");

  const { showLoader, hideLoader } = useGlobalLoader.getState();

  const [login, setLogin] = useState(true);
  const [invalidEmail, setInvalidEmail] = useState(false);
  const [emailData, setEmailData] = useState({
    email: "",
    networkClusterCode: code,
    hashId: "elRed",
  });

  const sendOTP = async () => {
    if (!isValidEmail(emailData.email)) {
      setInvalidEmail(true);
      return;
    }

    try {
      showLoader();
      const res = await sendOtp(emailData);
      if (res?.data?.success) {
        setLogin(false);
        localStorage.setItem(
          "userEmail",
          res?.data?.result?.[0]?.email
        );
      } else if (res?.status === 500) {
        setInvalidEmail(true);
      }
    } catch (error) {
      setInvalidEmail(true);
      console.log(error);
    } finally {
      hideLoader();
    }
  };

  return (
    <GuestRoute>
      <div className="h-screen flex items-center justify-center">
        <div className="w-full sm:max-w-lg mx-5 flex flex-col items-center">
          <Image src={'/logo/smart-networks.svg'} alt="smart-office" className="mb-15" width={239} height={62}/>

          {login ? (
            <LoginComponent
              setLogin={setLogin}
              email={emailData.email}
              setEmail={setEmailData}
              sendOTP={sendOTP}
              invalidEmail={invalidEmail}
              setInvalidEmail={setInvalidEmail}
            />
          ) : (
            <OTPComponent
              email={emailData.email}
              networkClusterCode={emailData.networkClusterCode}
              data={emailData}
            />
          )}
        </div>
      </div>
    </GuestRoute>
  );
};

export default Login;
