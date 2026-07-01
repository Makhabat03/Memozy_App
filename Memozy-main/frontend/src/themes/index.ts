export type ThemeName = 'minimal' | 'darkFuturistic' | 'nature' | 'pink' | 'cosmic';

export interface Theme {
  name: ThemeName;
  label: string;
  emoji: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  card: string;
  text: string;
  textLight: string;
  font: string;
  borderRadius: string;
  shadow: string;
}

export const themes: Record<ThemeName, Theme> = {
  // Clean slate — bright, minimal, editorial
  minimal: {
    name: 'minimal',
    label: 'Minimal',
    emoji: '✦',
    primary: '#4f46e5',
    secondary: '#7c3aed',
    accent: '#059669',
    background: '#f8fafc',
    card: '#ffffff',
    text: '#1e293b',
    textLight: '#64748b',
    font: "'Inter', sans-serif",
    borderRadius: '10px',
    shadow: '0 2px 16px rgba(79,70,229,0.1)',
  },

  // Cyber terminal — pitch-black with electric neon teal + hot magenta, sharp edges
  darkFuturistic: {
    name: 'darkFuturistic',
    label: 'Dark Futuristic',
    emoji: '🌐',
    primary: '#00ffe7',
    secondary: '#ff2d6b',
    accent: '#ffe500',
    background: '#000d0d',
    card: 'rgba(0, 20, 24, 0.96)',
    text: '#e8fffc',
    textLight: '#44cbb8',
    font: "'Inter', sans-serif",
    borderRadius: '4px',
    shadow: '0 0 20px rgba(0,255,231,0.22), 0 0 0 1px rgba(0,255,231,0.1)',
  },

  // Forest floor — warm greens and amber, calm and earthy
  nature: {
    name: 'nature',
    label: 'Nature',
    emoji: '🌿',
    primary: '#15803d',
    secondary: '#65a30d',
    accent: '#ca8a04',
    background: '#f0fdf4',
    card: '#ffffff',
    text: '#14532d',
    textLight: '#4b7c6a',
    font: "'Nunito', sans-serif",
    borderRadius: '16px',
    shadow: '0 4px 20px rgba(21,128,61,0.14)',
  },

  // Sakura light — soft pinks and lavender, cherry blossom vibes
  pink: {
    name: 'pink',
    label: 'Pink',
    emoji: '🌸',
    primary: '#e91e8c',
    secondary: '#9c27b0',
    accent: '#ff6b6b',
    background: '#fff5f9',
    card: 'rgba(255, 245, 252, 0.88)',
    text: '#2d0040',
    textLight: '#9c27b0',
    font: "'Nunito', sans-serif",
    borderRadius: '18px',
    shadow: '0 8px 32px rgba(233,30,140,0.14)',
  },

  // Space opera — warm gold + lavender nebula, deep indigo void, rounded and mystical
  cosmic: {
    name: 'cosmic',
    label: 'Cosmic',
    emoji: '🌌',
    primary: '#e2b8ff',
    secondary: '#fbbf24',
    accent: '#f472b6',
    background: '#06000f',
    card: 'rgba(16, 4, 36, 0.94)',
    text: '#f5eeff',
    textLight: '#c4a0f0',
    font: "'Sora', 'Inter', sans-serif",
    borderRadius: '16px',
    shadow: '0 0 28px rgba(210,160,255,0.2), inset 0 1px 0 rgba(255,255,255,0.07)',
  },
};
