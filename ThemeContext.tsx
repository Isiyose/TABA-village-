import React, { createContext, useContext, useEffect, useState } from 'react';

type AccentColor = 'blue' | 'emerald' | 'rose' | 'amber' | 'indigo' | 'violet';

type ThemeContextType = {
  isDark: boolean;
  toggleDark: () => void;
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('rusororo-theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    return (localStorage.getItem('rusororo-accent') as AccentColor) || 'emerald';
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('rusororo-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('rusororo-theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    // Remove all possible accent classes
    const colors: AccentColor[] = ['blue', 'emerald', 'rose', 'amber', 'indigo', 'violet'];
    colors.forEach(c => document.documentElement.classList.remove(`accent-${c}`));
    
    // Add current accent class
    document.documentElement.classList.add(`accent-${accentColor}`);
    localStorage.setItem('rusororo-accent', accentColor);
  }, [accentColor]);

  const toggleDark = () => setIsDark(prev => !prev);
  const setAccentColor = (color: AccentColor) => setAccentColorState(color);

  return (
    <ThemeContext.Provider value={{ isDark, toggleDark, accentColor, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
