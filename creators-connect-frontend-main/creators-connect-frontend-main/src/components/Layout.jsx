import Navbar from "./Navbar";

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#020617] text-[#E5E7EB]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 md:py-8">
        {children}
      </div>
    </div>
  );
};

export default Layout;
