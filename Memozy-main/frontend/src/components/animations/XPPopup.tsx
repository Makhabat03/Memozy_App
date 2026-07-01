import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

interface XPPopupProps {
  xp: number;
  show: boolean;
}

const XPPopup: React.FC<XPPopupProps> = ({ xp, show }) => {
  const { theme } = useTheme();
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1, y: 0, scale: 1 }}
          animate={{ opacity: 0, y: -80, scale: 1.2 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            top: '30%',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            pointerEvents: 'none',
            fontFamily: theme.font,
            fontSize: '2rem',
            fontWeight: 800,
            color: theme.accent,
            textShadow: `0 2px 12px ${theme.accent}88`,
          }}
        >
          +{xp} XP ✨
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default XPPopup;
