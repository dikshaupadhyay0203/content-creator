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
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-96">
        <h2 className="text-2xl font-semibold text-center mb-6">
          Login
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            name="email"
            type="email"
            placeholder="Email"
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <Button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <p className="text-sm text-center mt-4">
          Don't have account?{" "}
          <Link to="/signup" className="text-blue-600 font-medium">
            Signup
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
