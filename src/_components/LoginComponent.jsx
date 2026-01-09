// import { CONSTANTS } from "@/utils/data";
// import ButtonComp from "./ButtonComp";
// import Description from "./Description";
// import Heading from "./Heading";
// import LoginInput from "./LoginInput";

// const LoginComponent = ({
//   setLogin,
//   email,
//   setEmail,
//   sendOTP,
//   invalidEmail,
//   setInvalidEmail
// }) => {
//   return (
//     <>
//       <Heading title={"Sign In"} margin={"mb-5"} />
//       <Description description={CONSTANTS.LOGIN_TITLE} margin={"mb-[50px]"} />
//       <LoginInput email={email} setEmail={setEmail} invalidEmail={invalidEmail} setInvalidEmail={setInvalidEmail}/>
//       <ButtonComp title={"Sign In"} sendOTP={sendOTP} email={email} />
//     </>
//   );
// };

// export default LoginComponent;


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
      <Description description={CONSTANTS.LOGIN_TITLE} margin="mb-[50px]" />

      <form onSubmit={handleSubmit} className="w-full">
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
