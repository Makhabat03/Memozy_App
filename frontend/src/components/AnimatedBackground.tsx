import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

const AnimatedBackground: React.FC = () => {
  const { themeName } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let particles: any[] = [];
    let W = window.innerWidth;
    let H = window.innerHeight;
    let t = 0;

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
      gridCanvas = null;
      if (themeName === 'darkFuturistic') buildGrid();
      init();
    };

    // ── DARK FUTURISTIC ── neural network with 3D perspective ──
    let gridCanvas: HTMLCanvasElement | null = null;
    const buildGrid = () => {
      gridCanvas = document.createElement('canvas');
      gridCanvas.width = W; gridCanvas.height = H;
      const gc = gridCanvas.getContext('2d')!;
      gc.strokeStyle = 'rgba(0,255,231,0.05)';
      gc.lineWidth = 1;
      for (let x = 0; x < W; x += 60) { gc.beginPath(); gc.moveTo(x, 0); gc.lineTo(x, H); gc.stroke(); }
      for (let y = 0; y < H; y += 60) { gc.beginPath(); gc.moveTo(0, y); gc.lineTo(W, y); gc.stroke(); }
    };

    const initDarkFuturistic = () => {
      buildGrid();
      particles = Array.from({ length: 45 }, () => ({
        x: (Math.random() - 0.5) * 1400,
        y: (Math.random() - 0.5) * 900,
        z: Math.random() * 600 + 100,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        vz: (Math.random() - 0.5) * 0.3,
      }));
    };

    const drawDarkFuturistic = () => {
      ctx.fillStyle = '#000d0d';
      ctx.fillRect(0, 0, W, H);

      // Draw cached grid
      if (gridCanvas) ctx.drawImage(gridCanvas, 0, 0);

      const FOV = 500;
      const cx = W / 2, cy = H / 2;

      const proj = particles.map((p, i) => {
        p.x += p.vx; p.y += p.vy; p.z += p.vz;
        if (p.z < 50) p.vz = Math.abs(p.vz);
        if (p.z > 800) p.vz = -Math.abs(p.vz);
        if (Math.abs(p.x) > 800) p.vx *= -1;
        if (Math.abs(p.y) > 600) p.vy *= -1;
        const scale = FOV / (p.z + FOV);
        // Every ~8th node is a magenta accent node
        const accent = i % 8 === 0;
        return { px: cx + p.x * scale, py: cy + p.y * scale, scale, accent };
      });

      // Lines between close nodes
      for (let i = 0; i < proj.length; i++) {
        for (let j = i + 1; j < proj.length; j++) {
          const dx = proj[i].px - proj[j].px;
          const dy = proj[i].py - proj[j].py;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 140) {
            const a = (1 - d / 140) * 0.35;
            const useMagenta = proj[i].accent || proj[j].accent;
            ctx.beginPath();
            ctx.strokeStyle = useMagenta ? `rgba(255,45,107,${a * 0.7})` : `rgba(0,255,231,${a})`;
            ctx.lineWidth = 0.6;
            ctx.moveTo(proj[i].px, proj[i].py);
            ctx.lineTo(proj[j].px, proj[j].py);
            ctx.stroke();
          }
        }
      }

      // Nodes — avoid createRadialGradient per node; use shadowBlur once
      ctx.shadowBlur = 8;
      proj.forEach(({ px, py, scale, accent }) => {
        const r = Math.max(0.5, scale * 3);
        const color = accent ? `rgba(255,45,107,${0.5 + scale * 0.4})` : `rgba(0,255,231,${0.5 + scale * 0.4})`;
        ctx.shadowColor = accent ? 'rgba(255,45,107,0.6)' : 'rgba(0,255,231,0.6)';
        ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fillStyle = color; ctx.fill();
      });
      ctx.shadowBlur = 0;
    };

    // ── COSMIC ── nebulae + warp stars + twinkling field ──
    const initCosmic = () => {
      const nebulaColors = [
        [226, 184, 255], // lavender
        [251, 191,  36], // gold
        [244, 114, 182], // pink
        [167, 139, 250], // indigo
        [196, 163, 255], // soft purple
      ];
      particles = [
        // Nebula clouds — large drifting glow blobs
        ...Array.from({ length: 5 }, (_, i) => ({
          type: 'nebula',
          x: W * [0.15, 0.72, 0.42, 0.88, 0.28][i],
          y: H * [0.28, 0.62, 0.82, 0.18, 0.68][i],
          r: 180 + i * 55,
          rgb: nebulaColors[i],
          alpha: 0.05 + i * 0.007,
          vx: (Math.random() - 0.5) * 0.12,
          vy: (Math.random() - 0.5) * 0.08,
        })),
        // Twinkling static stars
        ...Array.from({ length: 80 }, () => ({
          type: 'twinkle',
          x: Math.random() * W,
          y: Math.random() * H,
          size: 0.6 + Math.random() * 2,
          baseAlpha: 0.45 + Math.random() * 0.55,
          phase: Math.random() * Math.PI * 2,
          speed: 0.007 + Math.random() * 0.016,
          hue: Math.random() > 0.6 ? 280 : Math.random() > 0.5 ? 260 : 0,
        })),
        // Warp-speed stars
        ...Array.from({ length: 150 }, () => {
          const z = Math.random() * 1200;
          return {
            type: 'warp',
            x: (Math.random() - 0.5) * W * 4,
            y: (Math.random() - 0.5) * H * 4,
            z, pz: z,
            hue: Math.random() > 0.65 ? 280 : Math.random() > 0.5 ? 260 : 0,
          };
        }),
      ];
    };

    const drawCosmic = () => {
      ctx.fillStyle = 'rgba(6,0,15,0.17)';
      ctx.fillRect(0, 0, W, H);

      const cx = W / 2, cy = H / 2;

      particles.forEach(p => {
        if (p.type === 'nebula') {
          p.x += p.vx; p.y += p.vy;
          if (p.x < -p.r) p.x = W + p.r;
          if (p.x > W + p.r) p.x = -p.r;
          if (p.y < -p.r) p.y = H + p.r;
          if (p.y > H + p.r) p.y = -p.r;
          const [r, g, b] = p.rgb;
          const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
          grd.addColorStop(0,   `rgba(${r},${g},${b},${p.alpha})`);
          grd.addColorStop(0.45,`rgba(${r},${g},${b},${p.alpha * 0.45})`);
          grd.addColorStop(1,   `rgba(${r},${g},${b},0)`);
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = grd; ctx.fill();

        } else if (p.type === 'twinkle') {
          p.phase += p.speed;
          const alpha = p.baseAlpha * (0.35 + 0.65 * Math.abs(Math.sin(p.phase)));
          const [r, g, b] = p.hue === 280 ? [226,184,255] : p.hue === 260 ? [251,191,36] : [245,238,255];
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`; ctx.fill();
          // Sparkle cross on bright twinkle peaks
          if (p.size > 1.3 && Math.abs(Math.sin(p.phase)) > 0.88) {
            const arm = p.size * 3.5;
            ctx.strokeStyle = `rgba(${r},${g},${b},${alpha * 0.45})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath(); ctx.moveTo(p.x - arm, p.y); ctx.lineTo(p.x + arm, p.y); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(p.x, p.y - arm); ctx.lineTo(p.x, p.y + arm); ctx.stroke();
          }

        } else {
          // Warp star
          p.pz = p.z;
          p.z -= 5;
          if (p.z <= 1) {
            p.x = (Math.random() - 0.5) * W * 4;
            p.y = (Math.random() - 0.5) * H * 4;
            p.z = 1200; p.pz = 1200;
            p.hue = Math.random() > 0.65 ? 280 : Math.random() > 0.5 ? 260 : 0;
          }
          const sx = (p.x / p.z) * W + cx;
          const sy = (p.y / p.z) * H + cy;
          const px = (p.x / p.pz) * W + cx;
          const py = (p.y / p.pz) * H + cy;
          if (sx < 0 || sx > W || sy < 0 || sy > H) return;

          const size   = Math.max(0.5, (1 - p.z / 1200) * 4.5);
          const bright = 1 - p.z / 1200;
          const [r, g, b] = p.hue === 280 ? [226,184,255] : p.hue === 260 ? [251,191,36] : [245,238,255];

          // Streak trail
          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(sx, sy);
          ctx.lineWidth = size;
          ctx.strokeStyle = `rgba(${r},${g},${b},${bright})`; ctx.stroke();

          // Glowing head for close stars
          if (bright > 0.55) {
            const grd = ctx.createRadialGradient(sx, sy, 0, sx, sy, size * 3);
            grd.addColorStop(0, `rgba(${r},${g},${b},${bright * 0.85})`);
            grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
            ctx.beginPath(); ctx.arc(sx, sy, size * 3, 0, Math.PI * 2);
            ctx.fillStyle = grd; ctx.fill();
          }
        }
      });
    };

    // ── NATURE ── 3D falling leaves ──
    const initNature = () => {
      const colors = ['#15803d', '#16a34a', '#4ade80', '#86efac', '#ca8a04', '#65a30d', '#bef264'];
      particles = Array.from({ length: 50 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        z: Math.random(),
        vy: 0.4 + Math.random() * 1.2,
        angle: Math.random() * Math.PI * 2,
        angleV: (Math.random() - 0.5) * 0.025,
        size: 6 + Math.random() * 14,
        color: colors[Math.floor(Math.random() * colors.length)],
        phase: Math.random() * Math.PI * 2,
        swaySpeed: 0.0006 + Math.random() * 0.0006,
      }));
    };

    const drawNature = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.y += p.vy * (0.5 + p.z * 0.7);
        p.x += Math.sin(t * p.swaySpeed + p.phase) * 1.2;
        p.angle += p.angleV;
        if (p.y > H + 30) { p.y = -20; p.x = Math.random() * W; }

        const s = p.size * (0.4 + p.z * 0.7);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.globalAlpha = 0.3 + p.z * 0.55;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        // Leaf: two bezier curves
        ctx.moveTo(0, -s);
        ctx.bezierCurveTo(s * 0.8, -s * 0.5, s * 0.8, s * 0.5, 0, s);
        ctx.bezierCurveTo(-s * 0.8, s * 0.5, -s * 0.8, -s * 0.5, 0, -s);
        ctx.fill();
        // Vein
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(0, s); ctx.stroke();
        ctx.restore();
        ctx.globalAlpha = 1;
      });
    };

    const initAnime = () => {
      const petalColors = ['#f9a8d4', '#f472b6', '#fce7f3', '#e879f9', '#fbcfe8', '#ffffff', '#ddd6fe'];
      particles = [
        ...Array.from({ length: 60 }, () => ({
          type: 'petal',
          x: Math.random() * W,
          y: Math.random() * H,
          vy: 0.3 + Math.random() * 0.9,
          angle: Math.random() * Math.PI * 2,
          angleV: (Math.random() - 0.5) * 0.028,
          size: 5 + Math.random() * 10,
          color: petalColors[Math.floor(Math.random() * petalColors.length)],
          phase: Math.random() * Math.PI * 2,
          opacity: 0.35 + Math.random() * 0.45,
          z: Math.random(),
        })),
        ...Array.from({ length: 5 }, (_, i) => ({
          type: 'orb',
          x: W * (0.1 + i * 0.2),
          y: H * (0.3 + Math.sin(i * 1.3) * 0.25),
          r: 160 + Math.random() * 200,
          color: ['rgba(249,168,212,0.18)', 'rgba(232,121,249,0.14)', 'rgba(251,207,232,0.2)', 'rgba(167,139,250,0.13)', 'rgba(244,114,182,0.16)'][i],
          phase: Math.random() * Math.PI * 2,
        })),
      ];
    };

    const drawAnime = () => {
      ctx.clearRect(0, 0, W, H);

      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0,   'rgba(253,230,245,0.65)');
      sky.addColorStop(0.5, 'rgba(255,240,252,0.45)');
      sky.addColorStop(1,   'rgba(255,248,254,0.25)');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

      particles.forEach(p => {
        if (p.type === 'orb') {
          const ox = p.x + Math.sin(t * 0.0006 + p.phase) * 25;
          const oy = p.y + Math.cos(t * 0.0005 + p.phase) * 18;
          const grd = ctx.createRadialGradient(ox, oy, 0, ox, oy, p.r);
          grd.addColorStop(0, p.color);
          grd.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.beginPath(); ctx.arc(ox, oy, p.r, 0, Math.PI * 2);
          ctx.fillStyle = grd; ctx.fill();
        } else {
          p.y += p.vy * (0.5 + p.z * 0.6);
          p.x += Math.sin(t * 0.0006 + p.phase) * 1.2;
          p.angle += p.angleV;
          if (p.y > H + 20) { p.y = -20; p.x = Math.random() * W; }
          ctx.save();
          ctx.translate(p.x, p.y); ctx.rotate(p.angle);
          ctx.globalAlpha = p.opacity * (0.5 + p.z * 0.5);
          ctx.fillStyle = p.color;
          for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2;
            ctx.beginPath();
            ctx.ellipse(Math.cos(a) * p.size * 0.5, Math.sin(a) * p.size * 0.5, p.size * 0.38, p.size * 0.22, a, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.beginPath(); ctx.arc(0, 0, p.size * 0.1, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,200,220,0.9)'; ctx.fill();
          ctx.restore(); ctx.globalAlpha = 1;
        }
      });
    };

    // ── MINIMAL ── very subtle floating orbs ──
    const initSubtle = () => {
      const color = '#6366f1';
      particles = Array.from({ length: 40 }, () => ({ // more particles
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        size: 6 + Math.random() * 10,        // bigger
        opacity: 0.15 + Math.random() * 0.15, // more visible
        color,
      }));
    };

    const drawSubtle = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color; ctx.globalAlpha = p.opacity; ctx.fill(); ctx.globalAlpha = 1;
      });
    };

    const init = () => {
      switch (themeName) {
        case 'darkFuturistic': initDarkFuturistic(); break;
        case 'cosmic': initCosmic(); break;
        case 'nature': initNature(); break;
        case 'pink': initAnime(); break;
        default: initSubtle(); break;
      }
    };

    const animate = () => {
      t++;
      switch (themeName) {
        case 'darkFuturistic': drawDarkFuturistic(); break;
        case 'cosmic': drawCosmic(); break;
        case 'nature': drawNature(); break;
        case 'pink': drawAnime(); break;
        default: drawSubtle(); break;
      }
      animId = requestAnimationFrame(animate);
    };

    canvas.width = W;
    canvas.height = H;
    window.addEventListener('resize', resize);
    init();
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [themeName]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    />
  );
};

export default AnimatedBackground;
