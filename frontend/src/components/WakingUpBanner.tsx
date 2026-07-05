import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribeWakeState } from '../hooks/useApi';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

// Drop this once near the root of the app (e.g. in App.tsx) so it can
// appear over any screen whenever a backend request is taking a while.
const WakingUpBanner: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => subscribeWakeState(setVisible), []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          style={{
            position: 'fixed',
            top: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10000,
            background: theme.card,
            border: `1.5px solid ${theme.primary}55`,
            boxShadow: `0 12px 32px rgba(0,0,0,0.25), 0 0 0 1px ${theme.primary}22`,
            borderRadius: '999px',
            padding: '0.6rem 1.2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontFamily: theme.font,
            maxWidth: '90vw',
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{
              width: 14, height: 14, borderRadius: '50%',
              border: `2.5px solid ${theme.primary}33`,
              borderTopColor: theme.primary,
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: theme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {t('backendWakingUp')}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WakingUpBanner;
