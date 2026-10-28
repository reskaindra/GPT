// Cut-paper art for "Buku Jaga IGD": characters, set pieces, info cards, page art.
// Canvas2D drawings finished as cut paper (white border, card edge, grain) with the paper.js toolkit
// from the Lemo-Opuscar paper-popup demo (MIT).
import { mulberry, TAU, clamp, lerp } from './lib.js';
import { cv, finishCut, sh, blob, crescent, paperFill, INK, GRAIN, rr } from './paper.js';

export const PPM = 5200;          // pixels per metre for props
const LW = 9, LW2 = 5;
export const C = {
  ink: INK, cream: '#fffaf0', paper: '#f6efdf', red: '#d8423a', teal: '#2f8f8a', tealD: '#21706c',
  mustard: '#f2b632', navy: '#2c3550', mint: '#9fd8c0', pink: '#e9a6b5', skin: '#f3c9a3', skinS: '#dea57c',
  pale: '#e4dfc9', paleS: '#c9c3a6', coat: '#fbfbf6', coatS: '#d9dcd6',
};
export function cut(wm, hm, draw, o = {}) {
  const pad = o.pad ?? 30, w = Math.ceil(wm * PPM) + pad * 2, h = Math.ceil(hm * PPM) + pad * 2;
  const c = cv(w, h), x = c.getContext('2d'); x.translate(pad, pad);
  draw(x, w - pad * 2, h - pad * 2);
  const out = o.raw ? c : finishCut(c, o.border ?? 14, o);
  return { c: out, w: w / PPM, h: h / PPM, ax: o.ax ?? .5, ay: o.ay ?? 1 - pad / h, pad };
}
const shade = (hex, f = .8) => { const n = parseInt(hex.slice(1), 16); return `rgb(${(n >> 16) * f | 0},${(n >> 8 & 255) * f | 0},${(n & 255) * f | 0})`; };

// ================= people =================
// one rig for both characters: canvas PW×PH, feet at (300, 960)
export const PW = 600, PH = 1000;
export const PATIENT = { skin: C.skin, skinS: C.skinS, hair: '#4a2e22', long: true, top: '#c77d93', topS: '#a8607a', pants: '#5574a6', pantsS: '#3f5b88', shoe: '#6b4a3a' };
export const DOCTOR = { skin: '#e8b48c', skinS: '#c98f66', hair: '#2b211c', long: false, top: '#3f9e98', topS: '#2b7a75', pants: '#3f9e98', pantsS: '#2b7a75', shoe: '#3a3a44', coat: true };

