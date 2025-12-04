import { CONSTANTS } from "@/utils/data";
import ButtonComp from "./ButtonComp";
import Description from "./Description";
import Heading from "./Heading";
import LoginInput from "./LoginInput";

const LoginComponent = ({setLogin}) => {
  return (
    <>
      <Heading title={"Sign In"} margin={"mb-5"} />
      <Description description={CONSTANTS.LOGIN_TITLE} margin={"mb-[50px]"} />
      <LoginInput />
      <ButtonComp title={"Sign In"} setLogin={setLogin}/>
    </>
  );
};

export default LoginComponent;
