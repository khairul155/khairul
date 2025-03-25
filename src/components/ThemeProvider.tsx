
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  
  useEffect(() => {
    // Always set to dark theme
    const root = window.document.documentElement;
    root.classList.remove("light");
    root.classList.add("dark");
    // No longer saving to localStorage as it's always dark
  }, []);

  // Keep the toggle function for compatibility but it does nothing now
  const toggleTheme = () => {
    // No-op function
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