function limb(x, px, py, ang, len, w, col, end, endCol) {
  x.save(); x.translate(px, py); x.rotate(ang);
  rr(x, -w / 2, -6, w, len, w / 2); sh(x, col, LW2 + 1);
  if (end) { x.beginPath(); x.ellipse(end === 'shoe' ? 10 : 0, len, end === 'shoe' ? w * .75 : w * .48, end === 'shoe' ? w * .42 : w * .48, 0, 0, TAU); sh(x, endCol, LW2 + 1); }
  x.restore();
}
// p: {walk, stride, sit, armL, armR, mouth:'calm'|'talk'|'pain'|'flat', open, blink, look, pale, sweat, pen}
export function drawPerson(x, S, p = {}) {
  const { walk = 0, stride = 0, sit = 0, armL = .15, armR = .15, mouth = 'calm', open = 0, blink = 0, look = 0, pale = 0, sweat = 0, pen = false } = p;
  x.clearRect(0, 0, PW, PH);
  const skin = pale > 0 ? lerpCol(S.skin, C.pale, pale) : S.skin, skinS = pale > 0 ? lerpCol(S.skinS, C.paleS, pale) : S.skinS;
  const hipY = lerp(700, 760, sit), sh0 = hipY - 230;
  // legs
  const s = Math.sin(walk) * stride;
  if (sit > .5) {
    // seated, seen from the front: short thighs, shins hanging
    for (const dx of [-38, 38]) { rr(x, 300 + dx - 30, hipY - 10, 60, 70, 26); sh(x, S.pants, LW2 + 1); limb(x, 300 + dx, hipY + 50, 0, 150, 52, S.pants, 'shoe', S.shoe); }
  } else {
    limb(x, 268, hipY, s * .45, 230, 56, S.pants, 'shoe', S.shoe);
    limb(x, 332, hipY, -s * .45, 230, 56, S.pants, 'shoe', S.shoe);
  }
  // torso
  const torso = () => { x.beginPath(); x.moveTo(214, sh0 + 20); x.quadraticCurveTo(300, sh0 - 16, 386, sh0 + 20); x.lineTo(400, hipY + 14); x.quadraticCurveTo(300, hipY + 34, 200, hipY + 14); x.closePath(); };
  crescent(x, torso, S.topS, 22, 0, S.top); torso(); sh(x, null, LW);
  if (S.coat) {
    // white coat open over scrubs
    for (const side of [-1, 1]) {
      x.beginPath(); x.moveTo(300 + side * 30, sh0 + 6); x.lineTo(300 + side * 92, sh0 + 10); x.lineTo(300 + side * 112, hipY + 70); x.lineTo(300 + side * 26, hipY + 60); x.closePath(); sh(x, C.coat, LW2 + 1);
    }
    x.beginPath(); x.moveTo(250, sh0 + 18); x.quadraticCurveTo(300, sh0 + 110, 350, sh0 + 18); x.lineWidth = 6; x.strokeStyle = '#6b6f7a'; x.stroke();
    x.beginPath(); x.arc(332, sh0 + 112, 14, 0, TAU); sh(x, '#9aa0aa', 4);
    rr(x, 336, sh0 + 120, 40, 46, 6); sh(x, '#eef1f4', 4);
  }
  // arms
  const armCol = S.coat ? C.coat : S.top;
  limb(x, 222, sh0 + 34, armL, 175, 46, armCol, 'hand', skin);
  limb(x, 378, sh0 + 34, -armR, 175, 46, armCol, 'hand', skin);
  if (pen) { x.save(); x.translate(378, sh0 + 34); x.rotate(-armR); x.translate(0, 175); x.rotate(.5); rr(x, -6, -70, 12, 80, 5); sh(x, C.teal, 4); x.restore(); }
  // neck + head
  rr(x, 278, sh0 - 40, 44, 50, 14); sh(x, skin, LW2);
  const hy = sh0 - 150;
  if (S.long) { x.beginPath(); x.moveTo(190, hy - 10); x.quadraticCurveTo(170, hy + 170, 214, hy + 190); x.lineTo(386, hy + 190); x.quadraticCurveTo(430, hy + 170, 410, hy - 10); x.closePath(); sh(x, S.hair, LW); }
  const head = () => { x.beginPath(); x.ellipse(300, hy, 118, 128, 0, 0, TAU); };
  crescent(x, head, skinS, 22, 14, skin); head(); sh(x, null, LW + 1);
  // hair cap
  x.beginPath(); x.moveTo(184, hy + 6); x.bezierCurveTo(176, hy - 150, 424, hy - 150, 416, hy + 6);
  x.quadraticCurveTo(360, hy - 70, 300, hy - 62); x.quadraticCurveTo(230, hy - 60, 184, hy + 6); x.closePath(); sh(x, S.hair, LW);
  // face
  const ex = look * 10;
  for (const d of [-44, 44]) {
    const cx = 300 + d + ex, cy = hy + 14;
    if (blink > .8 || mouth === 'pain' && pale > .5) { x.beginPath(); x.moveTo(cx - 18, cy + 2); x.quadraticCurveTo(cx, cy + 12, cx + 18, cy + 2); x.lineWidth = 8; x.strokeStyle = INK; x.lineCap = 'round'; x.stroke(); }
    else { x.beginPath(); x.ellipse(cx, cy, 12, 20 * (1 - blink * .9), 0, 0, TAU); x.fillStyle = INK; x.fill(); x.beginPath(); x.ellipse(cx - 4, cy - 7, 4, 6, 0, 0, TAU); x.fillStyle = '#fff'; x.fill(); }
  }
  // brows: worry tilts inward
  if (mouth === 'pain' || pale > .2) for (const d of [-1, 1]) { x.beginPath(); x.moveTo(300 + d * 26 + ex, hy - 24 + 0); x.lineTo(300 + d * 66 + ex, hy - 14); x.lineWidth = 7; x.strokeStyle = INK; x.lineCap = 'round'; x.stroke(); }
  if (pale < .5) { x.beginPath(); x.ellipse(300 - 70, hy + 56, 22, 13, 0, 0, TAU); x.fillStyle = 'rgba(230,110,110,.35)'; x.fill(); x.beginPath(); x.ellipse(300 + 70, hy + 56, 22, 13, 0, 0, TAU); x.fill(); }
  const my = hy + 72; x.lineCap = 'round'; x.strokeStyle = INK;
  if (open > .1) { x.beginPath(); x.ellipse(300 + ex * .5, my, 18, 8 + 16 * open, 0, 0, TAU); sh(x, '#8a2f2f', 6); }
  else if (mouth === 'pain') { x.beginPath(); x.moveTo(276, my + 8); x.quadraticCurveTo(300, my - 8, 324, my + 8); x.lineWidth = 7; x.stroke(); }
  else if (mouth === 'flat') { x.beginPath(); x.moveTo(280, my); x.lineTo(320, my); x.lineWidth = 7; x.stroke(); }
  else { x.beginPath(); x.moveTo(280, my - 2); x.quadraticCurveTo(300, my + 12, 320, my - 2); x.lineWidth = 7; x.stroke(); }
  if (sweat > 0) { x.save(); x.globalAlpha = sweat; x.beginPath(); x.moveTo(420, hy - 40); x.quadraticCurveTo(440, hy - 4, 420, hy + 6); x.quadraticCurveTo(400, hy - 4, 420, hy - 40); sh(x, '#bfe6f5', 5); x.restore(); }
  // the hand on the belly (pain)
  return x;
}
export function personCut(S, p) {
  const c = cv(PW, PH); drawPerson(c.getContext('2d'), S, p);
  return finishCut(c, 12);
}
function lerpCol(a, b, k) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16), f = (s, i) => (s >> i & 255);
  const m = i => Math.round(lerp(f(pa, i), f(pb, i), k));
  return `rgb(${m(16)},${m(8)},${m(0)})`;
}

