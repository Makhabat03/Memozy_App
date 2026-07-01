import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { MSparkle, MThumbUp, MHardFace, MBurst, MBolt, MFlame } from '../MemozyEmoji';

export interface RatingFeedbackProps {
  rating: 'easy' | 'good' | 'hard' | null;
  ratingKey: number;
  combo: number;
}

const COMBO_TIERS = [
  { min: 8, icon: <MBurst size={30} />, label: 'UNSTOPPABLE!' },
  { min: 5, icon: <MBolt size={30} />,  label: 'ON FIRE!' },
  { min: 3, icon: <MFlame size={30} />, label: 'COMBO!' },
];

const RatingFeedback: React.FC<RatingFeedbackProps> = ({ rating, ratingKey, combo }) => {
  const { theme, themeName } = useTheme();
  const isDark = themeName === 'darkFuturistic' || themeName === 'cosmic';

  const RATING_CFG = {
    easy: { icon: <MSparkle size={38} />, text: 'EASY!', color: isDark ? '#4ade80'  : '#22c55e' },
    good: { icon: <MThumbUp size={38} />, text: 'GOOD!', color: isDark ? theme.primary : '#6366f1' },
    hard: { icon: <MHardFace size={38} />, text: 'HARD', color: isDark ? '#ff6b8a'  : '#ef4444' },
  };
  const [showRating, setShowRating] = useState(false);
  const [showCombo,  setShowCombo]  = useState(false);
  const prevComboRef = useRef(0);

  useEffect(() => {
    if (!rating) return;
    setShowRating(true);
    const t = setTimeout(() => setShowRating(false), 640);
    return () => clearTimeout(t);
  }, [ratingKey]); // eslint-disable-line

  useEffect(() => {
    if (combo >= 3 && combo > prevComboRef.current) {
      setShowCombo(true);
      prevComboRef.current = combo;
      const t = setTimeout(() => setShowCombo(false), 1100);
      return () => clearTimeout(t);
    }
    if (combo === 0) prevComboRef.current = 0;
  }, [combo]);

  if (!rating) return null;

  const cfg       = RATING_CFG[rating];
  const comboTier = COMBO_TIERS.find((c) => combo >= c.min);

  return (
    <>
      {/* Rating pop */}
      <AnimatePresence>
        {showRating && (
          <motion.div
            key={ratingKey}
            initial={{ opacity: 1, y: 18,  scale: 0.65 }}
            animate={{ opacity: 1, y: -12, scale: 1    }}
            exit={{   opacity: 0, y: -55,  scale: 1.25 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            style={{
              position: 'fixed', top: '37%', left: '50%',
              transform: 'translateX(-50%)',
              pointerEvents: 'none', zIndex: 620,
              textAlign: 'center',
            }}
          >
            <div style={{ lineHeight: 1 }}>{cfg.icon}</div>
            <div style={{
              fontFamily: theme.font, fontWeight: 900, fontSize: '1.35rem',
              color: cfg.color, letterSpacing: '0.08em',
              textShadow: `0 0 18px ${cfg.color}88`,
            }}>
              {cfg.text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Combo banner */}
      <AnimatePresence>
        {showCombo && comboTier && (
          <motion.div
            key={`combo-${combo}`}
            initial={{ opacity: 0, scale: 0.65, x: 55 }}
            animate={{ opacity: 1, scale: 1,    x: 0   }}
            exit={{   opacity: 0, scale: 1.2,   x: -30 }}
            transition={{ type: 'spring', stiffness: 520, damping: 24 }}
            style={{
              position: 'fixed', top: '20%', right: '4%',
              pointerEvents: 'none', zIndex: 620,
              background: `linear-gradient(135deg, ${theme.primary}28, ${theme.secondary}28)`,
              backdropFilter: 'blur(8px)',
              border: `1.5px solid ${theme.primary}55`,
              borderRadius: theme.borderRadius,
              padding: '0.6rem 1rem',
              textAlign: 'center',
            }}
          >
            <div style={{ lineHeight: 1 }}>{comboTier.icon}</div>
            <div style={{
              fontFamily: theme.font, fontWeight: 900, fontSize: '0.88rem',
              color: theme.primary, letterSpacing: '0.05em',
            }}>
              ×{combo} {comboTier.label}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default RatingFeedback;
