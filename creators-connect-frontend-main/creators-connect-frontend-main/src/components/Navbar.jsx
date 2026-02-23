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
    <nav className="bg-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">

        {/* Logo */}
        <Link
          to="/dashboard"
          className="text-2xl font-bold text-blue-600"
        >
          CreatorConnect
        </Link>

        {/* Right Side */}
        <div className="flex items-center gap-6">

          {user && (
            <>
              {/* Create Asset Button */}
              <Link
                to="/create-asset"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                + Create Asset
              </Link>
              <Link
  to="/my-assets"
  className="text-gray-700 hover:text-blue-600"
>
  My Assets
</Link>

              {/* Username */}
              <span className="text-gray-600 text-sm">
                {user.name}
              </span>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="text-red-500 hover:text-red-600 font-medium"
              >
                Logout
              </button>
            </>
          )}

          {!user && (
            <>
              <Link to="/login" className="text-gray-700">
                Login
              </Link>
              <Link
                to="/signup"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg"
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