// ================= set pieces =================
export function bed(wm) {
  return cut(wm, wm * .55, (x, W, H) => {
    // side view of an ER trolley
    rr(x, W * .04, H * .36, W * .92, H * .18, 18); sh(x, '#e8eef0', LW);
    rr(x, W * .06, H * .22, W * .5, H * .16, 30); sh(x, '#ffffff', LW2 + 1);                 // pillow
    rr(x, W * .02, H * .52, W * .96, H * .07, 8); sh(x, '#9aa7b0', LW2 + 1);                 // frame
    for (const u of [.12, .88]) { rr(x, W * u - 9, H * .58, 18, H * .3, 6); sh(x, '#9aa7b0', LW2); x.beginPath(); x.arc(W * u, H * .93, 22, 0, TAU); sh(x, '#4a4f58', LW2); }
    rr(x, W * .9, H * .12, 16, H * .42, 6); sh(x, '#9aa7b0', LW2);                           // rail
  });
}
export function ivPole(hm) {
  return cut(hm * .32, hm, (x, W, H) => {
    rr(x, W / 2 - 6, H * .08, 12, H * .86, 6); sh(x, '#b7bfc6', LW2);
    x.beginPath(); x.moveTo(W * .1, H * .08); x.lineTo(W * .9, H * .08); x.lineWidth = 10; x.strokeStyle = INK; x.stroke();
    rr(x, W * .62, H * .1, W * .3, H * .2, 14); sh(x, '#dff1f7', LW2);
    x.beginPath(); x.moveTo(W * .77, H * .3); x.quadraticCurveTo(W * .9, H * .6, W * .7, H * .9); x.lineWidth = 4; x.strokeStyle = '#7fb6c8'; x.stroke();
    for (const u of [-1, 0, 1]) { x.beginPath(); x.moveTo(W / 2, H * .94); x.lineTo(W / 2 + u * W * .4, H); x.lineWidth = 8; x.strokeStyle = INK; x.stroke(); }
  });
}
export function doorWC(hm) {
  return cut(hm * .55, hm, (x, W, H) => {
    rr(x, 0, 0, W, H, 10); sh(x, '#d9e6e8', LW);
    rr(x, W * .1, H * .08, W * .8, H * .9, 6); sh(x, '#b9d3d6', LW2 + 1);
    x.beginPath(); x.arc(W * .78, H * .55, 12, 0, TAU); sh(x, C.mustard, 4);
    rr(x, W * .2, H * .16, W * .6, H * .14, 8); sh(x, '#fff', 4);
    x.font = `700 ${Math.round(H * .085)}px Fredoka`; x.fillStyle = C.navy; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('WC', W / 2, H * .235);
  });
}
export function curtain(wm, hm, col) {
  return cut(wm, hm, (x, W, H) => {
    x.beginPath(); x.moveTo(0, 20);
    const n = 7; for (let i = 0; i <= n; i++) x.quadraticCurveTo(W * (i - .5) / n, H * .02, W * i / n, 20);
    x.lineTo(W, H); for (let i = n; i >= 0; i--) x.lineTo(W * i / n + (i % 2 ? 14 : -14), H - (i % 2 ? 0 : 20));
    x.closePath(); sh(x, col, LW);
    for (let i = 1; i < n; i++) { x.beginPath(); x.moveTo(W * i / n, 34); x.lineTo(W * i / n + (i % 2 ? 10 : -10), H - 26); x.lineWidth = 5; x.strokeStyle = shade(col, .82); x.stroke(); }
  });
}
export function stool(hm) {
  return cut(hm * .9, hm, (x, W, H) => {
    rr(x, W * .05, 0, W * .9, H * .22, 20); sh(x, '#7a8a96', LW2 + 1);
    rr(x, W / 2 - 8, H * .2, 16, H * .7, 6); sh(x, '#b7bfc6', LW2);
    x.beginPath(); x.moveTo(W * .1, H); x.lineTo(W * .5, H * .86); x.lineTo(W * .9, H); x.lineWidth = 9; x.strokeStyle = INK; x.stroke();
  });
}

