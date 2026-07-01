import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { MSparkle, MFlame, MGlowStar, MCards, MThumbUp, MHardFace, MBolt } from './MemozyEmoji';

interface OnboardingTourProps {
  onComplete: () => void;
}

const TOTAL_STEPS = 5;

const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete }) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [rated, setRated] = useState<string | null>(null);
  const [xpFill, setXpFill] = useState(0);

  const finish = () => {
    localStorage.setItem('memozy_onboarded', '1');
    onComplete();
  };

  const next = () => {
    if (step === TOTAL_STEPS - 1) {
      finish();
      navigate('/create');
    } else {
      if (step === 3) setXpFill(0);
      setStep(s => s + 1);
      setCardFlipped(false);
      setRated(null);
    }
  };

  const skip = () => finish();

  // Step 2 — card flip must happen before proceeding
  const canNext = step !== 2 || rated !== null;

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 9000,
    background: 'rgba(0,0,0,0.72)',
    backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '1rem',
    fontFamily: theme.font,
  };

  const card: React.CSSProperties = {
    background: theme.card,
    borderRadius: '24px',
    boxShadow: `0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px ${theme.primary}33`,
    padding: '2.5rem 2rem 2rem',
    maxWidth: '420px',
    width: '100%',
    position: 'relative',
    textAlign: 'center',
  };

  return (
    <div style={overlay}>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          style={card}
        >
          {/* Skip button */}
          {step < TOTAL_STEPS - 1 && (
            <button onClick={skip} style={{
              position: 'absolute', top: '1rem', right: '1.1rem',
              background: 'none', border: 'none', cursor: 'pointer',
              color: theme.textLight, fontSize: '0.8rem', opacity: 0.6,
            }}>
              Skip tour
            </button>
          )}

          {/* Progress dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '1.8rem' }}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <motion.div
                key={i}
                animate={{ width: i === step ? 22 : 7, background: i === step ? theme.primary : `${theme.primary}44` }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                style={{ height: 7, borderRadius: 999 }}
              />
            ))}
          </div>

          {/* ── Step 0: Welcome ── */}
          {step === 0 && (
            <>
              <motion.div
                animate={{ rotate: [0, 12, -12, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.5 }}
                style={{ display: 'inline-block', marginBottom: '1rem' }}
              >
                <MSparkle size={72} />
              </motion.div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: theme.text, margin: '0 0 0.6rem' }}>
                Hey, welcome to Memozy!
              </h2>
              <p style={{ color: theme.textLight, lineHeight: 1.6, margin: '0 0 1.5rem' }}>
                Let me show you around in <strong style={{ color: theme.primary }}>4 quick steps</strong> so you can start learning right away.
              </p>
            </>
          )}

          {/* ── Step 1: Create a Deck ── */}
          {step === 1 && (
            <>
              <motion.div style={{ marginBottom: '1.2rem' }}>
                <MCards size={64} />
              </motion.div>
              <h2 style={{ fontSize: '1.55rem', fontWeight: 900, color: theme.text, margin: '0 0 0.5rem' }}>
                Create decks instantly
              </h2>
              <p style={{ color: theme.textLight, lineHeight: 1.6, margin: '0 0 1.4rem' }}>
                Paste any text, upload a PDF, or type cards manually. <strong style={{ color: theme.primary }}>AI generates flashcards</strong> for you in seconds.
              </p>
              {/* Mock create card */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                  background: `${theme.primary}11`, border: `1.5px dashed ${theme.primary}66`,
                  borderRadius: '14px', padding: '1rem', marginBottom: '1.4rem',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: theme.textLight, marginBottom: '0.4rem', fontWeight: 600 }}>
                  PASTE YOUR NOTES
                </div>
                <motion.div
                  style={{ fontSize: '0.85rem', color: theme.text, lineHeight: 1.5 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  "The mitochondria is the powerhouse of the cell..."
                  <motion.span
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    style={{ borderLeft: `2px solid ${theme.primary}`, marginLeft: 2 }}
                  >&nbsp;</motion.span>
                </motion.div>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ delay: 1, duration: 1.2, ease: 'easeOut' }}
                  style={{
                    height: 3, background: `linear-gradient(90deg, ${theme.primary}, ${theme.secondary})`,
                    borderRadius: 999, marginTop: '0.75rem',
                  }}
                />
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.2 }}
                  style={{ fontSize: '0.72rem', color: theme.primary, fontWeight: 700, marginTop: '0.4rem' }}
                >
                  ✓ 12 cards generated!
                </motion.div>
              </motion.div>
            </>
          )}

          {/* ── Step 2: Study (interactive flip) ── */}
          {step === 2 && (
            <>
              <h2 style={{ fontSize: '1.55rem', fontWeight: 900, color: theme.text, margin: '0 0 0.4rem' }}>
                Study smarter
              </h2>
              <p style={{ color: theme.textLight, fontSize: '0.88rem', margin: '0 0 1.2rem' }}>
                {!cardFlipped
                  ? <>👇 <strong style={{ color: theme.primary }}>Tap the card</strong> to reveal the answer</>
                  : <>Now rate how well you knew it:</>
                }
              </p>

              {/* Flip card */}
              <div
                onClick={() => !cardFlipped && setCardFlipped(true)}
                style={{ perspective: 900, marginBottom: '1.2rem', cursor: cardFlipped ? 'default' : 'pointer' }}
              >
                <motion.div
                  animate={{ rotateY: cardFlipped ? 180 : 0 }}
                  transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
                  style={{ transformStyle: 'preserve-3d', position: 'relative', height: 110 }}
                >
                  {/* Front */}
                  <div style={{
                    backfaceVisibility: 'hidden', position: 'absolute', inset: 0,
                    background: `linear-gradient(135deg, ${theme.primary}22, ${theme.secondary}18)`,
                    border: `2px solid ${theme.primary}55`, borderRadius: '16px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                  }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: theme.textLight, letterSpacing: '0.08em' }}>QUESTION</div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: theme.text }}>What is spaced repetition?</div>
                    {!cardFlipped && (
                      <motion.div
                        animate={{ y: [0, 4, 0] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                        style={{ fontSize: '0.7rem', color: theme.primary, marginTop: '0.2rem' }}
                      >
                        tap to flip ↕
                      </motion.div>
                    )}
                  </div>
                  {/* Back */}
                  <div style={{
                    backfaceVisibility: 'hidden', transform: 'rotateY(180deg)',
                    position: 'absolute', inset: 0,
                    background: `linear-gradient(135deg, ${theme.secondary}22, ${theme.primary}18)`,
                    border: `2px solid ${theme.secondary}55`, borderRadius: '16px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                    padding: '0.75rem',
                  }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: theme.textLight, letterSpacing: '0.08em' }}>ANSWER</div>
                    <div style={{ fontWeight: 600, fontSize: '0.82rem', color: theme.text, lineHeight: 1.5 }}>
                      A learning technique where reviews are spaced over increasing intervals for long-term memory.
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Rating buttons — appear after flip */}
              <AnimatePresence>
                {cardFlipped && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', marginBottom: '1.2rem' }}
                  >
                    {[
                      { label: 'Hard', color: '#ef4444', icon: <MHardFace size={20} /> },
                      { label: 'Good', color: theme.primary, icon: <MThumbUp size={20} /> },
                      { label: 'Easy', color: '#22c55e', icon: <MSparkle size={20} /> },
                    ].map(({ label, color, icon }) => (
                      <motion.button
                        key={label}
                        onClick={() => setRated(label)}
                        whileHover={{ scale: 1.07 }}
                        whileTap={{ scale: 0.94 }}
                        style={{
                          border: `2px solid ${rated === label ? color : color + '55'}`,
                          background: rated === label ? color + '22' : 'transparent',
                          borderRadius: '10px', padding: '0.45rem 0.75rem',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem',
                          color, fontWeight: 800, fontSize: '0.82rem',
                          transition: 'all 0.2s',
                        }}
                      >
                        {icon} {label}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {rated && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ fontSize: '0.8rem', color: theme.primary, fontWeight: 700, margin: '0 0 1rem' }}
                >
                  Memozy will schedule your next review automatically!
                </motion.p>
              )}
            </>
          )}

          {/* ── Step 3: Streaks & XP ── */}
          {step === 3 && (
            <>
              <motion.div
                animate={{ scaleY: [1, 1.15, 0.93, 1.08, 1], scaleX: [1, 0.95, 1.05, 0.97, 1] }}
                transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 0.4 }}
                style={{ display: 'inline-block', marginBottom: '0.8rem', transformOrigin: 'bottom center' }}
              >
                <MFlame size={60} />
              </motion.div>
              <h2 style={{ fontSize: '1.55rem', fontWeight: 900, color: theme.text, margin: '0 0 0.5rem' }}>
                Streaks &amp; XP
              </h2>
              <p style={{ color: theme.textLight, lineHeight: 1.6, margin: '0 0 1.2rem' }}>
                Study every day to grow your streak. Earn <strong style={{ color: theme.primary }}>XP</strong>, level up, and unlock badges.
              </p>

              {/* Animated XP bar demo */}
              <div style={{ marginBottom: '0.5rem', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: theme.textLight, marginBottom: '0.3rem' }}>
                  <span>Level 3</span><span>240 / 500 XP</span>
                </div>
                <div style={{ background: `${theme.primary}22`, borderRadius: 999, height: 10, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: '48%' }}
                    transition={{ duration: 1.2, delay: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                    style={{ height: '100%', background: `linear-gradient(90deg, ${theme.primary}, ${theme.secondary})`, borderRadius: 999 }}
                  />
                </div>
              </div>

              {/* Badge row */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem', marginBottom: '1rem' }}
              >
                {[
                  { icon: <MFlame size={26} />, label: '7 Day' },
                  { icon: <MGlowStar size={26} />, label: 'Flawless' },
                  { icon: <MBolt size={26} />, label: 'Speed' },
                ].map(({ icon, label }, i) => (
                  <motion.div
                    key={label}
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', delay: 0.9 + i * 0.15 }}
                    style={{
                      background: `${theme.primary}18`, border: `1.5px solid ${theme.primary}44`,
                      borderRadius: '12px', padding: '0.5rem 0.65rem',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem',
                    }}
                  >
                    {icon}
                    <span style={{ fontSize: '0.6rem', color: theme.textLight, fontWeight: 700 }}>{label}</span>
                  </motion.div>
                ))}
              </motion.div>
            </>
          )}

          {/* ── Step 4: Ready! ── */}
          {step === 4 && (
            <>
              <motion.div
                animate={{ rotate: [0, 15, -15, 10, -10, 0], scale: [1, 1.2, 1.1, 1.2, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 2 }}
                style={{ display: 'inline-block', marginBottom: '1rem' }}
              >
                <MSparkle size={76} />
              </motion.div>
              <h2 style={{ fontSize: '1.9rem', fontWeight: 900, color: theme.text, margin: '0 0 0.6rem' }}>
                You're all set!
              </h2>
              <p style={{ color: theme.textLight, lineHeight: 1.6, margin: '0 0 1.5rem' }}>
                Time to create your first deck and start building that streak. You've got this! 🔥
              </p>
              {/* Floating sparkles */}
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  style={{ position: 'absolute', pointerEvents: 'none' }}
                  initial={{ x: (i - 2) * 60, y: 20, opacity: 0, scale: 0.5 }}
                  animate={{ y: -60, opacity: [0, 1, 0], scale: [0.5, 1, 0.3] }}
                  transition={{ duration: 1.6, delay: i * 0.2, repeat: Infinity, repeatDelay: 1.5 }}
                >
                  <MGlowStar size={16 + i * 4} />
                </motion.div>
              ))}
            </>
          )}

          {/* Next / CTA button */}
          <motion.button
            onClick={next}
            disabled={!canNext}
            whileHover={canNext ? { scale: 1.04 } : {}}
            whileTap={canNext ? { scale: 0.96 } : {}}
            style={{
              width: '100%',
              padding: '0.85rem',
              background: canNext
                ? `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`
                : `${theme.primary}33`,
              color: canNext ? '#fff' : theme.textLight,
              border: 'none',
              borderRadius: '14px',
              fontWeight: 900,
              fontSize: '1rem',
              cursor: canNext ? 'pointer' : 'not-allowed',
              letterSpacing: '0.02em',
              transition: 'opacity 0.2s',
            }}
          >
            {step === 0 && "Let's go →"}
            {step === 1 && 'Next →'}
            {step === 2 && (rated ? 'Next →' : 'Rate the card to continue')}
            {step === 3 && 'Next →'}
            {step === 4 && '🚀 Create my first deck'}
          </motion.button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default OnboardingTour;
