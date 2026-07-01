import { useCallback, useRef, useState } from 'react';

export function useAmbientSound() {
  const [playing, setPlaying] = useState(false);
  const ctxRef    = useRef<AudioContext | null>(null);
  const nodesRef  = useRef<any[]>([]);
  const masterRef = useRef<GainNode | null>(null);

  const start = useCallback(() => {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = ctxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    // Master gain — fades in over 2 s
    const master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(1, ctx.currentTime + 2);
    master.connect(ctx.destination);
    masterRef.current = master;

    // ── Brown noise (warm rain / wind rumble) ──────────────────────────
    const bufSize = 2 * ctx.sampleRate;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufSize; i++) {
      const w = Math.random() * 2 - 1;
      data[i] = (last + 0.02 * w) / 1.02;
      last = data[i];
      data[i] *= 3.5;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;

    const lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = 480;
    lpf.Q.value = 0.4;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.11;

    noise.connect(lpf);
    lpf.connect(noiseGain);
    noiseGain.connect(master);
    noise.start();

    // ── Gentle tonal drones (A-minor overtones, barely audible) ────────
    // A1=55, E2=82, A2=110, C#3=138, E3=165 — naturally calming
    const droneFreqs = [55, 82.41, 110, 138.59, 164.81];
    const droneNodes: any[] = [];
    droneFreqs.forEach((freq, i) => {
      const osc     = ctx.createOscillator();
      const oscGain = ctx.createGain();
      const lfo     = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;
      oscGain.gain.value = Math.max(0.001, 0.016 - i * 0.0028);

      // Very slow LFO tremolo per note so they breathe independently
      lfo.type = 'sine';
      lfo.frequency.value = 0.07 + i * 0.038;
      lfoGain.gain.value = 0.005;

      lfo.connect(lfoGain);
      lfoGain.connect(oscGain.gain);
      osc.connect(oscGain);
      oscGain.connect(master);

      lfo.start();
      osc.start();
      droneNodes.push(osc, lfo);
    });

    // ── Occasional soft high shimmer (sparse, like distant chimes) ─────
    let shimmerTimeout: any;
    const scheduleShimmer = () => {
      const delay = 6000 + Math.random() * 10000; // every 6-16 s
      shimmerTimeout = setTimeout(() => {
        if (!masterRef.current) return;
        const freqs = [1046.5, 1318.5, 1567.98, 2093];
        const f = freqs[Math.floor(Math.random() * freqs.length)];
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(master);
        o.type = 'sine';
        o.frequency.value = f;
        g.gain.setValueAtTime(0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.025, ctx.currentTime + 0.04);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.2);
        o.start(ctx.currentTime);
        o.stop(ctx.currentTime + 2.3);
        scheduleShimmer();
      }, delay);
    };
    scheduleShimmer();

    nodesRef.current = [noise, ...droneNodes, { _timeout: shimmerTimeout }];
    setPlaying(true);
  }, []);

  const stop = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx || !masterRef.current) return;

    // Fade out over 1.5 s then disconnect everything
    const master = masterRef.current;
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);

    setTimeout(() => {
      nodesRef.current.forEach(n => {
        if (n._timeout) { clearTimeout(n._timeout); return; }
        try { n.stop?.(); } catch {}
        try { n.disconnect?.(); } catch {}
      });
      nodesRef.current = [];
      try { master.disconnect(); } catch {}
      masterRef.current = null;
    }, 1600);

    setPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (playing) stop(); else start();
  }, [playing, start, stop]);

  return { playing, toggle };
}
