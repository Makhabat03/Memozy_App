import React from 'react';

interface Props {
  size?: number;
  style?: React.CSSProperties;
}

// ── 🔥 Flame — streaks, fire, heat ─────────────────────────────────────────
export const MFlame: React.FC<Props> = ({ size = 28, style }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={style}>
    <path d="M16 2C20 8 24 12.5 24 18C24 23.5 20.5 28 16 28C11.5 28 8 23.5 8 18C8 12.5 12 8 16 2Z" fill="#f97316"/>
    <path d="M16 10C18.5 14 20 16.5 20 19.5C20 23 18.2 26.5 16 27.5C13.8 26.5 12 23 12 19.5C12 16.5 13.5 14 16 10Z" fill="#fbbf24"/>
    <path d="M16 18C17 19.5 18 21.5 18 23C18 25 17.1 26.5 16 27C14.9 26.5 14 25 14 23C14 21.5 15 19.5 16 18Z" fill="#fef9c3"/>
  </svg>
);

// ── 🌟 Glow Star — flawless, achievements ──────────────────────────────────
export const MGlowStar: React.FC<Props> = ({ size = 28, style }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={style}>
    <circle cx="16" cy="16" r="11" fill="#fbbf24" opacity="0.18"/>
    <path d="M16 2L19 13L30 16L19 19L16 30L13 19L2 16L13 13Z" fill="#fbbf24"/>
    <path d="M16 9L18.2 14.8L24 16L18.2 17.2L16 23L13.8 17.2L8 16L13.8 14.8Z" fill="#fef3c7"/>
    <circle cx="26.5" cy="7.5" r="1.5" fill="#fbbf24" opacity="0.75"/>
    <circle cx="5.5" cy="24" r="1" fill="#fbbf24" opacity="0.5"/>
    <circle cx="25" cy="26" r="1" fill="#fbbf24" opacity="0.45"/>
  </svg>
);

// ── ⭐ Star filled — deck rating ────────────────────────────────────────────
export const MStar: React.FC<Props> = ({ size = 28, style }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={style}>
    <path d="M16 2L19 13L30 16L19 19L16 30L13 19L2 16L13 13Z" fill="#fbbf24"/>
    <path d="M16 9L18.2 14.8L24 16L18.2 17.2L16 23L13.8 17.2L8 16L13.8 14.8Z" fill="#fef3c7"/>
  </svg>
);

// ── ☆ Star empty — unfilled rating slot ────────────────────────────────────
export const MStarEmpty: React.FC<Props> = ({ size = 28, style }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={style}>
    <path d="M16 2L19 13L30 16L19 19L16 30L13 19L2 16L13 13Z" stroke="#94a3b8" strokeWidth="1.5" strokeLinejoin="round" opacity="0.5"/>
  </svg>
);

// ── ✨ Sparkle — easy/correct/celebrate ────────────────────────────────────
export const MSparkle: React.FC<Props> = ({ size = 28, style }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={style}>
    <path d="M16 1L17.5 14.5L31 16L17.5 17.5L16 31L14.5 17.5L1 16L14.5 14.5Z" fill="#a78bfa"/>
    <path d="M25 5L25.8 8.2L29 9L25.8 9.8L25 13L24.2 9.8L21 9L24.2 8.2Z" fill="#c4b5fd"/>
    <path d="M6.5 20L7 22L9 22.5L7 23L6.5 25L6 23L4 22.5L6 22Z" fill="#ddd6fe"/>
  </svg>
);

// ── 👍 Thumb Up — good rating ──────────────────────────────────────────────
export const MThumbUp: React.FC<Props> = ({ size = 28, style }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={style}>
    <path d="M15 4C15 4 14 12 14 15L9 15L9 28L22 28C23.1 28 24 27.1 24 26L24 17C24 15.9 23.1 15 22 15L18 15C18 15 20.5 8 18.5 4.5C17 2 15 4 15 4Z" fill="#6366f1"/>
    <rect x="6" y="15" width="5" height="13" rx="2" fill="#4f46e5"/>
    <line x1="14" y1="19" x2="23" y2="19" stroke="#a5b4fc" strokeWidth="1.2" opacity="0.5" strokeLinecap="round"/>
    <line x1="14" y1="22.5" x2="23" y2="22.5" stroke="#a5b4fc" strokeWidth="1.2" opacity="0.35" strokeLinecap="round"/>
    <line x1="14" y1="26" x2="21" y2="26" stroke="#a5b4fc" strokeWidth="1.2" opacity="0.25" strokeLinecap="round"/>
  </svg>
);

// ── 😤 Hard face — difficult/challenging ───────────────────────────────────
export const MHardFace: React.FC<Props> = ({ size = 28, style }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={style}>
    <circle cx="16" cy="16" r="13" fill="#ef4444"/>
    <circle cx="16" cy="16" r="13" fill="url(#hardgrad)"/>
    <defs>
      <radialGradient id="hardgrad" cx="40%" cy="35%" r="60%">
        <stop offset="0%" stopColor="#f87171"/>
        <stop offset="100%" stopColor="#dc2626"/>
      </radialGradient>
    </defs>
    <path d="M8 11L13.5 13.5" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M24 11L18.5 13.5" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    <ellipse cx="12" cy="16.5" rx="2.2" ry="2" fill="white"/>
    <ellipse cx="20" cy="16.5" rx="2.2" ry="2" fill="white"/>
    <circle cx="12.6" cy="16.5" r="1.1" fill="#7f1d1d"/>
    <circle cx="20.6" cy="16.5" r="1.1" fill="#7f1d1d"/>
    <path d="M11 22.5Q16 20.5 21 22.5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M3.5 8Q4.5 6.2 5.5 8Q6.5 6.2 7.5 8" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <path d="M24.5 8Q25.5 6.2 26.5 8Q27.5 6.2 28.5 8" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
  </svg>
);

