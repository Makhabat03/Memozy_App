import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTour } from '../context/TourContext';

const PADDING = 10;
const TOOLTIP_W = 330;

const TourOverlay: React.FC = () => {
  const { isActive, step, total, steps, nextStep, prevStep, endTour } = useTour();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location   = useLocation();
  const [rect, setRect] = useState<DOMRect | null>(null);

  const current = steps[step] ?? steps[0];

  // Find the target element, with retry for pages still loading
  const findTarget = useCallback(() => {
    if (!current?.target) { setRect(null); return; }
    let tries = 0;
    const poll = () => {
      const el = document.querySelector(`[data-tour="${current.target}"]`) as HTMLElement | null;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => setRect(el.getBoundingClientRect()), 380);
      } else if (tries++ < 50) {
        setTimeout(poll, 200);
      } else {
        setRect(null); // fall back to centered modal
      }
    };
    setTimeout(poll, 400);
  }, [current?.target]);

  // Navigate if needed, then find target
  useEffect(() => {
    if (!isActive || !current) return;
    if (location.pathname !== current.route) {
      navigate('/some-route');
      return; // re-triggers when pathname updates
    }
    findTarget();
  }, [isActive, step, location.pathname]); // eslint-disable-line

  // Re-measure on resize/scroll
  useEffect(() => {
    if (!isActive || !current?.target) return;
    const update = () => {
      const el = document.querySelector(`[data-tour="${current.target}"]`) as HTMLElement | null;
      if (el) setRect(el.getBoundingClientRect());
    };
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [isActive, step, current?.target]);

  const handleNext = () => {
    if (step === total - 1) {
      endTour();
      navigate('/create');
    } else {
      nextStep();
    }
  };

  if (!isActive || !current) return null;

  const hasSpotlight = rect !== null && current.target !== null;

  // ── Tooltip position ────────────────────────────────────────────────
  const tooltipStyle = (): React.CSSProperties => {
    if (!hasSpotlight) return {};
    const GAP = 14;
    const vw  = window.innerWidth;
    const vh  = window.innerHeight;
    const r   = rect!;
    const clampX = (x: number) => Math.max(8, Math.min(vw - TOOLTIP_W - 8, x));

    switch (current.placement) {
      case 'bottom': return { top:  r.bottom + PADDING + GAP, left: clampX(r.left + r.width / 2 - TOOLTIP_W / 2) };
      case 'top':    return { top:  Math.max(8, r.top - PADDING - GAP - 220), left: clampX(r.left + r.width / 2 - TOOLTIP_W / 2) };
      case 'right':  return { top:  Math.max(8, Math.min(vh - 260, r.top + r.height / 2 - 110)), left: Math.min(vw - TOOLTIP_W - 8, r.right + PADDING + GAP) };
      case 'left':   return { top:  Math.max(8, Math.min(vh - 260, r.top + r.height / 2 - 110)), right: vw - r.left + PADDING + GAP };
      default:       return {};
    }
  };

  const isCenter = !hasSpotlight;
  const progress = ((step + 1) / total) * 100;

  return (
    <>
      {/* ── Spotlight hole ── */}
      {hasSpotlight && (
        <motion.div
          style={{
            position: 'fixed', zIndex: 8999, borderRadius: 10, pointerEvents: 'none',
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.70)',
            border: `2px solid ${theme.primary}99`,
          }}
          animate={{
            left:   rect!.left  - PADDING,
            top:    rect!.top   - PADDING,
            width:  rect!.width  + PADDING * 2,
            height: rect!.height + PADDING * 2,
          }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        />
      )}

      {/* ── Full-screen dim (center steps) ── */}
      {isCenter && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, zIndex: 8998, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(5px)' }}
        />
      )}

      {/* ── Tooltip / Modal ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.93, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: -10 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          style={{
            position: 'fixed',
            zIndex: 9000,
            width: isCenter ? Math.min(440, window.innerWidth - 32) : TOOLTIP_W,
            background: theme.card,
            borderRadius: '20px',
            boxShadow: `0 24px 64px rgba(0,0,0,0.55), 0 0 0 1.5px ${theme.primary}44`,
            padding: '1.5rem 1.5rem 1.25rem',
            fontFamily: theme.font,
            ...(isCenter
              ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
              : { ...tooltipStyle() }),
          }}
        >
          {/* Close */}
          <button
            onClick={endTour}
            style={{
              position: 'absolute', top: '0.8rem', right: '0.9rem',
              background: 'none', border: 'none', cursor: 'pointer',
              color: theme.textLight, fontSize: '1rem', opacity: 0.55,
              padding: '0.2rem 0.4rem', borderRadius: '6px',
              fontFamily: theme.font,
            }}
          >
            ✕
          </button>

          {/* Center-step emoji */}
          {isCenter && current.emoji && (
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.12, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2 }}
              style={{ textAlign: 'center', fontSize: '2.8rem', marginBottom: '0.6rem' }}
            >
              {current.emoji}
            </motion.div>
          )}

          {/* Title */}
          <div style={{
            fontWeight: 900,
            fontSize: isCenter ? '1.35rem' : '0.97rem',
            color: theme.text,
            marginBottom: '0.45rem',
            paddingRight: '1.5rem',
            textAlign: isCenter ? 'center' : 'left',
          }}>
            {current.title}
          </div>

          {/* Description */}
          <div style={{
            fontSize: '0.875rem',
            color: theme.textLight,
            lineHeight: 1.65,
            marginBottom: '1.1rem',
            textAlign: isCenter ? 'center' : 'left',
          }}>
            {current.desc}
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: theme.textLight, marginBottom: '0.25rem', opacity: 0.7 }}>
              <span>{t('tourStepLabel')} {step + 1} {t('tourOfLabel')} {total}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div style={{ background: `${theme.primary}22`, borderRadius: 999, height: 4, overflow: 'hidden' }}>
              <motion.div
                animate={{ width: `${progress}%` }}
                transition={{ type: 'spring', stiffness: 180, damping: 22 }}
                style={{ height: '100%', background: `linear-gradient(90deg, ${theme.primary}, ${theme.secondary})`, borderRadius: 999 }}
              />
            </div>
          </div>

          {/* Navigation buttons */}
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            {step > 0 && (
              <button
                onClick={prevStep}
                style={{
                  flex: 1, padding: '0.6rem 0.5rem',
                  background: `${theme.primary}12`,
                  border: `1.5px solid ${theme.primary}33`,
                  borderRadius: '10px', cursor: 'pointer',
                  color: theme.textLight, fontWeight: 700, fontSize: '0.85rem',
                  fontFamily: theme.font, transition: 'all 0.15s',
                }}
              >
                {t('tourBackBtn')}
              </button>
            )}
            <button
              onClick={handleNext}
              style={{
                flex: 2, padding: '0.65rem 0.5rem',
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                border: 'none', borderRadius: '10px', cursor: 'pointer',
                color: '#fff', fontWeight: 900, fontSize: '0.9rem',
                fontFamily: theme.font,
              }}
            >
              {step === total - 1 ? t('tourFinishBtn') : t('tourNextBtn')}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
};

export default TourOverlay;
