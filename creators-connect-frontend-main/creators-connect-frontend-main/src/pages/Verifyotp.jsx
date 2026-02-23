import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyOtp } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import { successToast, errorToast } from "../utils/toast";
import Button from "../components/Button";

const VerifyOtp = () => {

  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const formData = location.state;

  useEffect(() => {
    if (!formData) {
      navigate("/signup");
    }
  }, [formData, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      errorToast("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);

    try {
      const data = await verifyOtp({
        ...formData,
        otp
      });

      setUser(data);
      successToast("Account created successfully!");

      navigate("/dashboard");

    } catch (error) {
      errorToast(error.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  if (!formData) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-96">

        <h2 className="text-2xl font-semibold text-center mb-6">
          Verify OTP
        </h2>

        <p className="text-sm text-gray-500 text-center mb-4">
          Enter the 6-digit code sent to your email
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="text"
            maxLength={6}
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            className="w-full border rounded-lg px-4 py-2 text-center tracking-widest text-lg"
            required
          />

          <Button type="submit" disabled={loading || otp.length !== 6}>
            {loading ? "Verifying..." : "Verify"}
          </Button>

        </form>
      </div>
    </div>
  );
};

export default VerifyOtp;
