import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLayout } from "@/contexts/LayoutContext";

const MainLayout: React.FC = () => {
  const { productTray } = useLayout();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar bottomNavProductTray={productTray} />
      <div className="flex-grow">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
};

export default MainLayout;
