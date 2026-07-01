import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  color: string;
  rotation: number;
  rotSpeed: number;
  type: 'circle' | 'star';
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const outerAngle = (i * Math.PI * 2) / 5 - Math.PI / 2;
    const innerAngle = outerAngle + Math.PI / 5;
    if (i === 0) ctx.moveTo(Math.cos(outerAngle) * size, Math.sin(outerAngle) * size);
    else ctx.lineTo(Math.cos(outerAngle) * size, Math.sin(outerAngle) * size);
    ctx.lineTo(Math.cos(innerAngle) * size * 0.45, Math.sin(innerAngle) * size * 0.45);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

const CursorEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const mouseRef = useRef({ x: -200, y: -200, prevX: -200, prevY: -200 });
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const themeRef = useRef(theme);
  const ringScaleRef = useRef(1);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const onMouseMove = (e: MouseEvent) => {
      const prev = mouseRef.current;
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      mouseRef.current = { x: e.clientX, y: e.clientY, prevX: prev.x, prevY: prev.y };

      const speed = Math.sqrt(dx * dx + dy * dy);
      const count = Math.min(Math.floor(speed / 6) + 1, 4);
      const t = themeRef.current;
      const colors = [t.primary, t.secondary, t.accent];

      if (particlesRef.current.length >= MAX_PARTICLES) return;

      for (let i = 0; i < count; i++) {
        const usestar = Math.random() > 0.5;
        particlesRef.current.push({
          x: e.clientX + (Math.random() - 0.5) * 10,
          y: e.clientY + (Math.random() - 0.5) * 10,
          vx: (Math.random() - 0.5) * 2.5,
          vy: (Math.random() - 0.5) * 2.5 - 0.8,
          alpha: 0.75 + Math.random() * 0.25,
          size: usestar ? 3 + Math.random() * 4 : 2 + Math.random() * 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.15,
          type: usestar ? 'star' : 'circle',
        });
      }

      ringScaleRef.current = Math.min(1 + speed * 0.03, 1.6);
    };

    const onClick = () => {
      const { x, y } = mouseRef.current;
      const t = themeRef.current;
      const colors = [t.primary, t.secondary, t.accent];
      for (let i = 0; i < 18; i++) {
        const angle = (i / 18) * Math.PI * 2;
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * (2 + Math.random() * 3),
          vy: Math.sin(angle) * (2 + Math.random() * 3),
          alpha: 1,
          size: 3 + Math.random() * 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.2,
          type: 'star',
        });
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onClick);

    const MAX_PARTICLES = 60;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current.filter(p => p.alpha > 0.02);

      // Group by color to minimize state changes — shadowBlur set once per color group
      const byColor = new Map<string, Particle[]>();
      for (const p of particlesRef.current) {
        let arr = byColor.get(p.color);
        if (!arr) { arr = []; byColor.set(p.color, arr); }
        arr.push(p);
      }

      ctx.shadowBlur = 8;
      byColor.forEach((group, color) => {
        ctx.shadowColor = color;
        ctx.fillStyle = color;
        for (const p of group) {
          ctx.globalAlpha = p.alpha;
          if (p.type === 'star') {
            drawStar(ctx, p.x, p.y, p.size, p.rotation);
          } else {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
          }
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.04;
          p.alpha *= 0.91;
          p.size *= 0.96;
          p.rotation += p.rotSpeed;
        }
      });
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      // cursor ring
      const { x, y } = mouseRef.current;
      if (x > -100) {
        const scale = ringScaleRef.current;
        ringScaleRef.current += (1 - ringScaleRef.current) * 0.15;

        ctx.save();
        ctx.strokeStyle = themeRef.current.primary;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.65;
        ctx.shadowColor = themeRef.current.primary;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(x, y, 13 * scale, 0, Math.PI * 2);
        ctx.stroke();

        ctx.globalAlpha = 0.9;
        ctx.fillStyle = themeRef.current.primary;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('click', onClick);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        cursor: 'none',
      }}
    />
  );
};

export default CursorEffect;
