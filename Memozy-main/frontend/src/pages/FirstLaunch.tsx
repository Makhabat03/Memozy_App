import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { ThemeName, themes } from '../themes';
import { LANGUAGES, LangCode } from '../i18n/translations';
import { MSparkle } from '../components/MemozyEmoji';

interface FirstLaunchProps {
  onComplete: () => void;
}

const FirstLaunch: React.FC<FirstLaunchProps> = ({ onComplete }) => {
  const { setTheme } = useTheme();
  const { setLang } = useLanguage();
  const [step, setStep] = useState<'language' | 'theme'>('language');
  const [hovered, setHovered] = useState<ThemeName | null>(null);

  const handleLangSelect = (code: LangCode) => {
    setLang(code);
    setStep('theme');
  };

  const handleThemeSelect = (name: ThemeName) => {
    setTheme(name);
    localStorage.setItem('memozy_launched', '1');
    onComplete();
  };

  const themeList = Object.values(themes);
  const preview = hovered ? themes[hovered] : null;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: preview
          ? `linear-gradient(135deg, ${preview.background} 0%, ${preview.primary}22 100%)`
          : 'linear-gradient(135deg, #0a0015 0%, #1e1b4b 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', sans-serif",
        padding: '2rem 1rem',
        transition: 'background 0.5s ease',
      }}
    >
      <AnimatePresence mode="wait">

        {/* ── Step 1: Language ── */}
        {step === 'language' && (
          <motion.div
            key="language"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4 }}
            style={{ width: '100%', maxWidth: '620px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              style={{ marginBottom: '0.5rem' }}
            >
              <MSparkle size={52} />
            </motion.div>

            <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff', margin: '0 0 0.4rem', textShadow: '0 2px 20px rgba(0,0,0,0.5)', textAlign: 'center' }}>
              Welcome to Memozy
            </h1>
            <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.65)', margin: '0 0 2rem', textAlign: 'center' }}>
              Choose your language
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
              gap: '0.75rem',
              width: '100%',
            }}>
              {LANGUAGES.map((lang, i) => (
                <motion.button
                  key={lang.code}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.05 }}
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleLangSelect(lang.code)}
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1.5px solid rgba(255,255,255,0.15)',
                    borderRadius: '14px',
                    padding: '0.9rem 1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.7rem',
                    fontFamily: "'Inter', sans-serif",
                    transition: 'background 0.15s, border-color 0.15s',
                    backdropFilter: 'blur(8px)',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(167,139,250,0.18)';
                    (e.currentTarget as HTMLElement).style.borderColor = '#a78bfa88';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.15)';
                  }}
                >
                  <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>{lang.flag}</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff', lineHeight: 1.2 }}>
                      {lang.label}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.1rem' }}>
                      {lang.english}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Theme ── */}
        {step === 'theme' && (
          <motion.div
            key="theme"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4 }}
            style={{ width: '100%', maxWidth: '900px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              style={{ marginBottom: '0.5rem' }}
            >
              <MSparkle size={52} />
            </motion.div>

            <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff', margin: '0 0 0.4rem', textShadow: '0 2px 20px rgba(0,0,0,0.5)', textAlign: 'center' }}>
              Choose your theme
            </h1>
            <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.65)', margin: '0 0 2rem', textAlign: 'center' }}>
              You can change this anytime in Profile
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))',
              gap: '1rem',
              width: '100%',
            }}>
              {themeList.map((t, i) => (
                <motion.div
                  key={t.name}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.07 }}
                  whileHover={{ scale: 1.06, y: -6 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleThemeSelect(t.name)}
                  onMouseEnter={() => setHovered(t.name)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    background: t.card,
                    borderRadius: t.borderRadius,
                    padding: '1.4rem 1rem',
                    cursor: 'pointer',
                    border: `2px solid ${hovered === t.name ? t.primary : t.primary + '44'}`,
                    boxShadow: hovered === t.name ? t.shadow : '0 4px 16px rgba(0,0,0,0.2)',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    textAlign: 'center',
                    fontFamily: t.font,
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.6rem' }}>{t.emoji}</div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: t.primary, marginBottom: '0.4rem' }}>
                    {t.label}
                  </div>
                  <div style={{
                    background: t.background, borderRadius: t.borderRadius,
                    padding: '0.6rem', margin: '0.5rem 0', border: `1px solid ${t.primary}33`,
                  }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: t.primary, marginBottom: '0.25rem' }}>Q: What is AI?</div>
                    <div style={{ fontSize: '0.55rem', color: t.textLight, lineHeight: 1.4 }}>Artificial Intelligence...</div>
                  </div>
                  <div style={{
                    display: 'inline-block', background: t.primary, color: '#fff',
                    borderRadius: '999px', padding: '0.25rem 0.75rem',
                    fontSize: '0.7rem', fontWeight: 700, marginTop: '0.4rem',
                  }}>
                    Select
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              onClick={() => setStep('language')}
              style={{
                marginTop: '1.5rem', background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', fontFamily: "'Inter', sans-serif",
              }}
            >
              ← Back to language
            </motion.button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default FirstLaunch;