// ================= info cards (front pop-ups; text is part of the art) =================
// Each card is a canvas (CW×CH px) that can be redrawn with a state object.
export function cardBase(x, W, H, fill = '#fffdf6', rule = null) {
  x.clearRect(0, 0, W, H);
  rr(x, 8, 8, W - 16, H - 16, 26); x.fillStyle = fill; x.fill();
  if (rule) { x.save(); x.clip(); x.strokeStyle = rule; x.lineWidth = 3; for (let y = 150; y < H; y += 92) { x.beginPath(); x.moveTo(30, y); x.lineTo(W - 30, y); x.stroke(); } x.restore(); }
  x.save(); x.globalAlpha = .5; x.fillStyle = x.createPattern(GRAIN, 'repeat'); x.fillRect(0, 0, W, H); x.restore();
  rr(x, 8, 8, W - 16, H - 16, 26); x.lineWidth = 10; x.strokeStyle = INK; x.stroke();
}
export function marker(x, pts, k, col = C.red, w = 22) {
  if (k <= 0) return;
  // draw a polyline up to fraction k of its length
  let L = 0; const seg = []; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
  let left = L * clamp(k);
  x.save(); x.strokeStyle = col; x.lineWidth = w; x.lineCap = 'round'; x.lineJoin = 'round'; x.globalAlpha = .9;
  x.beginPath(); x.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length && left > 0; i++) { const f = Math.min(1, left / seg[i - 1]); x.lineTo(lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)); left -= seg[i - 1]; }
  x.stroke(); x.restore();
}
export const curve = (cx, cy, rx, ry, a0 = -.4, a1 = TAU * 1.08, n = 50) => Array.from({ length: n + 1 }, (_, i) => { const a = lerp(a0, a1, i / n); return [cx + Math.cos(a) * rx * (1 + .06 * Math.sin(a * 3)), cy + Math.sin(a) * ry]; });
export function clipText(x, text, px, py, k, font, col) {
  x.save(); x.font = font; const w = x.measureText(text).width; x.beginPath(); x.rect(px - 10, py - 200, w * clamp(k) + 10, 300); x.clip(); x.fillStyle = col; x.fillText(text, px, py); x.restore();
  return w;
}

// prescription slip
export const RES_W = 1400, RES_H = 900;
export function drawResep(x, s = {}) {
  const { cross = 0, thick = 0, write1 = 1, write2 = 1, sig = 1 } = s, W = RES_W, H = RES_H;
  cardBase(x, W, H, '#fffef8');
  x.fillStyle = INK; x.font = '800 70px Fredoka'; x.textBaseline = 'alphabetic'; x.fillText('RESEP', 70, 130);
  x.font = '700 40px Fredoka'; x.fillStyle = C.teal; x.textAlign = 'right'; x.fillText('IGD · JAGA MALAM', W - 70, 126); x.textAlign = 'left';
  x.beginPath(); x.moveTo(60, 170); x.lineTo(W - 60, 170); x.lineWidth = 6; x.strokeStyle = INK; x.stroke();
  clipText(x, 'R/ Antasida', 110, 380, write1, '170px "Caveat Brush"', INK);
  clipText(x, 'R/ Omeprazol', 110, 610, write2, '170px "Caveat Brush"', INK);
  if (sig > 0) { x.beginPath(); x.moveTo(900, 790); x.bezierCurveTo(960, 700, 1000, 840, 1060, 760); x.bezierCurveTo(1110, 700, 1160, 820, 1250, 770); x.lineWidth = 7; x.strokeStyle = INK; x.stroke(); }
  marker(x, [[90, 230], [600, 480], [1310, 830]], seg01(cross, 0, .55), C.red, 30);
  marker(x, [[1300, 220], [700, 520], [100, 820]], seg01(cross, .45, 1), C.red, 30);
  if (thick > 0) { marker(x, [[80, 220], [600, 480], [1320, 840]], seg01(thick, 0, .5), '#c8261d', 70); marker(x, [[1310, 210], [700, 520], [90, 830]], seg01(thick, .5, 1), '#c8261d', 70); }
}
const seg01 = (k, a, b) => clamp((k - a) / (b - a));

// patient card
export const PC_W = 1400, PC_H = 940;
export function drawPatientCard(x, s = {}) {
  const { ring = 0, kb = 1, note = 0, noteK = 0 } = s, W = PC_W, H = PC_H;
  cardBase(x, W, H, '#fffdf6', 'rgba(47,143,138,.25)');
  x.beginPath(); x.moveTo(40, 120); x.lineTo(W - 40, 120); x.lineWidth = 6; x.strokeStyle = C.red; x.stroke();
  x.fillStyle = INK; x.font = '800 44px Fredoka'; x.fillText('KARTU PASIEN', 70, 92);
  x.font = '400 112px "Lilita One"'; x.fillStyle = INK; x.fillText('Perempuan, 26 tahun.', 70, 270);
  x.font = '600 74px Fredoka'; x.fillText('Nyeri perut bawah', 70, 410); x.fillText('sudah dari kemarin.', 70, 500);
  x.font = '800 70px Fredoka'; x.fillText('KB:', 70, 700);
  clipText(x, 'pil', 230, 715, kb, '190px "Caveat Brush"', INK);
  marker(x, curve(330, 660, 165, 110, -.3, TAU * 1.06), ring, C.red, 16);
  if (note) clipText(x, 'kadang lupa minum?', 560, 820, noteK, '130px "Caveat Brush"', C.navy);
  if (note && noteK > .98) marker(x, [[560, 850], [1320, 840]], 1, C.red, 10);
}

