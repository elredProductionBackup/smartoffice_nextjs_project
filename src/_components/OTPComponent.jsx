"use client";
import Heading from "./Heading";
import Description from "./Description";
import { CONSTANTS } from "@/utils/data";
import OtpInput from "./OTPInput";
import OTPbutton from "./OTPbutton";
import { useState } from "react";
import useGlobalLoader from "@/store/useGlobalLoader";
import { verifyOtp } from "@/services/auth.service";
import { maskEmail } from "@/utils/functions";
import { useRouter } from "next/navigation";

const OTPComponent = ({ email, length = 6, networkClusterCode, data }) => {
  const [otp, setOtp] = useState(Array(length).fill(""));
  const [error, setError] = useState(false);

  const { showLoader, hideLoader } = useGlobalLoader.getState();
  const router = useRouter();

  const otpValue = otp.join("");
  const isOtpComplete = otpValue.length === length && !otp.includes("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isOtpComplete) return;

    const data = {
      email,
      otp: otpValue,
      networkClusterCode,
    };
    setError(false); // ✅ reset error on retry

    try {
      showLoader();

      const res = await verifyOtp(data);
      // console.log(res, "response");
      localStorage.setItem('networkData',JSON.stringify(res?.data?.result?.[0]))
      localStorage.setItem('token',res?.data?.result?.[0]?.token)
      localStorage.setItem('networkClusterCode',res?.data?.result?.[0]?.networkClusterCode)


      if (res?.data?.success) {
        router.push(`/dashboard`);
        return;
      }


      // // ❌ Business error (OTP mismatch)
      if (res?.data?.errorCode === -1) {
        setError(true);
        hideLoader();
        return;
      }
    } catch (err) {
      console.error("Verify OTP error:", err);
      setError(true);
      hideLoader()
    } 
  };

  return (
    <>
      <Heading title="OTP Verification" margin="mb-5" />

      <Description
        description={CONSTANTS.OTP_TITLE}
        email={maskEmail(email)}
        margin="mb-10"
      />

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg flex flex-col gap-10"
      >
        <OtpInput
          length={length}
          otp={otp}
          setOtp={setOtp}
          error={error}
          setError={setError}
          data={data}
        />

        <OTPbutton title="Verify" disabled={!isOtpComplete} />
      </form>
    </>
  );
};

export default OTPComponent;
