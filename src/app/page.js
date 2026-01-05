'use client'
import logo from "@/assets/logo/logo.svg";
import Image from "next/image";

import LoginComponent from "@/_components/LoginComponent";
import OTPComponent from "@/_components/OTPComponent";
import { useState } from "react";

console.log('testing')
const Login = () => {
  const [login, setLogin] = useState(true);

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="w-full sm:max-w-lg mx-5 flex flex-col items-center">
        <Image src={logo} alt="smart-office" className="mb-15" />
        {(login ? <LoginComponent setLogin={setLogin}/> : <OTPComponent />)}
      </div>
    </div>
  );
};

export default Login;
