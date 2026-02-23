const Button = ({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled = false,
  loading = false
}) => {

  const base =
    "w-full py-2 rounded-lg transition font-medium";

  const styles = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700",
    secondary:
      "bg-gray-200 text-gray-800 hover:bg-gray-300",
    danger:
      "bg-red-500 text-white hover:bg-red-600"
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
