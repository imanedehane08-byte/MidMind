import { createContext, useContext, useEffect, useState } from "react";

type DarkModeContextType = {
  darkMode: boolean;
  toggle: () => void;
};

const DarkModeContext = createContext<DarkModeContextType>({ darkMode: false, toggle: () => {} });

export function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("midmind_dark") === "true";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    localStorage.setItem("midmind_dark", String(darkMode));
  }, [darkMode]);

  return (
    <DarkModeContext.Provider value={{ darkMode, toggle: () => setDarkMode((v) => !v) }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  return useContext(DarkModeContext);
}
