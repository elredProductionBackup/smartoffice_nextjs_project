const Description = ({ description, margin, email }) => {
  return (
    <div
      className={`${margin} text-lg font-normal text-[#333] flex flex-col items-center justify-center`}
    >
      <div>{description}</div>
      <div>{email}</div>
    </div>
  );
};

export default Description;
