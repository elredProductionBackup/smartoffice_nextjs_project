const LoginInput = ({ email, setEmail, invalidEmail, setInvalidEmail }) => {
  return (
    <div className="w-full">
      {/* Input */}
      <input
        value={email}
        onFocus={() => setInvalidEmail(false)}
        onChange={(e) => {
          const value = e.target.value.replace(/\s/g, ""); // remove spaces

          setEmail((prev) => ({
            ...prev,
            email: value,
          }));
        }}
        type="text"
        placeholder="Your email ID"
        autoComplete="off"
        className="border border-[#E1E2E6] w-full h-[55px] bg-[#F2F6FC] rounded-lg outline-none px-5 text-base font-medium text-[#333333]"
      />

      {/* Error (conditionally visible, but space preserved) */}
      <div className="min-h-[20px] mt-1 text-sm text-red-500">
        {invalidEmail ? "Invalid email ID" : ""}
      </div>

      {/* Bottom spacing */}
      <div className="mb-10" />
    </div>
  );
};

export default LoginInput;
