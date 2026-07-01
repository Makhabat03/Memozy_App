import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

interface LevelUpModalProps {
  show: boolean;
  level: number;
  onClose: () => void;
}

const LevelUpModal: React.FC<LevelUpModalProps> = ({ show, level, onClose }) => {
  const { theme } = useTheme();
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            fontFamily: theme.font,
          }}
        >
          <motion.div
            initial={{ scale: 0.5, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{
              background: theme.card,
              borderRadius: theme.borderRadius,
              padding: '3rem 4rem',
              textAlign: 'center',
              boxShadow: theme.shadow,
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.8, repeat: 2 }}
              style={{ fontSize: '4rem', marginBottom: '1rem' }}
            >
              🎉
            </motion.div>
            <div style={{ fontSize: '1.5rem', color: theme.textLight, marginBottom: '0.5rem' }}>
              Level Up!
            </div>
            <div style={{ fontSize: '4rem', fontWeight: 900, color: theme.primary }}>
              {level}
            </div>
            <div style={{ color: theme.textLight, marginTop: '1rem', fontSize: '0.9rem' }}>
              Tap anywhere to continue
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LevelUpModal;
