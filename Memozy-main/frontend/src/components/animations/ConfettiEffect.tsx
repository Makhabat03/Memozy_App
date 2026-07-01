import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface ConfettiEffectProps {
  active: boolean;
}

const ConfettiEffect: React.FC<ConfettiEffectProps> = ({ active }) => {
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const particlesRef  = useRef<any[]>([]);
  const animRef       = useRef<number>(0);
  const { theme }     = useTheme();

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = [theme.primary, theme.secondary, theme.accent, '#fbbf24', '#ffffff', '#f472b6'];

    particlesRef.current = Array.from({ length: 150 }, () => {
      const shape = Math.random();
      return {
        x:    Math.random() * canvas.width,
        y:    -20,
        w:    7 + Math.random() * 10,
        h:    4 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx:   (Math.random() - 0.5) * 5,
        vy:   2 + Math.random() * 5.5,
        rot:  Math.random() * 360,
        rotV: (Math.random() - 0.5) * 11,
        shape: shape < 0.4 ? 'rect' : shape < 0.75 ? 'circle' : 'diamond',
      };
    });

    let frame = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const alpha = Math.max(0, 1 - frame / 195);
      ctx.globalAlpha = alpha;

      for (const p of particlesRef.current) {
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += 0.12;
        p.rot += p.rotV;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'diamond') {
          const r = p.w / 2;
          ctx.beginPath();
          ctx.moveTo(0, -r); ctx.lineTo(r, 0);
          ctx.lineTo(0, r);  ctx.lineTo(-r, 0);
          ctx.closePath(); ctx.fill();
        } else {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }
        ctx.restore();
      }

      frame++;
      if (frame < 210) animRef.current = requestAnimationFrame(animate);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [active]); // eslint-disable-line

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }}
    />
  );
};

export default ConfettiEffect;
