import { useState } from "react";
import { loginUser } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { successToast, errorToast } from "../utils/toast";
import Button from "../components/Button";
const Login = () => {

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);


  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    setLoading(true);
    e.preventDefault();
    try {
      const data = await loginUser(formData);
      setUser(data);
      successToast("Login successful!");
      navigate("/dashboard");
    } catch (error) {
      const message = error.response?.data?.message || "Login failed";
      errorToast(message);
    }
    finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-4">
      <div className="bg-[#1F2937] shadow-md rounded-xl p-6 w-full max-w-md text-[#E5E7EB]">
        <h2 className="text-2xl font-semibold text-center mb-6">
          Login
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            name="email"
            type="email"
            placeholder="Email"
            onChange={handleChange}
            className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-[#E5E7EB] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#10B981]"
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
            className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-[#E5E7EB] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#10B981]"
          />

          <Button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <p className="text-sm text-center mt-4 text-[#9CA3AF]">
          Don't have account?{" "}
          <Link to="/signup" className="text-[#10B981] hover:text-[#059669] transition-all duration-300 ease-in-out font-medium">
            Signup
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
