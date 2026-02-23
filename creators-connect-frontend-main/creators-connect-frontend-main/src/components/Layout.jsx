import Navbar from "./Navbar";

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
};

export default Layout;
