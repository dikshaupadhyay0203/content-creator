import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-40 backdrop-blur-md bg-[#111827]/80 shadow-md border-b border-[#1F2937]">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex flex-wrap justify-between items-center gap-3">

        {/* Logo */}
        <Link
          to="/dashboard"
          className="text-xl sm:text-2xl font-bold text-[#E5E7EB] transition-all duration-300 ease-in-out"
        >
          Zentrix
        </Link>

        {/* Right Side */}
        <div className="flex items-center flex-wrap justify-end gap-3 sm:gap-5 text-sm sm:text-base">

          {user && (
            <>
              {/* Create Asset Button */}
              <Link
                to="/create-asset"
                className="bg-[#10B981] text-white rounded-lg px-3 sm:px-4 py-2 hover:bg-[#059669] hover:scale-105 transition-all duration-300 ease-in-out font-medium"
              >
                + Create Asset
              </Link>
              <Link
                to="/my-assets"
                className="text-[#E5E7EB] hover:text-[#10B981] transition-all duration-300 ease-in-out"
              >
                My Assets
              </Link>
              <Link
                to="/chat"
                className="text-[#E5E7EB] hover:text-[#10B981] transition-all duration-300 ease-in-out"
              >
                Chat
              </Link>
              <Link
                to="/buy-token"
                className="text-[#E5E7EB] hover:text-[#10B981] transition-all duration-300 ease-in-out"
              >
                Buy Tokens
              </Link>

              {/* Username */}
              <span className="text-[#E5E7EB] text-sm">
                {user.name}
              </span>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="text-[#E5E7EB] hover:text-[#10B981] transition-all duration-300 ease-in-out font-medium"
              >
                Logout
              </button>
            </>
          )}

          {!user && (
            <>
              <Link to="/login" className="text-[#E5E7EB] hover:text-[#10B981] transition-all duration-300 ease-in-out">
                Login
              </Link>
              <Link
                to="/signup"
                className="bg-[#10B981] text-white rounded-lg px-4 py-2 hover:bg-[#059669] transition-all duration-300 ease-in-out"
              >
                Signup
              </Link>
            </>
          )}

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
