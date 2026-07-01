import React, { createContext, useContext, useState, useEffect } from 'react';
import { themes, ThemeName, Theme } from '../themes';

interface ThemeContextValue {
  theme: Theme;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: themes.minimal,
  themeName: 'minimal',
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeName, setThemeName] = useState<ThemeName>(() => {
    const saved = localStorage.getItem('memozy_theme') as ThemeName;
    // fall back to minimal if saved theme was deleted
    return saved && saved in themes ? saved : 'minimal';
  });

  const setTheme = (name: ThemeName) => {
    setThemeName(name);
    localStorage.setItem('memozy_theme', name);
  };

  const theme = themes[themeName];

  useEffect(() => {
    document.documentElement.style.setProperty('--primary', theme.primary);
    document.documentElement.style.setProperty('--secondary', theme.secondary);
    document.documentElement.style.setProperty('--accent', theme.accent);
    document.documentElement.style.setProperty('--background', theme.background);
    document.documentElement.style.setProperty('--card', theme.card);
    document.documentElement.style.setProperty('--text', theme.text);
    document.documentElement.style.setProperty('--font', theme.font);
    document.documentElement.style.setProperty('--radius', theme.borderRadius);
    document.body.style.fontFamily = theme.font;
    document.body.style.background = theme.background;
    document.body.style.color = theme.text;
    document.body.setAttribute('data-theme', themeName);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, themeName, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
