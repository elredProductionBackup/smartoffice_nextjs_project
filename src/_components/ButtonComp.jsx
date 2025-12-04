"use client";

const ButtonComp = ({ title, setLogin }) => {
  return (
    <div
      onClick={() => setLogin(false)}
      className="bg-[#0B57D0] h-15 rounded-full w-full flex items-center justify-center text-xl font-medium text-white cursor-pointer"
    >
      {title}
    </div>
  );
};

export default ButtonComp;
