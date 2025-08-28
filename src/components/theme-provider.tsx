"use client"

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type Theme = "light" | "dark";

type ThemeProviderProps = {
  children: ReactNode;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (storedTheme) {
        setTheme(storedTheme);
        if (storedTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    } else if (prefersDark) {
        setTheme('dark');
        document.documentElement.classList.add('dark');
    } else {
        setTheme('light');
        document.documentElement.classList.remove('dark');
    }
  }, []);

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      localStorage.setItem('theme', newTheme);
      setTheme(newTheme);
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
