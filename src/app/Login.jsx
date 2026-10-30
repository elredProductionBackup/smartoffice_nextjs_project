"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import LoginComponent from "@/_components/LoginComponent";
import OTPComponent from "@/_components/OTPComponent";
import { useEffect, useState } from "react";
import { sendOtp } from "@/services/auth.service";
import { isValidEmail } from "@/utils/isValidEmail";
import useGlobalLoader from "@/store/useGlobalLoader";
import GuestRoute from "@/_components/GuestRoute";
import RoleSelection from "@/_components/RoleSelection";
import { CLUSTER_PARAM, getStoredClusterCode } from "@/utils/shareLink";

const Login = () => {
  const params = useSearchParams();
  // Shared / invite links carry the cluster code; fall back to the last one used on this device
  const code = params.get(CLUSTER_PARAM) || getStoredClusterCode() || null;

  const { showLoader, hideLoader } = useGlobalLoader.getState();

  const [login, setLogin] = useState(true);
  const [showRoles, setShowRoles] = useState(false);
  const [invalidEmail, setInvalidEmail] = useState(false);
  const [emailData, setEmailData] = useState({
    email: "",
    networkClusterCode: code,
    hashId: "elRed",
  });

  // OTP verified but no role picked yet (e.g. page refreshed on the role screen)
  useEffect(() => {
    if (localStorage.getItem("token") && !localStorage.getItem("selectedRole")) {
      setShowRoles(true);
    }
  }, []);

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
      } else {
        // 500 / unknown email / any other failure: show the inline error instead of doing nothing
        setInvalidEmail(true);
      }
    } catch (error) {
      setInvalidEmail(true);
      console.error(error);
    } finally {
      hideLoader();
    }
  };

  if (showRoles) {
    return <RoleSelection />;
  }

  return (
    <GuestRoute>
      <div className="min-h-dvh flex items-center justify-center py-10">
        <div className="w-full sm:max-w-lg mx-5 flex flex-col items-center">
          <Image
            src="/logo/smart-networks.svg"
            alt="Smart Networks"
            className="mb-10 sm:mb-15 w-[190px] sm:w-[239px] h-auto"
            width={239}
            height={62}
            priority
          />

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
              onVerified={() => setShowRoles(true)}
            />
          )}
        </div>
      </div>
    </GuestRoute>
  );
};

export default Login;
