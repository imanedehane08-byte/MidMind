// Provides dark/light theme state and persists the choice in localStorage.
import { createContext, useContext, useEffect, useState } from "react";

type DarkModeContextType = {
  darkMode: boolean;
  toggle: () => void;
};

const DarkModeContext = createContext<DarkModeContextType>({ darkMode: false, toggle: () => {} });

// Applies the theme to the document and exposes a toggle function.
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

// Lets components read or toggle the active theme.
export function useDarkMode() {
  return useContext(DarkModeContext);
}
