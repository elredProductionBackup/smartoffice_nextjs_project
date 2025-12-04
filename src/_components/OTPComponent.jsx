"use client";
import Heading from "./Heading";
import Description from "./Description";
import { CONSTANTS } from "@/utils/data";
import OtpInput from "./OTPInput";
import ButtonComp from "./ButtonComp";

const OTPComponent = () => {
  const handleOtpComplete = (otp) => {
    console.log("OTP Entered:", otp);
  };

  return (
    <>
      <Heading title={"OTP Verification"} margin={"mb-5"} />
      <Description description={CONSTANTS.OTP_TITLE} email={'sa***@elred.io'} margin={"mb-10"} />
      <OtpInput length={6} onComplete={handleOtpComplete} />
      <ButtonComp title={"Verify"} />
    </>
  );
};

export default OTPComponent;
