import { useState } from "react";
import { sendOtp } from "../api/authApi";
import { useNavigate, Link } from "react-router-dom";
import { successToast, errorToast } from "../utils/toast";
import Button from "../components/Button";

const Signup = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name || !formData.email || !formData.password) {
      errorToast("All fields are required");
      return;
    }

    setLoading(true);

    try {
      await sendOtp({ email: formData.email });
      successToast("OTP sent to your email");

      navigate("/verify-otp", {
        state: formData
      });

    } catch (error) {
      errorToast(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-4">
      <div className="bg-[#1F2937] shadow-md rounded-xl p-6 w-full max-w-md text-[#E5E7EB]">

        <h2 className="text-2xl font-semibold text-center mb-6">
          Create Account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            name="name"
            type="text"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-[#E5E7EB] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#10B981]"
            required
          />

          <input
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-[#E5E7EB] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#10B981]"
            required
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-[#E5E7EB] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#10B981]"
            required
          />

          <Button type="submit" disabled={loading}>
            {loading ? "Sending OTP..." : "Send OTP"}
          </Button>

        </form>

        <p className="text-sm text-center mt-4 text-[#9CA3AF]">
          Already have an account?{" "}
          <Link to="/login" className="text-[#10B981] hover:text-[#059669] transition-all duration-300 ease-in-out font-medium">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