// triage sheet
export const TR_W = 1500, TR_H = 860;
export const VITALS = [['TD', '114/76', 'mmHg'], ['NADI', '94', 'x/mnt'], ['NAPAS', '18', 'x/mnt'], ['SUHU', '36,8', '°C']];
export function drawTriage(x, s = {}) {
  const { n = 4 } = s, W = TR_W, H = TR_H;
  cardBase(x, W, H, '#fffdf6');
  rr(x, 8, 8, W - 16, 130, [26, 26, 0, 0]); x.fillStyle = C.navy; x.fill();
  x.fillStyle = C.cream; x.font = '800 62px Fredoka'; x.fillText('LEMBAR TRIASE', 70, 98);
  x.strokeStyle = 'rgba(58,42,36,.4)'; x.lineWidth = 5; x.beginPath(); x.moveTo(W / 2, 160); x.lineTo(W / 2, H - 30); x.moveTo(30, 500); x.lineTo(W - 30, 500); x.stroke();
  VITALS.forEach((v, i) => {
    if (i >= n) return;
    const cx = i % 2 ? W / 2 + 50 : 70, cy = i < 2 ? 250 : 590;
    x.fillStyle = INK; x.font = '800 56px Fredoka'; x.fillText(v[0], cx, cy);
    x.fillStyle = C.teal; x.font = '400 190px "Lilita One"'; x.fillText(v[1], cx, cy + 190);
    const vw = x.measureText(v[1]).width; x.fillStyle = INK; x.font = '700 46px Fredoka'; x.fillText(v[2], cx + vw + 20, cy + 190);
  });
}
// shock index card
export const SI_W = 1000, SI_H = 620;
export function drawSI(x, s = {}) {
  const { val = '0,82', col = C.teal, sub = 'nadi ÷ sistolik = 94 ÷ 114' } = s, W = SI_W, H = SI_H;
  cardBase(x, W, H, C.cream);
  x.fillStyle = INK; x.font = '800 66px Fredoka'; x.fillText('SHOCK INDEX', 70, 130);
  x.font = '400 300px "Lilita One"'; x.lineWidth = 16; x.strokeStyle = INK; x.lineJoin = 'round'; x.strokeText(val, 70, 450); x.fillStyle = col; x.fillText(val, 70, 450);
  x.fillStyle = INK; x.font = '700 50px Fredoka'; x.fillText(sub, 70, 555);
}
// monitor
export const MO_W = 1500, MO_H = 900;
export function drawMonitor(x, s = {}) {
  const { hr = 108, bp = '96/60', t = 0, alarm = false, si = 0 } = s, W = MO_W, H = MO_H;
  x.clearRect(0, 0, W, H);
  rr(x, 8, 8, W - 16, H - 16, 40); x.fillStyle = '#2b3140'; x.fill(); x.lineWidth = 12; x.strokeStyle = INK; x.stroke();
  rr(x, 60, 60, W - 120, H - 170, 18); x.fillStyle = '#0f1726'; x.fill();
  // ECG
  x.save(); x.beginPath(); x.rect(80, 80, W - 160, 230); x.clip();
  x.strokeStyle = '#f2d16b'; x.lineWidth = 9; x.lineJoin = 'round'; x.beginPath();
  const per = 60 / hr * 420, off = (t * 420) % per;
  for (let px = 80; px <= W - 80; px += 6) {
    const u = ((px + off) % per) / per; let y = 230;
    if (u > .3 && u < .34) y -= 120 * Math.sin((u - .3) / .04 * Math.PI);
    if (u > .34 && u < .37) y += 40 * Math.sin((u - .34) / .03 * Math.PI);
    if (u > .5 && u < .62) y -= 22 * Math.sin((u - .5) / .12 * Math.PI);
    px === 80 ? x.moveTo(px, y) : x.lineTo(px, y);
  }
  x.stroke(); x.restore();
  x.fillStyle = '#e9eef5'; x.font = '800 56px Fredoka'; x.fillText('NADI', 110, 400); x.fillText('TD', W / 2 + 40, 400);
  x.font = '400 240px "Lilita One"'; x.fillStyle = alarm && Math.floor(t * 4) % 2 ? '#ffffff' : '#ff6a55'; x.fillText(String(hr), 110, 640);
  x.fillStyle = '#ffffff'; x.font = '400 190px "Lilita One"'; x.fillText(bp, W / 2 + 40, 640);
  x.fillStyle = '#9fb0c7'; x.font = '700 40px Fredoka'; x.fillText('x/mnt', 110, 700); x.fillText('mmHg', W / 2 + 40, 700);
  if (si > 0) { // shock index badge over the trace
    x.save(); x.translate(W - 330, 200); const k = clamp(si * 1.4); x.scale(k, k); x.rotate(-.04);
    rr(x, -260, -150, 520, 300, 30); x.fillStyle = C.cream; x.fill(); x.lineWidth = 12; x.strokeStyle = INK; x.stroke();
    x.fillStyle = INK; x.font = '800 52px Fredoka'; x.textAlign = 'center'; x.fillText('SHOCK INDEX', 0, -70);
    x.font = '400 190px "Lilita One"'; x.lineWidth = 14; x.strokeText('1,50', 0, 115); x.fillStyle = C.red; x.fillText('1,50', 0, 115); x.textAlign = 'left'; x.restore();
  }
  x.beginPath(); x.arc(W - 120, H - 55, 22, 0, TAU); x.fillStyle = alarm ? (Math.floor(t * 4) % 2 ? '#ff4b3a' : '#5a2020') : '#3fd17a'; x.fill();
}
// pregnancy test
export const TP_W = 1500, TP_H = 360;
export function drawTestpack(x, s = {}) {
  const { tline = 1 } = s, W = TP_W, H = TP_H;
  x.clearRect(0, 0, W, H);
  rr(x, 10, 40, W - 20, H - 80, 140); x.fillStyle = '#fffef8'; x.fill(); x.lineWidth = 12; x.strokeStyle = INK; x.stroke();
  rr(x, 10, 40, 340, H - 80, 140); x.fillStyle = C.teal; x.fill(); x.stroke();
  rr(x, 640, 110, 420, 140, 24); x.fillStyle = '#f6e3d6'; x.fill(); x.lineWidth = 8; x.stroke();
  x.fillStyle = C.red; x.fillRect(740, 125, 30, 110); if (tline > 0) { x.globalAlpha = tline; x.fillRect(930, 125, 30, 110); x.globalAlpha = 1; }
  x.fillStyle = INK; x.font = '800 44px Fredoka'; x.textAlign = 'center'; x.fillText('C', 755, 300); x.fillText('T', 945, 300); x.textAlign = 'left';
}
// ultrasound print
export const US_W = 1000, US_H = 760;
export function drawUSG(x) {
  const W = US_W, H = US_H;
  cardBase(x, W, H, '#fdfdfb');
  rr(x, 50, 50, W - 100, H - 170, 12); x.fillStyle = '#111521'; x.fill();
  x.save(); x.beginPath(); x.moveTo(W / 2, 90); x.lineTo(W / 2 - 330, H - 190); x.arc(W / 2, 90, 560, Math.PI / 2 + .64, Math.PI / 2 - .64, true); x.closePath(); x.clip();
  const R = mulberry(4); x.fillStyle = '#6f7484'; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(220,225,235,${R() * .35})`; x.fillRect(R() * W, R() * H, 3 + R() * 6, 2 + R() * 3); }
  x.fillStyle = '#05070c'; x.beginPath(); x.ellipse(W / 2 + 30, 420, 230, 110, .15, 0, TAU); x.fill(); x.beginPath(); x.ellipse(W / 2 - 160, 470, 120, 60, -.3, 0, TAU); x.fill();
  x.restore();
  x.fillStyle = INK; x.font = '800 54px Fredoka'; x.fillText('USG', 60, H - 50); x.font = '700 40px Fredoka'; x.fillStyle = C.red; x.textAlign = 'right'; x.fillText('cairan bebas', W - 60, H - 52); x.textAlign = 'left';
}
// the hanging banner (diagnosis)
export const BN_W = 1900, BN_H = 560;
export function drawBanner(x) {
  const W = BN_W, H = BN_H;
  x.clearRect(0, 0, W, H);
  x.beginPath(); x.moveTo(20, 30); x.lineTo(W - 20, 30); x.lineTo(W - 90, H / 2 + 10); x.lineTo(W - 20, H - 30); x.lineTo(20, H - 30); x.lineTo(90, H / 2 + 10); x.closePath();
  x.fillStyle = C.red; x.fill(); x.lineWidth = 14; x.strokeStyle = INK; x.lineJoin = 'round'; x.stroke();
  x.save(); x.globalAlpha = .35; x.fillStyle = x.createPattern(GRAIN, 'repeat'); x.fillRect(0, 0, W, H); x.restore();
  x.textAlign = 'center'; x.font = '400 160px "Lilita One"'; x.lineWidth = 18; x.strokeStyle = INK;
  for (const [s, y] of [['KEHAMILAN EKTOPIK', 240], ['TERGANGGU', 430]]) { x.strokeText(s, W / 2, y); x.fillStyle = '#fff4d6'; x.fillText(s, W / 2, y); }
  x.textAlign = 'left';
}
// chart drawn on the backdrop page
export function drawChartPage(x, PWp, PHp, s = {}) {
  const { kN = 1, kT = 1, tag = 1, drop = 1, foot = 1 } = s;
  paperFill(x, PWp, PHp, '#f6efdc', 41, .05);
  x.strokeStyle = 'rgba(47,143,138,.18)'; x.lineWidth = 2; for (let i = 0; i < PWp; i += 64) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, PHp); x.stroke(); } for (let j = 0; j < PHp; j += 64) { x.beginPath(); x.moveTo(0, j); x.lineTo(PWp, j); x.stroke(); }
  const X0 = 170, X1 = PWp - 140, Y0 = 330, Y1 = PHp - 360;
  x.strokeStyle = INK; x.lineWidth = 12; x.lineCap = 'round'; x.beginPath(); x.moveTo(X0, Y0 - 40); x.lineTo(X0, Y1); x.lineTo(X1 + 40, Y1); x.stroke();
  x.beginPath(); x.moveTo(X1 + 10, Y1 - 26); x.lineTo(X1 + 50, Y1); x.lineTo(X1 + 10, Y1 + 26); x.stroke();
  x.fillStyle = INK; x.font = '700 64px Fredoka'; x.textAlign = 'right'; x.fillText('perdarahan makin banyak', X1 + 40, Y1 + 100); x.textAlign = 'left';
  const px = u => lerp(X0, X1, u), py = v => lerp(Y1, Y0, v);
  const nadi = u => .35 + .55 * Math.pow(u, 1.15), td = u => u < .62 ? .62 - .03 * u : .6 - .5 * Math.pow((u - .62) / .38, 1.6);
  const line = (f, k, col) => { const pts = Array.from({ length: 61 }, (_, i) => [px(i / 60), py(f(i / 60))]); marker(x, pts, k, col, 26); };
  line(td, kT, C.teal); line(nadi, kN, C.red);
  x.font = '400 90px "Lilita One"';
  if (kN > .95) { x.fillStyle = C.red; x.textAlign = 'right'; x.fillText('Nadi', px(.8), py(nadi(.8)) - 50); x.textAlign = 'left'; }
  if (kT > .95) { x.fillStyle = C.teal; x.fillText('Tekanan darah', px(.31), py(td(.31)) - 46); }
  if (drop > 0) marker(x, curve(px(.88), py(.32), 110, 150, -1.2, TAU * .98), drop, C.red, 12);
  if (tag > 0) {
    x.save(); x.globalAlpha = clamp(tag * 3); const u = .26;
    x.setLineDash([22, 18]); x.lineWidth = 8; x.beginPath(); x.moveTo(px(u), Y0 - 20); x.lineTo(px(u), Y1); x.stroke(); x.setLineDash([]);
    for (const [f, col] of [[nadi, C.red], [td, C.teal]]) { x.beginPath(); x.arc(px(u), py(f(u)), 24, 0, TAU); x.fillStyle = col; x.fill(); x.lineWidth = 8; x.stroke(); }
    x.font = '800 66px Fredoka'; const tw = x.measureText('pasien ini di sini').width + 70;
    rr(x, px(u) - 50, Y0 - 160, tw, 110, 18); x.fillStyle = C.mustard; x.fill(); x.lineWidth = 9; x.stroke();
    x.fillStyle = INK; x.fillText('pasien ini di sini', px(u) - 15, Y0 - 82); x.restore();
  }
  if (foot > 0) { x.fillStyle = 'rgba(58,42,36,.8)'; x.font = 'italic 54px "IM Fell English"'; x.textAlign = 'right'; x.fillText('Ilustrasi, bukan skala sebenarnya.', X1 + 40, Y1 + 175); x.textAlign = 'left'; }
}
// a "check" flap card
export const CK_W = 1300, CK_H = 400;
export function drawCheck(x, n, label) {
  const W = CK_W, H = CK_H;
  cardBase(x, W, H, '#fffdf6');
  x.beginPath(); x.arc(200, H / 2, 130, 0, TAU); x.fillStyle = C.red; x.fill(); x.lineWidth = 12; x.strokeStyle = INK; x.stroke();
  x.fillStyle = C.cream; x.font = '400 200px "Lilita One"'; x.textAlign = 'center'; x.fillText(String(n), 200, H / 2 + 72); x.textAlign = 'left';
  x.fillStyle = INK; x.font = '700 104px Fredoka'; x.fillText(label, 380, H / 2 + 38);
}
export function drawStickyNote(x, W, H, k = [1, 1, 1]) {
  x.clearRect(0, 0, W, H);
  x.fillStyle = '#ffd95a'; x.fillRect(0, 0, W, H);
  x.save(); x.globalAlpha = .25; x.fillStyle = x.createPattern(GRAIN, 'repeat'); x.fillRect(0, 0, W, H); x.restore();
  const items = ['2 jalur infus besar', 'siapkan darah', 'telepon SpOG'];
  items.forEach((s, i) => {
    if (k[i] <= 0) return;
    const y = 230 + i * 250;
    rr(x, 50, y - 80, 84, 84, 12); x.lineWidth = 9; x.strokeStyle = INK; x.stroke();
    marker(x, [[72, y - 44], [96, y - 18], [134, y - 74]], clamp(k[i] * 2), C.red, 14);
    clipText(x, s, 160, y + 6, clamp(k[i] * 1.6 - .3), '106px "Caveat Brush"', C.navy);
  });
}

// ================= page art =================
export const PGW = 2048, PGH = 1396;
function pageGrain(x) { x.save(); x.globalAlpha = .7; x.fillStyle = x.createPattern(GRAIN, 'repeat'); x.fillRect(0, 0, PGW, PGH); x.restore(); }
function grad(x, stops) { const g = x.createLinearGradient(0, 0, 0, PGH); stops.forEach(([o, c]) => g.addColorStop(o, c)); x.fillStyle = g; x.fillRect(0, 0, PGW, PGH); }
export function pageWard(night = false) {
  const c = cv(PGW, PGH), x = c.getContext('2d');
  grad(x, night ? [[0, '#24364a'], [1, '#2f4658']] : [[0, '#bfe0dc'], [1, '#d9eee7']]);
  // wall tiles + window with night sky
  x.strokeStyle = night ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.35)'; x.lineWidth = 4;
  for (let i = 0; i < PGW; i += 128) { x.beginPath(); x.moveTo(i, PGH * .55); x.lineTo(i, PGH); x.stroke(); }
  x.beginPath(); x.moveTo(0, PGH * .55); x.lineTo(PGW, PGH * .55); x.lineWidth = 10; x.strokeStyle = night ? '#1b2836' : '#8cc2bc'; x.stroke();
  rr(x, PGW * .62, PGH * .1, PGW * .26, PGH * .32, 20); x.fillStyle = night ? '#0d1424' : '#1f3150'; x.fill(); x.lineWidth = 14; x.strokeStyle = INK; x.stroke();
  const R = mulberry(5); for (let i = 0; i < 30; i++) { x.beginPath(); x.arc(PGW * (.63 + R() * .24), PGH * (.12 + R() * .28), 2 + R() * 3, 0, TAU); x.fillStyle = 'rgba(255,245,210,.8)'; x.fill(); }
  x.beginPath(); x.arc(PGW * .82, PGH * .2, 44, 0, TAU); x.fillStyle = '#fff2c4'; x.fill();
  x.beginPath(); x.moveTo(PGW * .75, PGH * .1); x.lineTo(PGW * .75, PGH * .42); x.moveTo(PGW * .62, PGH * .26); x.lineTo(PGW * .88, PGH * .26); x.lineWidth = 10; x.strokeStyle = INK; x.stroke();
  // wall clock
  x.beginPath(); x.arc(PGW * .2, PGH * .22, 90, 0, TAU); x.fillStyle = '#fffaf0'; x.fill(); x.lineWidth = 12; x.strokeStyle = INK; x.stroke();
  x.beginPath(); x.moveTo(PGW * .2, PGH * .22); x.lineTo(PGW * .2, PGH * .22 - 60); x.moveTo(PGW * .2, PGH * .22); x.lineTo(PGW * .2 + 40, PGH * .22 + 20); x.lineWidth = 10; x.stroke();
  if (night) { x.fillStyle = 'rgba(10,15,30,.25)'; x.fillRect(0, 0, PGW, PGH); }
  pageGrain(x); return c;
}
export function floorWard(night = false) {
  const c = cv(PGW, PGH), x = c.getContext('2d');
  x.fillStyle = night ? '#3b4f5d' : '#d6e7e4'; x.fillRect(0, 0, PGW, PGH);
  x.strokeStyle = night ? 'rgba(255,255,255,.07)' : 'rgba(80,120,120,.18)'; x.lineWidth = 5;
  for (let i = 0; i < PGW; i += 160) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, PGH); x.stroke(); }
  for (let j = 0; j < PGH; j += 160) { x.beginPath(); x.moveTo(0, j); x.lineTo(PGW, j); x.stroke(); }
  pageGrain(x); return c;
}
export function pagePlain(top, bot, deco) {
  const c = cv(PGW, PGH), x = c.getContext('2d'); grad(x, [[0, top], [1, bot]]);
  if (deco) deco(x); pageGrain(x); return c;
}
export function pageChecklist() {
  return pagePlain('#bfe3c9', '#d9efdc', x => {
    x.textAlign = 'center'; x.font = '400 200px "Lilita One"'; x.lineWidth = 22; x.strokeStyle = INK; x.lineJoin = 'round';
    x.strokeText('Cek 3 hal ini', PGW / 2, PGH * .3); x.fillStyle = '#fff4d6'; x.fillText('Cek 3 hal ini', PGW / 2, PGH * .3); x.textAlign = 'left';
  });
}
