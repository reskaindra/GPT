// Triage pictograms. Unit = body height, origin = hip, faces +x, y down.
// Standing feet sit at y ≈ +0.45. u = beats since the shot started (120 BPM).
// C = { fg, far, acc, line, bg } (see colorsFor in scenes.js).
window.POSES = {};
(function () {
  const G = window.G, P = window.POSES;
  const FEET = 0.45;
  G.FEET = FEET;

  // ── standing in the queue ──
  // 01: plaster on the knee
  P.knee = {
    keys: [
      { b: 0, torso: 2, head: 4, aR1: 6, aR2: 10, aL1: -6, aL2: -4, lR1: 8, lR2: 8, lL1: -4, lL2: -4 },
      { b: 2, torso: 4, head: 8, aR1: 10, aR2: 16, aL1: -8, aL2: -6, lR1: 8, lR2: 8, lL1: -4, lL2: -4 },
    ], loop: 4,
    front: (ctx, J, u, C) => band(ctx, J.lR, 0.55, C.mark),
  };
  // 02: forearm in a sling
  P.sling = {
    keys: [
      { b: 0, torso: 6, head: 14, aR1: 22, aR2: 92, aL1: 34, aL2: 118, lR1: 4, lL1: -4 },
      { b: 2, torso: 9, head: 18, aR1: 24, aR2: 94, aL1: 36, aL2: 120, lR1: 4, lL1: -4 },
    ], loop: 4,
    front: (ctx, J, u, C) => {
      const [s, e, h] = J.aR;
      G.poly(ctx, [[J.neck[0] - 0.02, J.neck[1] - 0.01], [e[0] - 0.01, e[1] + 0.03], [h[0] + 0.03, h[1] + 0.03]], C.acc);
      zig(ctx, e, h, C.mark);
    },
  };
  // 03: looking at a phone
  P.phone = {
    keys: [
      { b: 0, torso: 3, head: 22, aR1: 26, aR2: 150, aL1: 16, aL2: 130, lR1: 3, lL1: -6 },
      { b: 3, torso: 3, head: 26, aR1: 28, aR2: 152, aL1: 16, aL2: 132, lR1: 3, lL1: -6 },
    ], loop: 6,
    front: (ctx, J, u, C) => {
      const h = J.aR[2];
      ctx.save(); ctx.translate(h[0] + 0.01, h[1] - 0.03); ctx.rotate(-0.5);
      ctx.fillStyle = C.mark; ctx.fillRect(-0.025, -0.045, 0.05, 0.09); ctx.restore();
    },
  };
  // 04: hand on the chest, swaying
  P.chest = {
    keys: [
      { b: 0, torso: 12, head: 16, aR1: 42, aR2: 200, aL1: 28, aL2: 40, lR1: 10, lR2: 6, lL1: -8, lL2: -12 },
      { b: 1, torso: 22, head: 24, aR1: 46, aR2: 204, aL1: 34, aL2: 52, lR1: 12, lR2: 2, lL1: -10, lL2: -16, e: 'io3' },
    ], loop: 2,
    back: (ctx, J, u, C) => {
      // pain rings from the chest, one per beat
      const c = [J.sho[0] + 0.06, J.sho[1] + 0.06];
      for (let i = 0; i < 2; i++) {
        const k = ((u + i * 0.5) % 1);
        ctx.save(); ctx.globalAlpha *= (1 - k) * 0.9;
        G.ring(ctx, c[0], c[1], 0.05 + k * 0.16, 0.014, C.acc); ctx.restore();
      }
    },
  };

  // ── chapter figures ──
  // MERAH: collapsed on the floor, monitor trace racing above
  P.down = {
    pose: (u) => ({ rot: 90, y: FEET - 0.075, x: 0.05, torso: 0, head: -6 + 3 * Math.sin(u * Math.PI),
      aR1: -70 - 4 * Math.sin(u * Math.PI), aR2: -112, aL1: -4, aL2: -2, lR1: -2, lR2: -2, lL1: -10, lL2: -4 }),
    back: (ctx, J, u, C) => ecg(ctx, u, C, -0.48, 0.62, -0.17, 2.0),
  };
  // KUNING: sling, seated on a stool
  P.seat = {
    keys: [
      { b: 0, torso: 8, head: 16, y: 0.08, aR1: 22, aR2: 92, aL1: 34, aL2: 118, lR1: 84, lR2: 10, lL1: 76, lL2: 4 },
      { b: 2, torso: 12, head: 20, y: 0.08, aR1: 24, aR2: 94, aL1: 36, aL2: 120, lR1: 84, lR2: 10, lL1: 76, lL2: 4 },
    ], loop: 4,
    back: (ctx, J, u, C) => {
      ctx.fillStyle = C.far; ctx.fillRect(-0.16, 0.12, 0.3, 0.045); ctx.fillRect(-0.12, 0.16, 0.04, 0.29); ctx.fillRect(0.06, 0.16, 0.04, 0.29);
    },
    front: (ctx, J, u, C) => P.sling.front(ctx, J, u, C),
  };
  // HIJAU: walking in on its own, small limp, plaster on the knee
  P.walk = {
    pose: (u) => {
      const ph = u / 2, p = G.walkCycle(ph, 0.85);
      const limp = Math.max(0, Math.sin(ph * Math.PI * 2));
      return Object.assign(p, { torso: 6 + limp * 5, y: p.y + limp * 0.012, head: 4 });
    },
    front: (ctx, J, u, C) => band(ctx, J.lR, 0.55, C.mark),
  };
  // HITAM: lying still under a sheet, flat trace
  P.still = {
    pose: () => ({ rot: 90, y: FEET - 0.075, x: 0.05, torso: 0, head: -4, aR1: -2, aR2: -2, aL1: -2, aL2: -2, lR1: -2, lR2: -2, lL1: -2, lL2: -2 }),
    front: (ctx, J, u, C) => {
      // sheet up to the shoulders
      ctx.fillStyle = C.sheet; const y = J.hip[1];
      rr(ctx, -0.5, y - 0.085, J.sho[0] + 0.53, 0.15, 0.06); ctx.fill();
    },
    back: (ctx, J, u, C) => ecg(ctx, u, C, -0.48, 0.62, -0.17, 0),
  };
  // nurse pushing the stretcher (rush shot); the patient is drawn by the scene
  P.nurse = {
    pose: (u) => Object.assign(G.runCycle(u / 1, 1, { lean: 20 }), { aR1: 78, aR2: 84, aL1: 70, aL2: 78 }),
  };

  // ── helpers ──
  function band(ctx, L, t, col) {
    const [hip, k, f] = L; const p = [G.lerp(k[0], f[0], 0.18), G.lerp(k[1], f[1], 0.18)];
    const a = Math.atan2(f[1] - k[1], f[0] - k[0]);
    ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(a); ctx.fillStyle = col; ctx.fillRect(-0.025, -0.05, 0.05, 0.1); ctx.restore();
  }
  function zig(ctx, a, b, col) {
    const m = [G.lerp(a[0], b[0], 0.5), G.lerp(a[1], b[1], 0.5)];
    ctx.strokeStyle = col; ctx.lineWidth = 0.014; ctx.lineJoin = 'round'; ctx.beginPath();
    ctx.moveTo(m[0] - 0.012, m[1] - 0.05); ctx.lineTo(m[0] + 0.014, m[1] - 0.012); ctx.lineTo(m[0] - 0.014, m[1] + 0.012); ctx.lineTo(m[0] + 0.012, m[1] + 0.05);
    ctx.stroke();
  }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
  // monitor trace: x0..x1 at height y; amp 0 = flat line; the bright dot runs one sweep per 2 beats
  function ecg(ctx, u, C, x0, x1, y, amp) {
    const w = x1 - x0, head = ((u / 2) % 1);
    const f = (q) => { // one heartbeat per 1/2 sweep
      const k = (q * 2) % 1;
      if (amp === 0) return 0;
      if (k < 0.30) return 0;
      if (k < 0.34) return -0.02 * amp;
      if (k < 0.37) return 0.03 * amp;
      if (k < 0.40) return -0.11 * amp;
      if (k < 0.43) return 0.05 * amp;
      if (k < 0.60) return 0;
      if (k < 0.70) return -0.022 * amp * Math.sin((k - 0.6) / 0.1 * Math.PI);
      return 0;
    };
    ctx.save(); ctx.lineWidth = 0.016; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const N = 120;
    for (let pass = 0; pass < 2; pass++) {
      ctx.strokeStyle = pass ? C.acc : C.line; ctx.beginPath();
      let started = false;
      for (let i = 0; i <= N; i++) {
        const q = i / N;
        const drawn = pass ? (q <= head && q > head - 0.55) : (q > head || q <= head - 0.55);
        if (!drawn) { started = false; continue; }
        const x = x0 + q * w, yy = y + f(q);
        if (!started) { ctx.moveTo(x, yy); started = true; } else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    G.disc(ctx, x0 + head * w, y + f(head), 0.022, C.acc);
    ctx.restore();
  }
  G.ecg = ecg;
})();
