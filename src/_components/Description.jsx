const Description = ({ description, margin, email }) => {
  return (
    <div
      className={`${margin} text-base sm:text-lg font-normal text-[#333] flex flex-col items-center justify-center text-center`}
    >
      <div>{description}</div>
      <div className="break-all">{email}</div>
    </div>
  );
};

export default Description;
