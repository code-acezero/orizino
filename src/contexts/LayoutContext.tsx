import React, { createContext, useContext, useState, useCallback } from "react";
import type { BottomNavProductTray } from "@/components/BottomNav";

interface LayoutContextType {
  productTray: BottomNavProductTray | undefined;
  setProductTray: (tray: BottomNavProductTray | undefined) => void;
}

const LayoutContext = createContext<LayoutContextType>({
  productTray: undefined,
  setProductTray: () => {},
});

export const useLayout = () => useContext(LayoutContext);

export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [productTray, setProductTray] = useState<BottomNavProductTray | undefined>();
  return (
    <LayoutContext.Provider value={{ productTray, setProductTray }}>
      {children}
    </LayoutContext.Provider>
  );
};
