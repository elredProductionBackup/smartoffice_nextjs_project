"use client";
import { CONSTANTS } from "@/utils/data";
import ButtonComp from "./ButtonComp";
import Description from "./Description";
import Heading from "./Heading";
import LoginInput from "./LoginInput";


const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const LoginComponent = ({
  setLogin,
  email,
  setEmail,
  sendOTP,
  invalidEmail,
  setInvalidEmail,
}) => {

 const handleSubmit = (e) => {
    e.preventDefault();

    if (!isValidEmail(email)) {
      setInvalidEmail(true);
      return;
    }

    sendOTP();
  };

  return (
    <>
      <Heading title="Sign In" margin="mb-5" />
      <Description description={CONSTANTS.LOGIN_TITLE} margin="mb-8 sm:mb-[50px]" />

      <form onSubmit={handleSubmit} noValidate className="w-full">
        <LoginInput
          email={email}
          setEmail={setEmail}
          invalidEmail={invalidEmail}
          setInvalidEmail={setInvalidEmail}
        />

        <ButtonComp title="Sign In" email={email} />
      </form>
    </>
  );
};

export default LoginComponent;
