import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

const BADGE_LABELS: Record<string, { icon: string; label: string }> = {
  first_deck: { icon: '📚', label: 'First Deck!' },
  streak_7: { icon: '🔥', label: '7-Day Streak!' },
  streak_30: { icon: '⚡', label: '30-Day Streak!' },
  level_5: { icon: '⭐', label: 'Level 5!' },
  cards_100: { icon: '💯', label: '100 Cards Studied!' },
  cards_500: { icon: '🏆', label: '500 Cards Studied!' },
};

interface BadgeEarnedToastProps {
  badges: string[];
  onDismiss: () => void;
}

const BadgeEarnedToast: React.FC<BadgeEarnedToastProps> = ({ badges, onDismiss }) => {
  const { theme } = useTheme();
  return (
    <AnimatePresence>
      {badges.map((badge, i) => {
        const info = BADGE_LABELS[badge] || { icon: '🏅', label: badge };
        return (
          <motion.div
            key={badge}
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ delay: i * 0.3 }}
            onClick={onDismiss}
            style={{
              position: 'fixed',
              bottom: `${20 + i * 80}px`,
              right: '20px',
              background: theme.card,
              border: `2px solid ${theme.accent}`,
              borderRadius: theme.borderRadius,
              padding: '0.75rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: theme.shadow,
              cursor: 'pointer',
              zIndex: 1500,
              fontFamily: theme.font,
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>{info.icon}</span>
            <div>
              <div style={{ fontWeight: 700, color: theme.text, fontSize: '0.85rem' }}>Badge Earned!</div>
              <div style={{ color: theme.accent, fontWeight: 600 }}>{info.label}</div>
            </div>
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
};

export default BadgeEarnedToast;
