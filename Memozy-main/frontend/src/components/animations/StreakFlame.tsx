import React from 'react';
import { motion } from 'framer-motion';
import { MFlame } from '../MemozyEmoji';
import { useLanguage } from '../../context/LanguageContext';

interface StreakFlameProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
}

const MILESTONES = [7, 30, 60, 100, 365];

const EMBERS = [
  { x: -10, delay: 0,    dur: 1.1 },
  { x:   4, delay: 0.35, dur: 1.4 },
  { x:  14, delay: 0.7,  dur: 1.0 },
  { x:  -4, delay: 1.0,  dur: 1.3 },
  { x:   9, delay: 0.15, dur: 1.6 },
];

const StreakFlame: React.FC<StreakFlameProps> = ({ streak, size = 'sm' }) => {
  const { t } = useLanguage();
  const alive   = streak > 0;
  const nextTarget  = MILESTONES.find((m) => m > streak) ?? 365;
  const progress    = Math.min(streak / nextTarget, 1);

  const R            = 46;
  const circumference = 2 * Math.PI * R;
  const dashOffset    = circumference * (1 - progress);

  // Organic flicker: tall-thin → short-wide, with sway
  const flicker = {
    scaleY:  [1, 1.13, 0.93, 1.08, 0.96, 1],
    scaleX:  [1, 0.95, 1.05, 0.97, 1.03, 1],
    rotate:  [0, -4,    3,   -2,    1,    0],
  };
  const flickerT = { duration: 0.75, repeat: Infinity, ease: 'easeInOut' as const, repeatDelay: 0.05 };

  /* ── Large (Profile page) ──────────────────────────────────────────── */
  if (size === 'lg') {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 112,
          height: 112,
          marginBottom: '0.2rem',
        }}>
          {/* Outer glow halo */}
          <motion.div
            animate={{ opacity: [0.25, 0.65, 0.3, 0.7, 0.25], scale: [0.85, 1.1, 0.9, 1.08, 0.85] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              width: 90, height: 90,
              borderRadius: '50%',
              background: alive
                ? 'radial-gradient(circle, rgba(251,146,60,0.55) 0%, rgba(249,115,22,0.25) 55%, transparent 75%)'
                : 'radial-gradient(circle, rgba(148,163,184,0.2) 0%, transparent 70%)',
              filter: 'blur(14px)',
              pointerEvents: 'none',
            }}
          />

          {/* Progress ring */}
          <svg
            width={112} height={112}
            style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}
          >
            <defs>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="#f97316"/>
                <stop offset="100%" stopColor="#fbbf24"/>
              </linearGradient>
            </defs>
            {/* Track */}
            <circle cx={56} cy={56} r={R} fill="none" stroke="rgba(249,115,22,0.15)" strokeWidth={5}/>
            {/* Arc */}
            <motion.circle
              cx={56} cy={56} r={R}
              fill="none"
              stroke={alive ? 'url(#ringGrad)' : '#475569'}
              strokeWidth={5}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 1.3, delay: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
            />
          </svg>

          {/* Floating embers */}
          {alive && EMBERS.map((e, i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -38], opacity: [0, 0.9, 0], scale: [0.6, 1, 0.2] }}
              transition={{ duration: e.dur, repeat: Infinity, delay: e.delay, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                bottom: '28%',
                left: `calc(50% + ${e.x}px)`,
                width: i % 2 === 0 ? 5 : 3,
                height: i % 2 === 0 ? 5 : 3,
                borderRadius: '50%',
                background: i % 3 === 0 ? '#fef08a' : i % 3 === 1 ? '#fbbf24' : '#f97316',
                pointerEvents: 'none',
                boxShadow: '0 0 4px rgba(251,146,60,0.8)',
              }}
            />
          ))}

          {/* Main flame — flickers from bottom anchor */}
          <motion.div
            animate={alive ? flicker : { opacity: [1, 0.5, 1] }}
            transition={alive ? flickerT : { duration: 2, repeat: Infinity }}
            style={{ transformOrigin: 'bottom center', position: 'relative', zIndex: 1 }}
          >
            <MFlame size={68} />
          </motion.div>
        </div>

        {/* Progress label */}
        <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.02em' }}>
          {streak} / {nextTarget} {t('daysToNextGoal')}
        </div>
      </div>
    );
  }

  /* ── Small / Medium inline (Dashboard header) ─────────────────────── */
  if (!alive) return null;

  const flameSize  = size === 'md' ? 38 : 22;
  const fontSize   = size === 'md' ? '1.5rem' : '1rem';
  const gap        = size === 'md' ? '0.4rem' : '0.3rem';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap }}>
      <motion.div
        animate={flicker}
        transition={{ ...flickerT, duration: 0.65 }}
        style={{ display: 'flex', alignItems: 'center', transformOrigin: 'bottom center' }}
      >
        <MFlame size={flameSize} />
      </motion.div>
      <span style={{ fontWeight: 800, fontSize, color: '#f97316' }}>{streak}</span>
      {size === 'md' && (
        <span style={{ fontWeight: 600, fontSize: '0.8rem', color: '#f97316', opacity: 0.8, lineHeight: 1 }}>
          {streak === 1 ? 'day' : 'days'}<br />streak
        </span>
      )}
    </div>
  );
};

export default StreakFlame;