// ── ⚡ Lightning bolt — energy, loading, combo ─────────────────────────────
export const MBolt: React.FC<Props> = ({ size = 28, style }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={style}>
    <path d="M20 2L10 17H17L13 30L24 13H17Z" fill="#facc15" opacity="0.2" transform="scale(1.1) translate(-1.5 -1.5)"/>
    <path d="M20 2L10 17H17L13 30L24 13H17Z" fill="#facc15"/>
    <path d="M19.5 4.5L14 15H18.5L15.5 25.5L21 15H16.5L19.5 4.5Z" fill="#fef9c3" opacity="0.55"/>
  </svg>
);

// ── 💥 Burst — combos, unstoppable ─────────────────────────────────────────
export const MBurst: React.FC<Props> = ({ size = 28, style }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={style}>
    <path
      d="M29 16L22.5 13.3L25.2 6.8L18.7 9.5L16 3L13.3 9.5L6.8 6.8L9.5 13.3L3 16L9.5 18.7L6.8 25.2L13.3 22.5L16 29L18.7 22.5L25.2 25.2L22.5 18.7Z"
      fill="#f97316"
    />
    <ellipse cx="16" cy="16" rx="6" ry="6" fill="#fbbf24"/>
    <ellipse cx="14.5" cy="14.5" rx="2.5" ry="2.5" fill="#fef9c3" opacity="0.75"/>
  </svg>
);

// ── 💪 Flex — great work, strength ─────────────────────────────────────────
export const MFlex: React.FC<Props> = ({ size = 28, style }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={style}>
    <path d="M8 26C8 26 7 21 9 17C11 13.5 13.5 12.5 15 12.5L18 6.5C18 6.5 19.5 4 22 4.5C24.5 5 25 8 23.5 10.5L22 13.5C22 13.5 24 15.5 24 18C24 21 22 24.5 19.5 25.5C17 26.5 8 26 8 26Z" fill="#22c55e"/>
    <path d="M20.5 6.5C22 7 23.5 9 23.5 11.5C23.5 13 23 14.5 22 15L21 13.5C21 13.5 22 12 22 11C22 9.5 21 8 19.5 7.5L20.5 6.5Z" fill="#86efac" opacity="0.6"/>
    <path d="M8 26L9.5 30H20C21.1 30 22 29.1 22 28V25.5C22 25.5 16 26.5 8 26Z" fill="#16a34a"/>
  </svg>
);

// ── 📚 Card stack — keep going, decks ──────────────────────────────────────
export const MCards: React.FC<Props> = ({ size = 28, style }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={style}>
    <rect x="8" y="3" width="20" height="14" rx="2.5" fill="#818cf8" opacity="0.45" transform="rotate(-7 8 3)"/>
    <rect x="7" y="7" width="20" height="14" rx="2.5" fill="#6366f1" opacity="0.7" transform="rotate(3.5 7 7)"/>
    <rect x="5" y="12" width="20" height="14" rx="2.5" fill="#4f46e5"/>
    <rect x="8" y="16.5" width="11" height="2" rx="1" fill="#a5b4fc" opacity="0.6"/>
    <rect x="8" y="20" width="8" height="2" rx="1" fill="#a5b4fc" opacity="0.4"/>
  </svg>
);

// ── ❤️ Heart — streak / life ───────────────────────────────────────────────
export const MHeart: React.FC<Props & { filled?: boolean; color?: string }> = ({
  size = 28,
  filled = true,
  color = '#f43f5e',
  style,
}) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={style}>
    {filled ? (
      <>
        <path
          d="M16 27C16 27 3 19 3 11C3 6.5 6.5 3 11 3C13.5 3 15.5 4.5 16 7C16.5 4.5 18.5 3 21 3C25.5 3 29 6.5 29 11C29 19 16 27 16 27Z"
          fill={color}
        />
        <path
          d="M11 6C8.5 6 7 8 7 10C7 11 7.5 12 8.5 13"
          stroke="rgba(255,255,255,0.45)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </>
    ) : (
      <path
        d="M16 27C16 27 3 19 3 11C3 6.5 6.5 3 11 3C13.5 3 15.5 4.5 16 7C16.5 4.5 18.5 3 21 3C25.5 3 29 6.5 29 11C29 19 16 27 16 27Z"
        stroke={color}
        strokeWidth="2"
        opacity="0.35"
      />
    )}
  </svg>
);

// ── 👋 Wave — greeting ─────────────────────────────────────────────────────
export const MWave: React.FC<Props> = ({ size = 28, style }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={style}>
    <rect x="10" y="17" width="14" height="12" rx="3" fill="#fbbf24"/>
    <rect x="9.5" y="9" width="3.5" height="11" rx="1.75" fill="#fbbf24"/>
    <rect x="14" y="7" width="3.5" height="12" rx="1.75" fill="#fbbf24"/>
    <rect x="18.5" y="8" width="3.5" height="11" rx="1.75" fill="#fbbf24"/>
    <rect x="23" y="10.5" width="3" height="9" rx="1.5" fill="#fbbf24"/>
    <ellipse cx="8.5" cy="18" rx="2.5" ry="3.5" fill="#fbbf24" transform="rotate(-25 8.5 18)"/>
    <path d="M3.5 7.5C4.5 5.5 6.5 5 7.5 6" stroke="#fde68a" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
    <path d="M2.5 12C3.5 10 5.5 10 6 11.5" stroke="#fde68a" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
  </svg>
);
