import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const theme = 'light';
  const isDark = false;
  const setTheme = () => {};
  const toggleTheme = () => {};

  useEffect(() => {
    try {
      localStorage.removeItem('app_theme');
    } catch (e) {
      // ignore
    }

    const root = document.documentElement;
    root.setAttribute('data-theme', 'light');
    root.classList.remove('dark');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
