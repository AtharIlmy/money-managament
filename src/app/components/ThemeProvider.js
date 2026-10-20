'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeCtx = createContext({ isDark: false, toggleTheme: () => {} });

export function useTheme() {
  return useContext(ThemeCtx);
}

export default function ThemeProvider({ children }) {
  const isDark = false;
  const toggleTheme = () => {};

  useEffect(() => {
    try {
      localStorage.removeItem('app_theme');
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.remove('dark');
    } catch {
      // ignore
    }
  }, []);

  return (
    <ThemeCtx.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeCtx.Provider>
  );
}
