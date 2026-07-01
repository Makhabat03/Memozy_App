import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import XPPopup from './XPPopup';
import LevelUpModal from './LevelUpModal';
import BadgeEarnedToast from './BadgeEarnedToast';
import GlassButton from '../GlassButton';
import { MFlame, MGlowStar, MFlex, MCards, MStar, MStarEmpty } from '../MemozyEmoji';

export interface DeckCompleteScreenProps {
  correct: number;
  total: number;
  xpEarned: number;
  showXP: boolean;
  levelUp: boolean;
  newLevel: number;
  badges: string[];
  streak: number;
  onLevelUpClose: () => void;
  onBadgeDismiss: () => void;
  onStudyAgain: () => void;
  onBack: () => void;
}

const TIERS = [
  { pct: 100, icon: <MGlowStar size={56} />, title: 'FLAWLESS!',   color: '#fbbf24' },
  { pct: 80,  icon: <MFlame size={56} />,    title: 'EXCELLENT!',  color: '#f97316' },
  { pct: 60,  icon: <MFlex size={56} />,     title: 'GREAT WORK!', color: '#22c55e' },
  { pct: 0,   icon: <MCards size={56} />,    title: 'KEEP GOING!', color: '#6366f1' },
];

const DeckCompleteScreen: React.FC<DeckCompleteScreenProps> = ({
  correct, total, xpEarned, showXP, levelUp, newLevel, badges, streak,
  onLevelUpClose, onBadgeDismiss, onStudyAgain, onBack,
}) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const stars = pct === 100 ? 3 : pct >= 60 ? 2 : 1;
  const tier = TIERS.find((t) => pct >= t.pct) ?? TIERS[TIERS.length - 1];

  const [score, setScore]       = useState(0);
  const [xpDisp, setXpDisp]     = useState(0);
  const [starsShown, setStarsShown] = useState(0);
  const [barReady, setBarReady] = useState(false);

  useEffect(() => {
    // Vibration — pattern scales with score
    if ('vibrate' in navigator) {
      if (pct === 100) navigator.vibrate([80, 40, 80, 40, 180, 40, 80]);
      else if (pct >= 80) navigator.vibrate([80, 40, 120]);
      else navigator.vibrate([60]);
    }

    for (let i = 1; i <= stars; i++) {
      setTimeout(() => setStarsShown(i), 280 + i * 360);
    }

    let v = 0;
    const scoreTimer = setInterval(() => {
      v = Math.min(v + Math.max(1, Math.ceil(correct / 22)), correct);
      setScore(v);
      if (v >= correct) clearInterval(scoreTimer);
    }, 38);

    setTimeout(() => {
      let xv = 0;
      const xpTimer = setInterval(() => {
        xv = Math.min(xv + Math.max(1, Math.ceil(xpEarned / 20)), xpEarned);
        setXpDisp(xv);
        if (xv >= xpEarned) clearInterval(xpTimer);
      }, 48);
    }, 900);

    setTimeout(() => setBarReady(true), 580);
    return () => clearInterval(scoreTimer);
  }, [correct, stars, xpEarned]);

  return (
    <>
      <XPPopup xp={xpEarned} show={showXP} />
      <LevelUpModal show={levelUp} level={newLevel} onClose={onLevelUpClose} />
      <BadgeEarnedToast badges={badges} onDismiss={onBadgeDismiss} />

      <div style={{
        maxWidth: '460px', margin: '2.5rem auto', padding: '1rem 1rem 2rem',
        fontFamily: theme.font, textAlign: 'center',
      }}>
        {/* Glow ring for perfect score */}
        {pct === 100 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: [0, 0.6, 0], scale: [0.6, 1.8, 2.4] }}
            transition={{ duration: 1.2, delay: 0.1 }}
            style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', width: 120, height: 120, borderRadius: '50%', background: `radial-gradient(circle, ${tier.color}88, transparent 70%)`, pointerEvents: 'none' }}
          />
        )}

        {/* Performance header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.55, y: -12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          style={{ marginBottom: '0.85rem' }}
        >
          <motion.div
            animate={pct === 100
              ? { rotate: [0, -15, 15, -10, 10, -5, 5, 0], scale: [1, 1.35, 0.9, 1.25, 0.95, 1.1, 1] }
              : { rotate: [0, -12, 12, -6, 6, 0], scale: [1, 1.18, 1] }}
            transition={{ duration: pct === 100 ? 0.9 : 0.65, delay: 0.1 }}
            style={{ lineHeight: 1, marginBottom: '0.4rem' }}
          >
            {tier.icon}
          </motion.div>
          <div style={{
            fontSize: '2rem', fontWeight: 900, letterSpacing: '0.06em',
            background: `linear-gradient(135deg, ${tier.color}, ${theme.primary})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            {tier.title}
          </div>
        </motion.div>

        {/* Stars */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', marginBottom: '1.35rem' }}>
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={
                starsShown >= i
                  ? { scale: [0, 1.5, 1], rotate: [0, 24, 0], opacity: 1 }
                  : { scale: 0.25, opacity: 0.2 }
              }
              transition={{ type: 'spring', stiffness: 420, damping: 14, delay: starsShown >= i ? 0 : 0 }}
              style={{ lineHeight: 1 }}
            >
              {starsShown >= i ? <MStar size={36} /> : <MStarEmpty size={36} />}
            </motion.div>
          ))}
        </div>

        {/* Stats card */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, type: 'spring', stiffness: 200, damping: 22 }}
          style={{
            background: theme.card, borderRadius: theme.borderRadius,
            padding: '1.75rem 1.5rem', boxShadow: theme.shadow, marginBottom: '1.25rem',
          }}
        >
          {/* Score */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.25rem', marginBottom: '0.3rem' }}>
            <span style={{ fontSize: '4.5rem', fontWeight: 900, color: theme.primary, lineHeight: 1 }}>
              {score}
            </span>
            <span style={{ fontSize: '1.8rem', color: theme.textLight, fontWeight: 700 }}>
              /{total}
            </span>
          </div>
          <div style={{ color: theme.textLight, fontSize: '0.88rem', marginBottom: '1.3rem' }}>
            {t('cardsCorrectLabel')}
          </div>

          {/* Accuracy bar */}
          <div style={{ background: `${theme.primary}20`, borderRadius: '999px', height: '10px', marginBottom: '0.38rem' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: barReady ? `${pct}%` : 0 }}
              transition={{ duration: 0.95, delay: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
              style={{
                height: '100%',
                background: `linear-gradient(90deg, ${theme.primary}, ${theme.secondary})`,
                borderRadius: '999px',
                boxShadow: `0 0 10px ${theme.primary}66`,
              }}
            />
          </div>
          <div style={{ fontSize: '0.83rem', color: theme.textLight, marginBottom: '1.1rem' }}>
            {pct}% {t('accuracyLabel')}
          </div>

          {/* XP + Streak chips */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.75 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.88 }}
              style={{
                flex: 1, padding: '0.75rem', borderRadius: theme.borderRadius,
                background: `${theme.accent}16`, border: `1px solid ${theme.accent}33`,
              }}
            >
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: theme.accent }}>
                +{xpDisp}
              </div>
              <div style={{ fontSize: '0.72rem', color: theme.textLight }}>{t('xpEarnedLabel')}</div>
            </motion.div>

            {streak > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.75 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.05 }}
                style={{
                  flex: 1, padding: '0.75rem', borderRadius: theme.borderRadius,
                  background: '#fef3c722', border: '1px solid #fbbf2444',
                }}
              >
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                  <MFlame size={22} /> {streak}
                </div>
                <div style={{ fontSize: '0.72rem', color: theme.textLight }}>{t('dayStreakLabel')}</div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          style={{ display: 'flex', gap: '0.75rem' }}
        >
          <GlassButton variant="outline" onClick={onStudyAgain} style={{ flex: 1, padding: '0.88rem', fontSize: '0.95rem' }}>
            🔄 {t('studyAgain')}
          </GlassButton>
          <GlassButton onClick={onBack} style={{ flex: 1, padding: '0.88rem', fontSize: '0.95rem' }}>
            ← {t('backToDecks')}
          </GlassButton>
        </motion.div>
      </div>
    </>
  );
};

export default DeckCompleteScreen;
