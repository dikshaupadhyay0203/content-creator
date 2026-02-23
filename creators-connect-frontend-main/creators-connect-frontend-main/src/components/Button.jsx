const Button = ({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled = false,
  loading = false
}) => {

  const base =
    "w-full py-2 rounded-lg transition-all duration-300 ease-in-out font-medium";

  const styles = {
    primary:
      "bg-[#10B981] text-white hover:bg-[#059669]",
    secondary:
      "bg-[#111827] text-[#E5E7EB] hover:bg-[#1F2937] border border-[#374151]",
    danger:
      "bg-[#374151] text-[#E5E7EB] hover:bg-[#4B5563]"
  };

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`${base} ${styles[variant]} ${isDisabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
    >
      {loading ? "Loading..." : children}
    </button>
  );
};

export default Button;
