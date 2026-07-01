import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { LANGUAGES, LangCode } from '../i18n/translations';

interface Props {
  compact?: boolean; // true = flag only, false = flag + name (default)
}

const LanguageDropdown: React.FC<Props> = ({ compact = false }) => {
  const { theme } = useTheme();
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find(l => l.code === lang) ?? LANGUAGES[0];

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSelect = (code: LangCode) => {
    setLang(code);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.35rem',
          padding: compact ? '0.45rem 0.55rem' : '0.45rem 0.75rem',
          background: open ? `${theme.primary}18` : 'rgba(255,255,255,0.06)',
          border: `1px solid ${open ? theme.primary + '55' : theme.primary + '33'}`,
          borderRadius: theme.borderRadius,
          cursor: 'pointer', fontFamily: theme.font,
          transition: 'all 0.15s',
        }}
      >
        <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{current.flag}</span>
        {!compact && (
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: theme.text, whiteSpace: 'nowrap' }}>
            {current.label}
          </span>
        )}
        <ChevronDown
          size={12}
          style={{ color: theme.textLight, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        />
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            style={{
              position: 'absolute', right: 0, top: 'calc(100% + 8px)',
              background: theme.card,
              border: `1px solid ${theme.primary}33`,
              borderRadius: theme.borderRadius,
              boxShadow: theme.shadow,
              zIndex: 9999,
              overflow: 'hidden',
              minWidth: '200px',
            }}
          >
            {LANGUAGES.map((l) => {
              const active = l.code === lang;
              return (
                <button
                  key={l.code}
                  onClick={() => handleSelect(l.code)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.65rem',
                    width: '100%', padding: '0.6rem 0.9rem',
                    border: 'none', borderBottom: `1px solid ${theme.primary}11`,
                    background: active ? `${theme.primary}16` : 'transparent',
                    cursor: 'pointer', fontFamily: theme.font, textAlign: 'left',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = `${theme.primary}0a`; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <span style={{ fontSize: '1.25rem', lineHeight: 1, flexShrink: 0 }}>{l.flag}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.84rem', color: active ? theme.primary : theme.text, lineHeight: 1.2 }}>
                      {l.label}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: theme.textLight }}>{l.english}</div>
                  </div>
                  {active && (
                    <span style={{ fontSize: '0.75rem', color: theme.primary, fontWeight: 900, flexShrink: 0 }}>✓</span>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageDropdown;
