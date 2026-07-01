import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

export type GlassVariant = 'primary' | 'outline' | 'danger' | 'ghost';
type GlassSize = 'sm' | 'md' | 'lg';

export interface GlassButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: GlassVariant;
  size?: GlassSize;
  children?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  tintColor?: string;
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const GlassButton: React.FC<GlassButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  loading = false,
  fullWidth = false,
  tintColor,
  style,
  disabled,
  ...props
}) => {
  const { theme } = useTheme();
  const isDisabled = disabled || loading;

  const pad  = { sm: '0.45rem 0.85rem', md: '0.72rem 1.3rem', lg: '0.9rem 1.75rem' }[size];
  const fSize = { sm: '0.82rem', md: '0.92rem', lg: '1.02rem' }[size];

  const base: React.CSSProperties = {
    backdropFilter: 'blur(18px) saturate(1.8)',
    WebkitBackdropFilter: 'blur(18px) saturate(1.8)',
    fontFamily: theme.font,
    fontWeight: 700,
    fontSize: fSize,
    padding: pad,
    borderRadius: theme.borderRadius,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.6 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.45rem',
    transition: 'box-shadow 0.2s, background 0.2s',
    width: fullWidth ? '100%' : undefined,
    position: 'relative',
    overflow: 'hidden',
    userSelect: 'none',
  };

  const color = tintColor ?? theme.primary;
  let variantStyle: React.CSSProperties;

  if (variant === 'primary') {
    variantStyle = {
      background: `linear-gradient(135deg, ${hexToRgba(color, 0.38)} 0%, ${hexToRgba(color, 0.18)} 100%)`,
      border: `1px solid ${hexToRgba(color, 0.52)}`,
      color: '#fff',
      boxShadow: [
        `0 4px 24px ${hexToRgba(color, 0.25)}`,
        `inset 0 1px 0 rgba(255,255,255,0.25)`,
        `inset 0 -1px 0 rgba(0,0,0,0.1)`,
      ].join(', '),
      textShadow: '0 1px 3px rgba(0,0,0,0.35)',
    };
  } else if (variant === 'outline') {
    variantStyle = {
      background: `rgba(255,255,255,0.06)`,
      border: `1px solid ${hexToRgba(color, 0.42)}`,
      color: color,
      boxShadow: [
        `inset 0 1px 0 rgba(255,255,255,0.18)`,
        `inset 0 -1px 0 rgba(0,0,0,0.06)`,
      ].join(', '),
    };
  } else if (variant === 'danger') {
    variantStyle = {
      background: `linear-gradient(135deg, rgba(220,38,38,0.22) 0%, rgba(220,38,38,0.1) 100%)`,
      border: `1px solid rgba(220,38,38,0.38)`,
      color: '#dc2626',
      boxShadow: [
        `0 2px 14px rgba(220,38,38,0.14)`,
        `inset 0 1px 0 rgba(255,255,255,0.18)`,
      ].join(', '),
    };
  } else {
    variantStyle = {
      background: 'transparent',
      border: 'none',
      color: tintColor ?? theme.secondary,
      boxShadow: 'none',
    };
  }

  return (
    <motion.button
      whileHover={!isDisabled ? { scale: 1.035, y: -1 } : undefined}
      whileTap={!isDisabled ? { scale: 0.97 } : undefined}
      disabled={isDisabled}
      style={{ ...base, ...variantStyle, ...style }}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default GlassButton;
