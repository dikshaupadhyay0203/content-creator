import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./routes/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import Layout from "./components/Layout";
import { Toaster } from "react-hot-toast";
import VerifyOtp from "./pages/Verifyotp";
import CreateAsset from "./pages/CreateAsset";
import MyAssets from "./pages/MyAsset";
import ChatRoom from "./pages/ChatRoom";
import BuyToken from "./pages/BuyToken";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Toaster position="top-right" />
          <Routes>

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Public Routes */}
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />


            {/* Protected Routes with Layout */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-asset"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CreateAsset />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-assets"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MyAssets />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <ChatRoom />
                </ProtectedRoute>
              }
            />
            <Route
              path="/buy-token"
              element={
                <ProtectedRoute>
                  <Layout>
                    <BuyToken />
                  </Layout>
                </ProtectedRoute>
              }
            />


          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
