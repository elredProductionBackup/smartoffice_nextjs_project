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
import { useDispatch } from "react-redux";
import { setAuth } from "@/store/auth/authSlice";


const OTPComponent = ({ email, length = 6, networkClusterCode, data }) => {
  const [otp, setOtp] = useState(Array(length).fill(""));
  const [error, setError] = useState(false);

  const { showLoader, hideLoader } = useGlobalLoader.getState();
  const router = useRouter();
  const dispatch = useDispatch();


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
    setError(false);

    try {
      showLoader();

      const res = await verifyOtp(data);
      // console.log(res, "response");
      // Now using Redux Reducers for it
      // localStorage.setItem('networkData',JSON.stringify(res?.data?.result?.[0]))
      // localStorage.setItem('token',res?.data?.result?.[0]?.token)
      // localStorage.setItem('networkClusterCode',res?.data?.result?.[0]?.networkClusterCode)

      if (res?.data?.success) {
          const user = res?.data?.result?.[0];
          dispatch(setAuth(user));

          router.push("/dashboard");
          return;
      }

      if (res?.data?.errorCode === -1) {
        setError(true);
        setOtp(Array(length).fill(""));
        hideLoader();
        return;
      }
    } catch (err) {
      console.error("Verify OTP error:", err);
      setError(true);
      setOtp(Array(length).fill(""));
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
