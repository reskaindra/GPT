// Scenes, transitions and HUD for the vertical triage film.
(function () {
  const G = window.G, TL = window.TL, POSES = window.POSES;
  const { W, H, E, clamp, lerp, inv, PAL, mix, rgba, CREAM, INK } = G;
  const MX = 90, COLR = 960;            // text column (right side kept clear of the Reels buttons)
  const GROUND = 1440, BAND_Y = 1600;   // stage ground line, pattern band at the bottom
  const GRIDC = '#ececf0', GREY = '#5b5b66';
  const F = (w, px) => `${w} ${px}px "Inter Tight"`;
  const M = (px) => `500 ${px}px "DM Mono"`;

  // ───────── text, with readcheck collection ─────────
  let COLLECT = null;
  function text(ctx, id, str, x, y, font, col, p, o = {}) {
    if (p <= 0) return 0;
    ctx.save(); ctx.font = font; ctx.letterSpacing = o.ls || '0px';
    const m = ctx.measureText(str); ctx.restore();
    G.maskText(ctx, str, x, y, font, col, p, o);
    if (COLLECT && id) COLLECT.push({ id, text: str, x0: x, y0: y - m.actualBoundingBoxAscent, x1: x + m.width, y1: y + m.actualBoundingBoxDescent });
    return m.width;
  }
  function fit(ctx, str, w, px, maxW, ls = 0) {
    ctx.save(); ctx.font = F(w, px); ctx.letterSpacing = ls + 'px';
    const mw = ctx.measureText(str).width; ctx.restore();
    return mw > maxW ? Math.floor(px * maxW / mw) : px;
  }
  const pin = (t, t0, d = 0.35) => clamp((t - t0) / d);

  // ───────── colours for a figure on a tinted disc ─────────
  function colorsFor(pk, dark) {
    const P = PAL[pk];
    if (dark) return { fg: '#e4e4ea', far: '#8a8a94', acc: PAL.red.t[2], line: '#3a3a44', mark: '#1b1b20', sheet: '#6b6b77', bg: P.t[1] };
    const fg = pk === 'yellow' ? '#5a4100' : P.t[1];
    return { fg, far: mix(fg, '#ffffff', 0.42), acc: pk === 'yellow' ? INK : P.t[2], line: mix(P.t[4], '#ffffff', 0.1), mark: '#ffffff', sheet: P.t[3], bg: P.t[4] };
  }
  const INKC = { fg: INK, far: mix(INK, '#ffffff', 0.45), acc: PAL.red.t[2], line: '#d8d8de', mark: '#ffffff', sheet: '#999', bg: '#fff' };

  function figure(ctx, name, u, C, x, y, U, asm = 1) {
    const def = POSES[name];
    const J = G.joints(def.pose ? def.pose(u) : G.keyPose(def.keys, u, def.loop));
    const draw = (c) => {
      c.save(); c.translate(x, y); c.scale(U, U);
      if (def.back) def.back(c, J, u, C);
      G.drawFigure(c, J, C.fg, C.far);
      if (def.front) def.front(c, J, u, C);
      c.restore();
    };
    if (asm >= 0.999) { draw(ctx); return J; }
    // assembly: horizontal bands slide into register from alternating sides
    const b = bufFig.getContext('2d'); b.setTransform(1, 0, 0, 1, 0, 0); b.clearRect(0, 0, W, H); draw(b);
    const band = Math.max(14, U * 0.09), k = 1 - E.oExp(asm);
    const y0 = y - U * 0.75, y1 = y + U * 0.6;
    for (let yy = y0, j = 0; yy < y1; yy += band, j++) {
      ctx.drawImage(bufFig, 0, yy, W, band, k * (j % 2 ? 1 : -1) * (120 + (j * 37 % 5) * 50), yy, W, band);
    }
    return J;
  }
  const bufFig = G.canvas();

  // ───────── backgrounds ─────────
  function paper(ctx, t, col = '#ffffff', grid = GRIDC, gp = 1) {
    ctx.fillStyle = col; ctx.fillRect(0, 0, W, H);
    if (!grid) return;
    ctx.fillStyle = grid;
    const S = G.CELL;
    for (let i = 1; i * S < W; i++) ctx.fillRect(i * S - 1, 0, 2, H * gp);
    for (let j = 1; j * S < H; j++) ctx.fillRect(0, j * S - 1, W * gp, 2);
  }
  // pattern band along the bottom (decorative, sits under the Reels caption area)
  function band(ctx, pk, t, seed, y = BAND_Y, spread = 1) {
    const pat = G.pattern(pk, seed, { spread, density: 0.55 });
    ctx.save(); ctx.beginPath(); ctx.rect(0, y, W, H - y); ctx.clip();
    const S = G.CELL, beat = t / TL.beat;
    G.drawPattern(ctx, pat, (j) => (j % 2 ? 1 : -1) * ((beat * 0.25) % 1) * S * 0.5 + (j % 2 ? -S * 0.5 : 0), { oy: y - Math.floor(y / S) * S });
    ctx.restore();
  }
  function fullPattern(ctx, pk, t, seed, jump = true) {
    const pat = G.pattern(pk, seed, { spread: 1, density: 0.6 });
    const beat = t / TL.beat, q = jump ? Math.floor(beat) * 0.25 + E.oExp((beat % 1) * 2) * 0.25 : beat * 0.1;
    G.drawPattern(ctx, pat, (j) => (j % 2 ? 1 : -1) * ((q % 1) * G.CELL) * 0.5);
  }

  // ───────── HUD ─────────
  function hud(ctx, left, right, n, t, dark) {
    const c = dark ? '#c9c9d2' : INK;
    ctx.save(); ctx.font = M(30); ctx.letterSpacing = '4px'; ctx.fillStyle = c;
    ctx.textAlign = 'left'; ctx.fillText(left, MX, 262);
    ctx.textAlign = 'right'; ctx.fillText(right, COLR, 262);
    ctx.restore();
    if (n) { // 4 progress ticks
      for (let i = 0; i < 4; i++) {
        const cur = i + 1 === n, done = i + 1 < n;
        ctx.fillStyle = cur ? (dark ? '#ffffff' : INK) : done ? (dark ? '#77777f' : '#9a9aa4') : (dark ? '#3a3a44' : '#dcdce2');
        const h = cur ? 26 : 12; ctx.fillRect(MX + i * 34, 286 + (26 - h), 22, h);
      }
    }
  }
  function ticket(ctx, x, y, label, col, txt, p = 1) {
    if (p <= 0) return;
    ctx.save(); ctx.font = M(30); ctx.letterSpacing = '2px';
    const w = ctx.measureText(label).width + 28, s = E.oBack(p, 2);
    ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(-w / 2, -24, w, 48, 8); ctx.fill();
    ctx.fillStyle = txt; ctx.textAlign = 'center'; ctx.fillText(label, 0, 11);
    ctx.restore();
  }
  function sun(ctx, x, y, r, col, lt) {
    if (r <= 0) return;
    G.disc(ctx, x, y, r, col);
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();
    const sx = x - r * 1.6 + E.o3(inv(0.05, 1.4, lt)) * r * 3.2;
    const g = ctx.createLinearGradient(sx - r * 0.5, y - r, sx + r * 0.5, y + r);
    g.addColorStop(0, rgba('#ffffff', 0)); g.addColorStop(0.5, rgba('#ffffff', 0.22)); g.addColorStop(1, rgba('#ffffff', 0));
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
  }

  // ───────── 1. HOOK: the queue ─────────
  const SLOTS = [210, 420, 630, 840];
  const QU = 300, QHIP = GROUND - G.FEET * QU;
  const QUEUE = [ // ticket, pose, colour once sorted
    { no: '01', pose: 'knee', pk: 'green' }, { no: '02', pose: 'sling', pk: 'yellow' },
    { no: '03', pose: 'phone', pk: 'green' }, { no: '04', pose: 'chest', pk: 'red' },
  ];
  function hook(ctx, t) {
    const lt = t;
    paper(ctx, t, '#ffffff', GRIDC, E.o3(inv(0, 0.5, lt)));
    band(ctx, 'blue', t, 3);
    hud(ctx, 'IGD · 02:14', 'ANTREAN', 0, t);
    // title
    const s1 = 150;
    text(ctx, 'h1', 'DATANG', MX - 6, 470, F(900, s1), INK, pin(t, 0.25));
    text(ctx, 'h2', 'TERAKHIR,', MX - 6, 610, F(900, s1), INK, pin(t, 0.33));
    text(ctx, 'h3', 'DITANGANI', MX - 6, 770, F(900, s1), PAL.red.t[2], pin(t, 2.0));
    text(ctx, 'h4', 'PERTAMA.', MX - 6, 910, F(900, s1), PAL.red.t[2], pin(t, 2.08));
    // "KOK BISA?" chip
    if (t >= 3.5) {
      const p = E.oExp(pin(t, 3.5, 0.3));
      ctx.save(); ctx.font = M(40); ctx.letterSpacing = '4px';
      const str = 'KOK BISA?', w = ctx.measureText(str).width;
      ctx.fillStyle = INK; ctx.fillRect(MX, 980, (w + 44) * p, 66);
      ctx.restore();
      text(ctx, 'h5', str, MX + 22, 1028, M(40), '#ffffff', pin(t, 3.55, 0.25), { ls: '4px' });
    }
    // ground
    G.hair(ctx, 80, GROUND, 920, '#c9c9d2', E.o3(inv(0, 0.6, lt)), 3);
    // queue
    const jump = E.ioExp(inv(1.5, 2.0, t)), shift = E.io3(inv(1.55, 2.0, t));
    for (let i = 0; i < 4; i++) {
      const q = QUEUE[i];
      let x, y = QHIP;
      if (i === 3) { x = lerp(SLOTS[3], SLOTS[0], jump); y -= Math.sin(jump * Math.PI) * 260; }
      else x = lerp(SLOTS[i], SLOTS[i + 1], shift);
      const C = i === 3 && t >= 2.0 ? Object.assign({}, INKC, { acc: PAL.red.t[2] }) : INKC;
      const u = t / TL.beat + i * 0.7;
      if (i === 3 && jump > 0 && jump < 1) {
        // mid-air: a tucked leap, then the chest pose again on landing
        figure(ctx, 'chest', u, C, x, y, QU);
        ctx.save(); ctx.globalAlpha = 0.25 * Math.sin(jump * Math.PI);
        for (let k = 1; k <= 3; k++) G.disc(ctx, x + k * 34, y + 30, 6, INK);
        ctx.restore();
      } else figure(ctx, q.pose, u, C, x, y, QU);
      const red = i === 3 && t >= 2.0;
      ticket(ctx, x, y - QU * 0.72, q.no, red ? PAL.red.t[2] : INK, '#ffffff', pin(t, 0.05 + i * 0.125, 0.3));
    }
    // landing burst
    if (t >= 2.0 && t < 2.6) {
      const k = E.o3(inv(2.0, 2.6, t));
      ctx.save(); ctx.globalAlpha = 1 - k;
      G.ring(ctx, SLOTS[0], QHIP - QU * 0.2, 60 + k * 220, 10 * (1 - k) + 2, PAL.red.t[2]);
      ctx.restore();
    }
  }

  // ───────── 2. TRIAGE ─────────
  const TRI_DISCS = ['red', 'yellow', 'green', 'ink'];
  const TRI_POSE = ['down', 'seat', 'walk', 'still'];
  const DISC_Y = 1250, DISC_R = 100, DISC_X = (i) => 195 + i * 230;
  function triage(ctx, t) {
    const lt = t - 6;
    paper(ctx, t);
    band(ctx, 'blue', t, 5);
    hud(ctx, 'IGD', 'TRIAGE', 0, t);
    // the word, then split into four coloured bands
    const px = fit(ctx, 'TRIAGE', 900, 300, COLR - MX + 10, -0.02 * 300);
    const ls = (-0.02 * px) + 'px';
    const split = E.oExp(inv(8.5, 9.0, t));
    if (split <= 0) text(ctx, 't1', 'TRIAGE', MX - 8, 640, F(900, px), INK, pin(t, 6.05, 0.4), { ls });
    else {
      ctx.save(); ctx.font = F(900, px); ctx.letterSpacing = ls;
      const m = ctx.measureText('TRIAGE'), top = 640 - m.actualBoundingBoxAscent, h = m.actualBoundingBoxAscent;
      for (let i = 0; i < 4; i++) {
        ctx.save(); ctx.beginPath(); ctx.rect(0, top + (h * i) / 4, W, h / 4 + (i === 3 ? 4 : 0.5)); ctx.clip();
        ctx.fillStyle = mix(INK, PAL[TRI_DISCS[i]].t[TRI_DISCS[i] === 'ink' ? 0 : 2], split);
        ctx.fillText('TRIAGE', MX - 8 + (i % 2 ? 1 : -1) * 12 * split, 640);
        ctx.restore();
      }
      ctx.restore();
      if (COLLECT) COLLECT.push({ id: 't1', text: 'TRIAGE', x0: MX - 8, y0: top, x1: MX - 8 + m.width, y1: 640 });
    }
    text(ctx, 't2', 'Yang paling gawat,', MX, 790, F(800, 78), INK, pin(t, 6.5));
    text(ctx, 't3', 'duluan.', MX, 880, F(800, 78), INK, pin(t, 6.58));
    // four empty slots, then each fills on an eighth note
    for (let i = 0; i < 4; i++) {
      const x = DISC_X(i), pk = TRI_DISCS[i];
      const draw = E.o3(inv(6.2 + i * 0.1, 6.9 + i * 0.1, t));
      ctx.save(); ctx.strokeStyle = '#c9c9d2'; ctx.lineWidth = 4; ctx.setLineDash([10, 12]);
      ctx.beginPath(); ctx.arc(x, DISC_Y, DISC_R - 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * draw); ctx.stroke(); ctx.restore();
      const p = inv(8.5 + i * 0.25, 8.5 + i * 0.25 + 0.3, t);
      if (p > 0) {
        const r = DISC_R * E.oBack(p, 2.2);
        G.disc(ctx, x, DISC_Y, r, PAL[pk].t[pk === 'ink' ? 1 : 2]);
        const C = pk === 'ink' ? colorsFor('ink', true) : { fg: pk === 'yellow' ? INK : '#ffffff', far: pk === 'yellow' ? mix(INK, PAL.yellow.t[2], 0.4) : mix('#ffffff', PAL[pk].t[2], 0.4), acc: pk === 'yellow' ? INK : '#ffffff', line: rgba('#ffffff', 0.35), mark: PAL[pk].t[2], sheet: '#6b6b77' };
        ctx.save(); ctx.beginPath(); ctx.arc(x, DISC_Y, r, 0, Math.PI * 2); ctx.clip();
        const u = (t - 8.5) / TL.beat;
        figure(ctx, TRI_POSE[i], u, C, x + (i === 0 || i === 3 ? -6 : 0), DISC_Y + 25 - (i === 1 ? 10 : 0), 120 * E.o3(p));
        ctx.restore();
        // label under the disc
        ctx.save(); ctx.font = M(26); ctx.letterSpacing = '3px'; ctx.textAlign = 'center'; ctx.fillStyle = INK;
        ctx.globalAlpha = E.o3(p); ctx.fillText(TL.cards[pk].title, x, DISC_Y + DISC_R + 54); ctx.restore();
      }
    }
  }
  // push into the red disc, 9.5 → 10.0
  function triagePush(ctx, t) {
    const k = E.iExp(inv(9.5, 10.0, t));
    const s = lerp(1, 26, k), cx = DISC_X(0), cy = DISC_Y;
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(s, s); const c = E.io3(inv(9.5, 9.75, t));
    ctx.translate(-lerp(W / 2, cx, c), -lerp(H / 2, cy, c));
    COLLECT = null; triage(ctx, t);
    ctx.restore();
  }

  // ───────── 3–6. chapter cards ─────────
  function card(ctx, key, t, t0) {
    const c = TL.cards[key], P = PAL[c.pk], dark = c.pk === 'ink';
    const lt = t - t0;
    paper(ctx, t, dark ? '#141418' : '#ffffff', dark ? '#202027' : GRIDC);
    if (!dark) band(ctx, c.pk, t, 11 + c.n);
    hud(ctx, `0${c.n} / 04`, 'TRIAGE · IGD', c.n, t, dark);
    // title slab, bleeding off the left edge
    const px = 200, tw = (() => { ctx.save(); ctx.font = F(900, px); ctx.letterSpacing = (-0.02 * px) + 'px'; const w = ctx.measureText(c.title).width; ctx.restore(); return w; })();
    const slabW = (MX + tw + 56) * E.oExp(pin(t, t0, 0.3));
    const slabCol = dark ? '#ffffff' : c.pk === 'green' ? P.t[1] : P.t[2];
    const titleCol = dark ? INK : P.fg;
    ctx.fillStyle = slabCol; ctx.fillRect(0, 350, slabW, 230);
    text(ctx, key + '_t', c.title, MX - 4, 540, F(900, px), titleCol, pin(t, t0 + 0.05), { ls: (-0.02 * px) + 'px' });
    const fg = dark ? '#ffffff' : INK;
    text(ctx, key + '_l', c.line, MX, 700, F(800, fit(ctx, c.line, 800, 84, COLR - MX)), fg, pin(t, t0 + 0.12));
    let y = 790;
    if (c.chip) {
      const p = E.oExp(pin(t, t0 + 0.2, 0.3));
      ctx.save(); ctx.font = M(34); ctx.letterSpacing = '4px'; const w = ctx.measureText(c.chip).width; ctx.restore();
      ctx.fillStyle = c.pk === 'yellow' ? P.t[4] : mix(P.t[4], '#ffffff', 0.35); ctx.fillRect(MX, y - 4, (w + 40) * p, 62);
      text(ctx, key + '_c', c.chip, MX + 20, y + 40, M(34), c.pk === 'yellow' ? '#5a4100' : P.t[0], pin(t, t0 + 0.24, 0.3), { ls: '4px' });
      y += 120;
    } else y += 40;
    text(ctx, key + '_e', c.ex, MX, y, M(36), dark ? '#a6a6b0' : GREY, pin(t, t0 + 0.3, 0.3), { ls: '1px' });
    // stage
    const r = 330, cx = 540, cy = 1260;
    const C = colorsFor(c.pk, dark);
    sun(ctx, cx, cy, r * E.oExp(pin(t, t0, 0.45)), dark ? '#24242b' : mix(P.t[4], '#ffffff', c.pk === 'yellow' ? 0.2 : 0.45), lt);
    const U = c.body ? 470 : 560;
    const ground = cy + r * 0.62;
    G.hair(ctx, cx - r * 0.95, ground, r * 1.9, dark ? '#3a3a44' : mix(P.t[3], '#ffffff', 0.2), E.o3(pin(t, t0 + 0.1, 0.4)), 3);
    figure(ctx, c.pose, lt / TL.beat, C, cx + (c.body ? 0 : -40), ground - G.FEET * U, U, E.o3(pin(t, t0 + 0.05, 0.5)));
  }

  // chapter flash: full-contrast pattern + big index
  function flash(ctx, pk, t, n) {
    fullPattern(ctx, pk, t, 40 + n);
    ctx.save(); ctx.font = F(900, 560); ctx.letterSpacing = '-30px'; ctx.textAlign = 'center'; ctx.fillStyle = PAL[pk].fg;
    ctx.fillText('0' + n, W / 2, H / 2 + 200); ctx.restore();
  }

  // ───────── 7. the queue again, sorted ─────────
  const SORTED = [3, 1, 0, 2];
  function queue(ctx, t) {
    const t0 = 27;
    paper(ctx, t);
    band(ctx, 'blue', t, 21);
    hud(ctx, 'ANTREAN', 'IGD · 02:31', 0, t);
    text(ctx, 'q1', 'DISURUH', MX - 6, 480, F(900, 160), INK, pin(t, 27.1));
    text(ctx, 'q2', 'MENUNGGU?', MX - 6, 630, F(900, fit(ctx, 'MENUNGGU?', 900, 160, COLR - MX)), INK, pin(t, 27.18));
    text(ctx, 'q3', 'Berarti kondisimu', MX, 790, F(800, 80), PAL.green.t[1], pin(t, 29.0));
    text(ctx, 'q4', 'masih aman.', MX, 885, F(800, 80), PAL.green.t[1], pin(t, 29.08));
    G.hair(ctx, 80, GROUND, 920, '#c9c9d2', 1, 3);
    for (let s = 0; s < 4; s++) {
      const q = QUEUE[SORTED[s]], P = PAL[q.pk], x = SLOTS[s];
      const ta = t0 + s * 0.5, asm = pin(t, ta, 0.45);
      if (asm <= 0) continue;
      sun(ctx, x, QHIP - 10, 96 * E.oBack(Math.min(1, asm * 1.4), 1.8), mix(P.t[4], '#ffffff', q.pk === 'yellow' ? 0.15 : 0.35), t - ta);
      figure(ctx, q.pose, t / TL.beat + s, colorsFor(q.pk), x, QHIP, QU, asm);
      ticket(ctx, x, QHIP - QU * 0.72, q.no, q.pk === 'yellow' ? P.t[2] : q.pk === 'green' ? P.t[1] : P.t[2], q.pk === 'yellow' ? INK : '#ffffff', pin(t, ta + 0.1, 0.3));
    }
    // order marker under the queue: 1 → 4
    ctx.save(); ctx.font = M(26); ctx.letterSpacing = '3px'; ctx.fillStyle = GREY; ctx.globalAlpha = E.o3(pin(t, 29.0, 0.4));
    ctx.fillText('DIPERIKSA →', 120, GROUND + 60); ctx.restore();
  }

  // ───────── 8. the stretcher run ─────────
  function rush(ctx, t) {
    const t0 = 33, lt = t - t0;
    paper(ctx, t, '#ffffff', null);
    // grid scrolls: the camera tracks right
    const beat = (t - 32.5) / TL.beat;
    const speed = 1500, pulse = Math.floor(beat) + E.oExp((beat % 1) * 1.6);
    const camX = (t - 32.5) * speed * 0.8 + pulse * speed * 0.1;
    const S = G.CELL;
    ctx.fillStyle = GRIDC;
    for (let i = -1; i < W / S + 2; i++) ctx.fillRect(i * S - (camX % S) - 1, 0, 2, H);
    for (let j = 1; j * S < H; j++) ctx.fillRect(0, j * S - 1, W, 2);
    // passing discs (the waiting room going by)
    const hues = ['yellow', 'green', 'blue', 'green', 'yellow'];
    for (let k = -1; k < 4; k++) {
      const idx = Math.floor(camX / 560) + k, x = idx * 560 - camX + 200;
      const pk = hues[((idx % 5) + 5) % 5];
      G.disc(ctx, x, GROUND - 150, 120, mix(PAL[pk].t[4], '#ffffff', 0.4));
    }
    band(ctx, 'red', t * 3, 31);
    hud(ctx, 'IGD', 'WAKTU ' + clock(Math.max(0, t - 32.5)), 0, t);
    text(ctx, 'r1', 'Yang merah', MX - 4, 520, F(900, 140), INK, pin(t, 33.1));
    text(ctx, 'r2', 'dikejar waktu.', MX - 4, 660, F(900, fit(ctx, 'dikejar waktu.', 900, 140, COLR - MX)), INK, pin(t, 33.18));
    // recolour "merah"
    if (t >= 33.1) {
      ctx.save(); ctx.font = F(900, 140); const w0 = ctx.measureText('Yang ').width; ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.rect(MX - 4 + w0, 380, 900, 170); ctx.clip();
      G.maskText(ctx, 'Yang merah', MX - 4, 520, F(900, 140), PAL.red.t[2], pin(t, 33.1)); ctx.restore();
    }
    // ground ticks
    ctx.fillStyle = '#c9c9d2'; ctx.fillRect(0, GROUND, W, 3);
    for (let i = -1; i < 12; i++) ctx.fillRect(i * 120 - (camX * 1.0 % 120), GROUND + 3, 3, 18);
    // the stretcher enters from the left (J-cut: wheels heard from 32.5)
    const enter = E.oExp(inv(33.0, 33.6, t));
    const bx = lerp(-700, 0, enter) + Math.sin(lt * Math.PI * 4) * 4;
    const U = 300, hipY = GROUND - G.FEET * U;
    const N = colorsFor('blue'), R = colorsFor('red');
    // speed lines
    ctx.save(); ctx.fillStyle = '#c9c9d2';
    for (let i = 0; i < 6; i++) { const yy = hipY - 120 + i * 40, len = 120 + ((i * 53) % 5) * 40; ctx.fillRect(bx + 60 - len - ((camX * 0.5 + i * 70) % 90), yy, len, 6); }
    ctx.restore();
    // stretcher: deck, legs, wheels
    const sx0 = bx + 360, sx1 = bx + 860, deckY = GROUND - 150;
    ctx.fillStyle = PAL.blue.t[0]; ctx.fillRect(sx0, deckY, sx1 - sx0, 22);
    ctx.fillRect(sx0 + 50, deckY + 22, 12, 100); ctx.fillRect(sx1 - 62, deckY + 22, 12, 100);
    for (const wx of [sx0 + 56, sx1 - 56]) {
      G.disc(ctx, wx, GROUND - 24, 24, INK); const a = camX / 24;
      G.seg(ctx, [wx, GROUND - 24], [wx + Math.cos(a) * 20, GROUND - 24 + Math.sin(a) * 20], 5, '#ffffff');
    }
    G.seg(ctx, [sx0 - 10, deckY + 8], [sx0 - 60, deckY - 60], 12, PAL.blue.t[0]); // push bar
    // patient (red) lying on the deck, monitor trace above
    figure(ctx, 'down', lt / TL.beat * 2, R, (sx0 + sx1) / 2 - 10, deckY - (G.FEET - 0.075) * 320 - 0.075 * 320 + 4, 320);
    // nurse running behind
    figure(ctx, 'nurse', (t - 32.5) / TL.beat * 1.0, N, sx0 - 150, hipY, U);
  }
  const clock = (s) => { const sec = Math.floor(s), cs = Math.floor((s - sec) * 100); return `00:${String(sec).padStart(2, '0')}.${String(cs).padStart(2, '0')}`; };

  // ───────── 9. icon wall → handle ─────────
  const WALL = { cols: 4, rows: 4, size: 200, gap: 18, x0: 0, y0: 770 };
  WALL.x0 = (W - (WALL.cols * WALL.size + (WALL.cols - 1) * WALL.gap)) / 2;
  // sorted order (k): row 0 red … row 3 black. WALL_FROM[k] = the slot tile k starts in (red 'down' starts in slot 13, where the stretcher shot lands)
  const WALL_POSES = ['chest', 'down', 'chest', 'down', 'seat', 'sling', 'seat', 'sling', 'walk', 'knee', 'phone', 'walk', 'still', 'still', 'still', 'still'];
  const WALL_FROM = [6, 13, 0, 10, 3, 15, 8, 1, 12, 5, 14, 2, 9, 4, 11, 7];
  const WALL_PK = (i) => ['red', 'yellow', 'green', 'ink'][Math.floor(i / 4)];
  function tileRect(i) {
    const c = i % WALL.cols, r = Math.floor(i / WALL.cols);
    return [WALL.x0 + c * (WALL.size + WALL.gap), WALL.y0 + r * (WALL.size + WALL.gap), WALL.size];
  }
  function wall(ctx, t) {
    paper(ctx, t);
    hud(ctx, 'IGD', 'TRIAGE', 0, t);
    const handle = '@dokter.emergency';
    const px = fit(ctx, handle, 900, 120, COLR - MX);
    text(ctx, 'e1', handle, MX - 4, 560, F(900, px), INK, pin(t, 37.1));
    // colour key line
    const words = [['MERAH', 'red'], ['KUNING', 'yellow'], ['HIJAU', 'green'], ['HITAM', 'ink']];
    ctx.save(); ctx.font = M(30); ctx.letterSpacing = '3px';
    let x = MX; const y = 660, p = E.o3(pin(t, 37.1, 0.3));
    ctx.globalAlpha = p;
    for (const [w, pk] of words) { G.disc(ctx, x + 12, y - 11, 12, PAL[pk].t[pk === 'ink' ? 1 : 2]); ctx.fillStyle = INK; ctx.fillText(w, x + 34, y); x += ctx.measureText(w).width + 70; }
    ctx.restore();
    if (COLLECT && p > 0) COLLECT.push({ id: 'e2', text: 'MERAH KUNING HIJAU HITAM', x0: MX, y0: y - 30, x1: x, y1: y + 6 });
    // tiles flip in shuffled, then sort themselves by priority: red on top, black at the bottom
    const cx = W / 2, cy = WALL.y0 + (WALL.rows * WALL.size + (WALL.rows - 1) * WALL.gap) / 2;
    for (let k = 0; k < 16; k++) {
      const [sx, sy, s] = tileRect(WALL_FROM[k]), [ex, ey] = tileRect(k);
      const d = Math.hypot(sx + s / 2 - cx, sy + s / 2 - cy) / 500;
      const fp = E.oExp(inv(37.0 + d * 0.25, 37.0 + d * 0.25 + 0.35, t));
      if (fp <= 0) continue;
      const row = Math.floor(k / 4), mv = E.ioExp(inv(37.95 + row * 0.05, 38.35 + row * 0.05, t));
      const lift = 1 - 0.12 * Math.sin(mv * Math.PI);
      const mx = lerp(sx, ex, mv) + s / 2, my = lerp(sy, ey, mv) + s / 2;
      const pk = WALL_PK(k), fill = PAL[pk].t[pk === 'ink' ? 1 : 2];
      ctx.save(); ctx.translate(mx, my); ctx.scale(fp * lift, lift);
      ctx.fillStyle = fill; ctx.fillRect(-s / 2, -s / 2, s, s);
      ctx.beginPath(); ctx.rect(-s / 2, -s / 2, s, s); ctx.clip();
      const light = pk === 'yellow';
      const C = { fg: light ? INK : '#ffffff', far: light ? mix(INK, fill, 0.45) : mix('#ffffff', fill, 0.45), acc: light ? INK : '#ffffff', line: rgba('#ffffff', 0.3), mark: fill, sheet: mix('#ffffff', fill, 0.5) };
      const pose = WALL_POSES[k], lying = pose === 'down' || pose === 'still';
      figure(ctx, pose, (t - 37) / TL.beat + k, C, 0, lying ? 0 : 10, lying ? 150 : 140);
      ctx.restore();
    }
    // after the sort: the priority arrow down the left edge
    const ar = E.oExp(inv(38.5, 38.9, t));
    if (ar > 0) {
      const [x0, y0] = tileRect(0), [, y3, s3] = tileRect(12);
      const x = x0 - 22, h = (y3 + s3 - y0) * ar;
      ctx.fillStyle = INK; ctx.fillRect(x - 3, y0, 6, h);
      G.poly(ctx, [[x - 14, y0 + 18], [x, y0], [x + 14, y0 + 18]], INK);
    }
  }

  // ───────── transitions ─────────
  const bufA = G.canvas(), bufB = G.canvas();
  const ctxA = bufA.getContext('2d'), ctxB = bufB.getContext('2d');
  function into(c, fn, t) { c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; fn(c, t); }
  // pattern rows slide in (cover) or out (uncover) from alternating sides
  function rowsPattern(ctx, pk, t, p, cover, seed) {
    const pat = G.pattern(pk, seed, { spread: 1, density: 0.6 }), S = G.CELL;
    const rows = Math.ceil(H / S) + 1;
    for (let j = 0; j < rows; j++) {
      const lag = (j % 4) * 0.06, q = E.ioExp(clamp((p - lag) / (1 - 0.18)));
      const dir = j % 2 ? 1 : -1;
      const dx = cover ? (1 - q) * W * dir : q * W * dir;
      ctx.drawImage(pat, 0, j * S, pat.width, S, -S + dx, j * S, pat.width, S + 0.5);
    }
  }
  // B's rows slide in over A
  function rowsReveal(ctx, drawA, drawB, t, p) {
    into(ctxA, drawA, t); into(ctxB, drawB, t);
    ctx.drawImage(bufA, 0, 0);
    const S = G.CELL, rows = Math.ceil(H / S) + 1;
    for (let j = 0; j < rows; j++) {
      const lag = (j % 3) * 0.08, q = E.oExp(clamp((p - lag) / (1 - 0.16)));
      const dx = (1 - q) * W * (j % 2 ? 1 : -1);
      ctx.drawImage(bufB, 0, j * S, W, S, dx, j * S, W, S);
    }
  }
  const BAND = 700;
  function vscroll(ctx, drawA, drawB, pk, t, p, seed) {
    const o = E.ioExp(p) * (H + BAND);
    into(ctxA, drawA, t); into(ctxB, drawB, t);
    ctx.drawImage(bufA, 0, -o);
    ctx.save(); ctx.translate(0, H - o); ctx.beginPath(); ctx.rect(0, 0, W, BAND); ctx.clip();
    fullPattern(ctx, pk, t, seed, false); ctx.restore();
    ctx.drawImage(bufB, 0, H + BAND - o);
  }
  function push(ctx, drawA, drawB, t, p) {
    const o = E.ioExp(p) * W;
    into(ctxA, drawA, t); into(ctxB, drawB, t);
    ctx.drawImage(bufA, -o, 0); ctx.drawImage(bufB, W - o, 0);
  }
  // rush shrinks into one tile of the wall
  function pullBack(ctx, t, p) {
    const keep = COLLECT; COLLECT = null; into(ctxA, rush, t); COLLECT = keep;
    wall(ctx, t);
    const k = E.ioExp(p), [tx, ty, s] = tileRect(WALL_FROM[1]);
    const sy = lerp(0, 760, k), sh = lerp(H, W, k);
    ctx.drawImage(bufA, 0, sy, W, sh, lerp(0, tx, k), lerp(0, ty, k), lerp(W, s, k), lerp(H, s, k));
  }

  // sub-frame motion blur inside transition windows
  const accum = G.canvas(), actx = accum.getContext('2d');
  const tmp = G.canvas(), tmpCtx = tmp.getContext('2d');
  const C_RED = (c, t) => card(c, 'red', t, 10.5), C_YEL = (c, t) => card(c, 'yellow', t, 15.0);
  const C_GRN = (c, t) => card(c, 'green', t, 19.0), C_INK = (c, t) => card(c, 'ink', t, 23.0);

  // ───────── frame ─────────
  function frameAt(ctx, t) {
    // returns true when the frame is a settled shot (texts may be collected)
    if (t < 5.75) { hook(ctx, t); return true; }
    if (t < 6.25) { // blue pattern rows: cover then uncover
      if (t < 6.0) { hook(ctx, t); rowsPattern(ctx, 'blue', t, inv(5.75, 6.0, t), true, 7); }
      else { triage(ctx, t); rowsPattern(ctx, 'blue', t, inv(6.0, 6.25, t), false, 7); }
      return false;
    }
    if (t < 9.5) { triage(ctx, t); return true; }
    if (t < 10.0) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); triagePush(ctx, t); return false; }
    if (t < 10.5) { flash(ctx, 'red', t, 1); return false; }
    if (t < 10.75) { C_RED(ctx, t); rowsPattern(ctx, 'red', t, inv(10.5, 10.75, t), false, 41); return false; }
    if (t < 14.5) { C_RED(ctx, t); return true; }
    if (t < 15.0) { vscroll(ctx, C_RED, C_YEL, 'yellow', t, inv(14.5, 15.0, t), 52); return false; }
    if (t < 18.5) { C_YEL(ctx, t); return true; }
    if (t < 19.0) { vscroll(ctx, C_YEL, C_GRN, 'green', t, inv(18.5, 19.0, t), 63); return false; }
    if (t < 22.5) { C_GRN(ctx, t); return true; }
    if (t < 23.0) { vscroll(ctx, C_GRN, C_INK, 'ink', t, inv(22.5, 23.0, t), 74); return false; }
    if (t < 27.0) { C_INK(ctx, t); return true; }
    if (t < 27.3) { rowsReveal(ctx, (c, tt) => C_INK(c, 27.0 - 1e-3), queue, t, inv(27.0, 27.3, t)); return false; }
    if (t < 32.75) { queue(ctx, t); return true; }
    if (t < 33.0) { push(ctx, queue, rush, t, inv(32.75, 33.0, t)); return false; }
    if (t < 37.0) { rush(ctx, t); return true; }
    if (t < 37.75) { pullBack(ctx, t, inv(37.0, 37.75, t)); return true; }
    wall(ctx, t); return true;
  }
  const BLUR = [[5.75, 6.25], [9.5, 10.0], [14.5, 15.0], [18.5, 19.0], [22.5, 23.0], [27.0, 27.3], [32.75, 33.0]];
  G.renderFrame = function (ctx, t) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
    COLLECT = null;
    if (BLUR.some(([a, b]) => t >= a && t < b)) {
      actx.setTransform(1, 0, 0, 1, 0, 0); actx.globalAlpha = 1;
      const n = 4, span = 1 / 48;
      for (let i = 0; i < n; i++) {
        const tt = t - span / 2 + (span * i) / (n - 1);
        tmpCtx.setTransform(1, 0, 0, 1, 0, 0); tmpCtx.globalAlpha = 1; frameAt(tmpCtx, tt);
        actx.globalAlpha = 1 / (i + 1); actx.drawImage(tmp, 0, 0);
      }
      actx.globalAlpha = 1; ctx.drawImage(accum, 0, 0);
    } else frameAt(ctx, t);
  };
  G.textsAt = function (ctx, t) {
    COLLECT = [];
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const settled = frameAt(ctx, t);
    const out = settled ? COLLECT : [];
    COLLECT = null;
    return out;
  };
})();
