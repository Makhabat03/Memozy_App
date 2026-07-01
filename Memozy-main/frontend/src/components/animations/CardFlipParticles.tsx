import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  trigger: number; // increment each time you want a burst
}

const CardFlipParticles: React.FC<Props> = ({ trigger }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);
  const { theme } = useTheme();

  useEffect(() => {
    if (trigger === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight * 0.37;
    const colors = [theme.primary, theme.secondary, theme.accent];

    const particles = Array.from({ length: 22 }, (_, i) => {
      const angle = (i / 22) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const speed = 3.5 + Math.random() * 6.5;
      return {
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        size: 4 + Math.random() * 5.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0,
        maxLife: 30 + Math.floor(Math.random() * 22),
        rot: Math.random() * Math.PI * 2,
        rotV: (Math.random() - 0.5) * 0.3,
        isSquare: Math.random() > 0.45,
      };
    });

    cancelAnimationFrame(animRef.current);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let any = false;

      for (const p of particles) {
        p.life++;
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += 0.28;
        p.vx *= 0.97;
        p.rot += p.rotV;

        const alpha = Math.max(0, 1 - p.life / p.maxLife);
        if (alpha <= 0) continue;
        any = true;

        const s = p.size * (1 - p.life / p.maxLife * 0.35);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle   = p.color;

        if (p.isSquare) {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillRect(-s / 2, -s / 2, s, s);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, s, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      if (any) animRef.current = requestAnimationFrame(animate);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [trigger]); // eslint-disable-line

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 500 }}
    />
  );
};

export default CardFlipParticles;
