// "Buku Jaga IGD": a pop-up book on a night-shift desk replays an ER case.
// Scene + timeline + render(t). Engine modules (book, paper, cutmesh, post, lib) from the Lemo-Opuscar paper-popup demo (MIT).
import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clamp, lerp, seg, ss, eio, eo, back, spring, TAU, mulberry, track } from './lib.js';
import * as A from './art.js';
import { cv, finishCut, INK } from './paper.js';
import { makeBook, coverCanvases, texOf, BW, BD, PG } from './book.js';
import { cutMesh, blobShadow, thread } from './cutmesh.js';
import { makePost } from './post.js';

const W = 1080, H = 1920, DUR = 74, AS = '/core/assets/polyhaven/';
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setSize(W, H); renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NeutralToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('stage').appendChild(renderer.domElement);
const ov = document.getElementById('ov'), OX = ov.getContext('2d');
const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(42, W / H, .004, 30);
const post = makePost(renderer, scene, cam, W, H);

// ---------- assets ----------
const fonts = ['500 40px Fredoka', '600 40px Fredoka', '700 40px Fredoka', '800 40px Fredoka', '40px "Lilita One"', 'italic 40px "IM Fell English"', '40px "Caveat Brush"'];
await Promise.all(fonts.map(f => document.fonts.load(f, 'AaBb0123,.?:÷°')));
const hdr = await new RGBELoader().loadAsync(AS + 'lythwood_lounge_2k.hdr'); hdr.mapping = THREE.EquirectangularReflectionMapping;
scene.environment = hdr; scene.background = hdr; scene.backgroundBlurriness = .3;
scene.backgroundRotation.set(0, 2.3, 0); scene.environmentRotation.set(0, 2.3, 0);
const tl = new THREE.TextureLoader();
const wt = n => { const t = tl.load(AS + `walnut_${n}.jpg`); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2.2, 1.4); t.anisotropy = 8; return t; };
const wdiff = wt('diff'); wdiff.colorSpace = THREE.SRGBColorSpace;
const desk = new THREE.Mesh(new THREE.BoxGeometry(2.6, .04, 1.7), new THREE.MeshStandardMaterial({ map: wdiff, normalMap: wt('nor'), roughnessMap: wt('rough'), color: '#b8987c', envMapIntensity: .7 }));
desk.position.set(0, -.02, .25); desk.receiveShadow = true; scene.add(desk);
const gl = new GLTFLoader();
async function prop(name, x, z, s, ry) {
  const m = (await gl.loadAsync(AS + `${name}/${name}.gltf`)).scene;
  m.position.set(x, 0, z); m.scale.setScalar(s); m.rotation.y = ry;
  m.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  scene.add(m); return m;
}
const lamp = await prop('desk_lamp_arm_01', -.347, .51, .55, -.76);
const lampGlass = [];
lamp.traverse(o => { if (o.isMesh && o.material.name.includes('light')) { o.material = o.material.clone(); o.material.emissive = new THREE.Color('#ffd9a0'); o.material.emissiveIntensity = 6; lampGlass.push(o.material); } });
const tea = await prop('tea_set_01', 0, 0, 1, 0);
{ const keep = { tea_set_01_cup_small_01: [.33, .47, 2.2], tea_set_01_saucer_circular_04: [.33, .47, 0] }, dead = [];
  tea.traverse(o => { if (!o.name.startsWith('tea_set_01_')) return; const k = keep[o.name]; if (!k) dead.push(o); else { o.position.x = k[0]; o.position.z = k[1]; o.rotation.y = k[2]; } });
  dead.forEach(o => o.parent && o.parent.remove(o)); }
// the real sticky note (appears on the desk in the reveal)
const SN = 900, snC = cv(SN, SN), snT = texOf(snC);
const sticky = new THREE.Group();
{ const top = new THREE.Mesh(new THREE.PlaneGeometry(.17, .17), new THREE.MeshStandardMaterial({ map: snT, roughness: .85 })); top.rotation.x = -Math.PI / 2; top.position.y = .0006; top.receiveShadow = true;
  const curl = new THREE.Mesh(new THREE.PlaneGeometry(.17, .012), new THREE.MeshStandardMaterial({ color: '#f5cf4e', roughness: .85, side: THREE.DoubleSide })); curl.position.set(0, .002, .085); curl.rotation.x = -Math.PI / 2 + .35;
  sticky.add(top); sticky.position.set(.0, 0, .385); sticky.rotation.y = .06; scene.add(sticky); sticky.userData.top = top; }

// ---------- book ----------
const book = makeBook(coverCanvases((x, cx, cy, r) => {
  // cover medallion: a little paper cross
  x.fillStyle = '#e9f4f1'; x.fillRect(cx - r, cy - r, 2 * r, 2 * r);
  x.fillStyle = '#d8423a'; x.fillRect(cx - r * .18, cy - r * .55, r * .36, r * 1.1); x.fillRect(cx - r * .55, cy - r * .18, r * 1.1, r * .36);
}));
scene.add(book.root);
const PT = {
  ward: texOf(A.pageWard(false)), wardN: texOf(A.pageWard(true)), floor: texOf(A.floorWard(false)), floorN: texOf(A.floorWard(true)),
  red: texOf(A.pagePlain('#e7a08f', '#f1c4b4')), redF: texOf(A.pagePlain('#f2d3c6', '#f7e2d8')),
  cream: texOf(A.pagePlain('#f6efdc', '#f6efdc')), green: texOf(A.pageChecklist()), greenF: texOf(A.pagePlain('#cfe9d4', '#e1f2e3')),
};
const chartC = cv(A.PGW, A.PGH), chartT = texOf(chartC); let chartKey = '';
const SPREADS = [{ sky: PT.ward, ground: PT.floor }, { sky: PT.red, ground: PT.redF }, { sky: chartT, ground: PT.cream }, { sky: PT.green, ground: PT.greenF }];
const TURNS = [[37.4, 38.6], [45.4, 46.6], [55.9, 57.1]];
const spreadAt = t => TURNS.filter(([a, b]) => t >= (a + b) / 2).length;

// ---------- pop-up machinery ----------
const POPS = [];
function popper(parent, item, x, y, z, t0, t1, o = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z);
  const m = o.mesh || cutMesh(item, o); g.add(m); parent.add(g);
  const r = { g, m, t0, t1, dir: o.dir ?? (z > .15 ? 1 : -1), sway: o.sway || 0, ph: x * 40, d: o.d ?? .55, ev: o.ev !== false };
  POPS.push(r); return r;
}
function rise(r, t) { const up = back(seg(t, r.t0, r.t0 + r.d), 1.7), dn = 1 - ss(seg(t, r.t1, r.t1 + .4)); return Math.min(up, dn); }
// a front card whose art is a redrawable canvas
function cardMesh(Wpx, Hpx, wm, draw) {
  const c = cv(Wpx, Hpx), t = texOf(c), hm = wm * Hpx / Wpx;
  const mat = new THREE.MeshStandardMaterial({ map: t, alphaTest: .5, roughness: .88, side: THREE.FrontSide });
  const back = new THREE.MeshStandardMaterial({ color: '#efe8da', alphaMap: t, alphaTest: .5, roughness: .92, side: THREE.BackSide });
  const geo = new THREE.PlaneGeometry(wm, hm); geo.translate(0, hm / 2, 0);
  const f = new THREE.Mesh(geo, mat), b = new THREE.Mesh(geo, back);
  f.castShadow = true; f.receiveShadow = true; f.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: t, alphaTest: .5 });
  const g = new THREE.Group(); g.add(f, b);
  let key = null;
  g.userData = { w: wm, h: hm, redraw(s) { const k = JSON.stringify(s); if (k === key) return; key = k; draw(c.getContext('2d'), s); t.needsUpdate = true; } };
  g.userData.redraw({});
  return g;
}
const S = book.stage;

// spread 0: the ward (pieces rise back to front)
const S0 = [0.25, TURNS[0][0]];
popper(S, A.curtain(.2, .15, '#7fc4bd'), -.11, 0, .012, S0[0] + .0, S0[1]);
popper(S, A.ivPole(.13), -.005, 0, .03, S0[0] + .08, S0[1], { sway: .01 });
popper(S, A.bed(.19), .045, 0, .06, S0[0] + .16, S0[1]);
popper(S, A.doorWC(.12), .175, 0, .02, S0[0] + .1, S0[1]);

// characters
function makePerson(Sk, H = .074) {
  const c = cv(A.PW, A.PH), t = texOf(c), w = H * A.PW / A.PH;
  const geo = new THREE.PlaneGeometry(w, H); geo.translate(0, H / 2 - H * .04, 0);
  const mat = new THREE.MeshStandardMaterial({ map: t, alphaTest: .5, roughness: .86, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat); mesh.castShadow = true; mesh.receiveShadow = true;
  mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: t, alphaTest: .5, side: THREE.DoubleSide });
  const root = new THREE.Group(), body = new THREE.Group(); body.add(mesh); root.add(body);
  const shadow = blobShadow(H * .28, .45);
  let key = '';
  return { root, body, shadow, H,
    pose(p) { const k = JSON.stringify(p, (kk, v) => typeof v === 'number' ? Math.round(v * 30) / 30 : v); if (k === key) return; key = k; const o = finishCut((() => { const a = cv(A.PW, A.PH); A.drawPerson(a.getContext('2d'), Sk, p); return a; })(), 12); const x = c.getContext('2d'); x.clearRect(0, 0, A.PW, A.PH); x.drawImage(o, 0, 0); t.needsUpdate = true; },
    head(v = new THREE.Vector3()) { return v.set(0, H * .92, 0).applyMatrix4(body.matrixWorld); } };
}
const patient = makePerson(A.PATIENT), doctor = makePerson(A.DOCTOR, .078);
S.add(patient.root, patient.shadow, doctor.root, doctor.shadow);
const blinkAt = (t, o = 0) => { const p = (t + o) % 3.3; return p < .12 ? Math.sin(p / .12 * Math.PI) : 0; };
const BED_TOP = .062, BED_X = .03, BED_Z = .068;
function walkP(t, t0, t1, a, b) { const k = seg(t, t0, t1), x = lerp(a[0], b[0], k), z = lerp(a[1], b[1], k), d = Math.hypot(b[0] - a[0], b[1] - a[1]) * k; return { x, z, ph: d / .014 * TAU, moving: t > t0 && t < t1 }; }
// talking: mouth flaps while a bubble is up
const talk = (t, t0, t1) => t > t0 && t < t1 ? Math.abs(Math.sin((t - t0) * 13)) : 0;
function patientState(t) {
  const s = { vis: false, x: BED_X, y: BED_TOP, z: BED_Z, face: 1, scale: 1, pose: { sit: 1, mouth: 'pain', blink: blinkAt(t), armL: .5, armR: .5 } };
  const P = s.pose;
  if (t < 7.0 || t >= 37.5) return s;
  s.vis = true; s.scale = eo(seg(t, 7.0, 7.35));
  // hand on the lower belly: arms bent inward
  P.armL = -.55; P.armR = -.55;
  if (t > 18.3 && t < 22.0) { P.open = talk(t, 18.3, 21.6) * .8; P.mouth = 'calm'; P.armR = .2; }
  if (t > 25.0 && t < 27.5) { P.open = talk(t, 25.0, 27.0) * .7; P.look = .5; }
  if (t >= 29.2 && t < 30.6) { // stands, walks to the WC
    const w = walkP(t, 29.4, 30.5, [BED_X, BED_Z + .02], [.17, .05]); P.sit = 0; s.y = 0; s.x = w.x; s.z = w.z + .012; P.walk = w.ph; P.stride = w.moving ? 1 : 0; s.face = 1; s.scale = 1 - ss(seg(t, 30.35, 30.55));
  }
  if (t >= 30.6 && t < 31.0) s.vis = false;
  if (t >= 31.0) { // back, pale
    P.pale = ss(seg(t, 31.0, 31.6)); P.sweat = ss(seg(t, 31.4, 32)); P.mouth = 'pain';
    if (t < 32.0) { const w = walkP(t, 31.05, 31.95, [.17, .05], [BED_X, BED_Z + .02]); P.sit = 0; s.y = 0; s.x = w.x; s.z = w.z + .012; P.walk = w.ph; P.stride = w.moving ? 1 : 0; s.face = -1; s.scale = eo(seg(t, 31.0, 31.2)); }
    else { P.blink = Math.max(blinkAt(t), t > 34.8 ? .9 : 0); }
  }
  return s;
}
function doctorState(t) {
  const s = { vis: false, x: -.165, y: 0, z: .115, face: 1, scale: 1, pose: { mouth: 'calm', blink: blinkAt(t, 1.4), armL: .15, armR: .2 } };
  if (t < 7.2 || t >= 37.5) return s;
  s.vis = true; s.scale = eo(seg(t, 7.2, 7.55));
  const P = s.pose;
  if (t > 19.4 && t < 21.3) { P.armR = 1.3 + Math.sin(t * 30) * .08; P.pen = true; P.look = .6; }
  if (t > 25.0 && t < 30.4) { P.mouth = 'flat'; P.look = .8; }
  if (t > 31.0) { P.mouth = 'flat'; P.look = .8; P.armL = .25; P.armR = .25; }
  return s;
}

// front info cards
const cards = {};
function frontCard(name, Wpx, Hpx, wm, draw, x, z, t0, t1, o = {}) { const m = cardMesh(Wpx, Hpx, wm, draw); const r = popper(S, null, x, o.y ?? 0, z, t0, t1, { mesh: m, dir: 1, d: o.d }); r.g.rotation.order = 'YXZ'; if (o.ry) m.rotation.y = o.ry; cards[name] = r; return r; }
frontCard('resep', A.RES_W, A.RES_H, .25, A.drawResep, 0, .245, .35, 6.15);
frontCard('pc', A.PC_W, A.PC_H, .25, A.drawPatientCard, 0, .25, 6.85, 11.75);
frontCard('tri', A.TR_W, A.TR_H, .25, A.drawTriage, -.02, .225, 12.45, 17.75);
frontCard('si', A.SI_W, A.SI_H, .14, A.drawSI, .075, .275, 14.8, 17.75, { d: .4 });
frontCard('resep2', A.RES_W, A.RES_H, .16, A.drawResep, -.085, .2, 19.0, 22.8, { ry: .3 });
frontCard('pc2', A.PC_W, A.PC_H, .25, A.drawPatientCard, 0, .25, 25.95, 30.3);
frontCard('mon', A.MO_W, A.MO_H, .25, A.drawMonitor, 0, .215, 31.6, 37.3);
frontCard('tp', A.TP_W, A.TP_H, .25, A.drawTestpack, -.03, .2, 38.55, 45.3);
frontCard('usg', A.US_W, A.US_H, .15, A.drawUSG, .1, .27, 40.2, 45.3, { d: .4 });
frontCard('ck1', A.CK_W, A.CK_H, .23, (x) => A.drawCheck(x, 1, 'Tes kehamilan'), 0, .09, 59.95, 65.2);
frontCard('ck2', A.CK_W, A.CK_H, .23, (x) => A.drawCheck(x, 2, 'Hitung shock index'), 0, .165, 60.55, 65.2);
frontCard('ck3', A.CK_W, A.CK_H, .23, (x) => A.drawCheck(x, 3, 'Cari cairan bebas'), 0, .24, 61.15, 65.2);
frontCard('resep3', A.RES_W, A.RES_H, .25, A.drawResep, 0, .2, 65.75, 71.9);
// diagnosis banner on strings (backdrop frame)
const banner = new THREE.Group();
{ const m = cardMesh(A.BN_W, A.BN_H, .3, A.drawBanner); m.position.y = -.3 * A.BN_H / A.BN_W; banner.add(m);
  for (const dx of [-.12, .12]) { const th = thread(.4); th.position.set(dx, 0, -.0004); banner.add(th); }
  book.sky.add(banner); banner.position.set(0, .5, .05); }

// ---------- lights ----------
const lampHead = new THREE.Vector3(-.28, .375, .44);
const spot = new THREE.SpotLight('#fff0dc', 0, 3, .75, .55, 2); spot.position.copy(lampHead); spot.target.position.set(.02, 0, .15);
spot.castShadow = true; spot.shadow.mapSize.set(2048, 2048); spot.shadow.bias = -.00006; spot.shadow.normalBias = .0004; spot.shadow.radius = 4; spot.shadow.camera.near = .05; spot.shadow.camera.far = 2;
scene.add(spot, spot.target);
const fill = new THREE.DirectionalLight('#fff3e0', 1.2); fill.position.set(.35, .6, .8); fill.target.position.set(0, .05, .12); scene.add(fill, fill.target);
const hemi = new THREE.HemisphereLight('#cfe6ff', '#caa27a', .35); scene.add(hemi);
const RED = new THREE.Color('#ff3b2a'), WARM = new THREE.Color('#fff0dc'), COOL = new THREE.Color('#bcd2ff');
function lightsAt(t) {
  const alarm = (t >= 2.0 && t < 2.25) || (t >= 2.45 && t < 2.7);
  const alarm2 = t >= 34.8 && t < 37.4 && Math.floor((t - 34.8) * 2) % 2 === 0;
  const night = ss(seg(t, 30.3, 31.0)) * (1 - ss(seg(t, 37.4, 38.2)));
  return { alarm: alarm || alarm2, night, spotI: (alarm ? 5 : alarm2 ? 2.6 : 1.7 - night * .9), fillI: .55 - night * .38 + (t > 46 && t < 56.5 ? .15 : 0), hemiI: .22 - night * .14, env: .3 - night * .16 };
}

// ---------- camera ----------
// [t, px,py,pz, tx,ty,tz, fov, aper]; a new list = hard cut (world coordinates, page surface ≈ y 0)
const SH = [
  [[0, 0, .78, 1.3, 0, .05, .2, 40, 2.0], [3.5, 0, .62, 1.12, 0, .07, .17, 40, 2.0], [6.5, 0, .58, 1.06, 0, .07, .17, 40, 2.0]],
  [[6.5, -.1, .55, 1.02, .0, .07, .15, 40, 2.0], [12, -.06, .53, .98, .0, .07, .15, 40, 2.0]],
  [[12, 0, .66, .9, 0, .04, .18, 40, 2.0], [18, 0, .62, .86, 0, .04, .18, 40, 2.0]],
  [[18, .05, .4, .86, -.03, .07, .13, 40, 2.2], [23, .05, .38, .8, -.03, .07, .13, 40, 2.2]],
  [[23, .05, .17, .42, .035, .085, .07, 38, 2.8], [25.6, .05, .18, .46, .035, .085, .07, 38, 2.8], [26.6, 0, .55, 1.02, 0, .07, .15, 40, 2.0], [30.5, -.02, .53, 1.0, 0, .07, .15, 40, 2.0]],
  [[30.5, 0, .56, 1.04, 0, .07, .15, 40, 2.0], [38, 0, .5, .94, 0, .07, .15, 40, 2.0]],
  [[38, 0, .6, 1.08, 0, .06, .22, 40, 2.0], [42, 0, .57, 1.04, 0, .06, .22, 40, 2.0], [46.6, 0, .56, 1.02, 0, .06, .22, 40, 2.0]],
  [[46.6, 0, .2, 1.12, 0, .18, .03, 40, 1.8], [56.5, 0, .19, 1.06, 0, .18, .03, 40, 1.8]],
  [[56.5, 0, .62, .98, 0, .06, .15, 40, 2.0], [65.5, 0, .6, .94, 0, .06, .15, 40, 2.0]],
  [[65.5, 0, .58, 1.02, 0, .06, .17, 40, 2.0], [70, 0, .64, 1.1, 0, .05, .17, 40, 2.0], [74, 0, .95, 1.45, 0, .03, .15, 40, 1.8]],
];
const SHOTS = SH.map(k => ({ t0: k[0][0], f: track(k.map(q => [q[0], q.slice(1)])) }));
const LIFT = [.07, .07, .07, .03, .0, .07, .08, .05, .08, .07];
function camAt(t) { let s = SHOTS[0], si = 0; SHOTS.forEach((q, i) => { if (t >= q.t0) { s = q; si = i; } }); const v = s.f(t); v[4] += LIFT[si] * (si === 4 && t < 26.6 ? 0 : 1); return { pos: new THREE.Vector3(v[0], v[1], v[2]), tgt: new THREE.Vector3(v[3], v[4], v[5]), fov: v[6], aper: v[7] }; }

// ---------- overlay text (2D, the film's copy) ----------
const HL = [ // headlines: [id, text, t0, t1]
  ['h1', 'Jaga IGD, ketemu perempuan usia produktif nyeri perut?', .15, 6.5],
  ['h2', 'Perempuan, 26 tahun. Nyeri perut bawah sudah dari kemarin.', 6.8, 12],
  ['h3', 'Semua kelihatan stabil.', 12.3, 18],
  ['h5', 'Lalu dia bilang satu kalimat.', 23.2, 30.5],
  ['h6', 'Balik dari kamar mandi, mukanya pucat.', 30.8, 38],
  ['h7', 'Tes kehamilan: positif.', 38.3, 46],
  ['h8', 'Badan perempuan muda jago menutupi perdarahan.', 47.3, 56.5],
  ['h9', 'Perempuan usia produktif + nyeri perut:', 56.8, 65.5],
  ['h10a', 'Yang tadi hampir pulang bawa obat maag,', 66.8, 73.4],
];
const HL2 = [['h7b', 'USG: perutnya sudah penuh darah.', 39.8, 46, 'h7'], ['t8', 'Tekanan darahnya biasanya turun paling akhir.', 49.6, 56.5, 'h8'], ['h10b', 'sekarang sudah di kamar operasi.', 68.0, 73.4, 'h10a']];
const CAP = [ // captions on a paper strip: [id, text (keyword between *), t0, t1]
  ['c1', 'Cek *3 hal* ini sebelum meresepkan obat maag.', 2.0, 6.5],
  ['c2', 'Baris ini nanti jadi *masalah*.', 8.8, 12],
  ['c3', 'Perutnya nyeri tekan, tapi *lemas*.', 14.4, 18],
  ['c4', 'Resepnya sudah *setengah* aku tulis.', 19.3, 23],
  ['c5', 'Belum sempat dites, dia minta ke *kamar mandi*.', 26.4, 30.5],
  ['c6', 'Test pack tadi masih di *meja*.', 34.8, 38],
  ['c8a', 'Yang bikin aku kepikiran: kenapa tensinya tadi bisa *bagus*?', 46.3, 52.5],
  ['c8b', 'Ada *3 hal* yang mestinya aku cek dari awal.', 52.6, 56.5],
  ['c9', 'Tes kehamilan dulu. Apa pun kata *KB*-nya.', 57.6, 65.5],
  ['c10', 'Simpan buat jaga berikutnya.', 70.0, 73.4],
];
const BUB = [['b4', 'patient', 'Maag kayaknya, Dok. Kasih obat terus pulang aja ya?', 18.3, 23], ['b5', 'patient', 'Bulan ini haidnya cuma flek, Dok.', 25.0, 30.5]];
function wrapL(x, text, maxW) { const ws = text.split(' '), L = []; let c = ''; for (const w of ws) { const t = c ? c + ' ' + w : w; if (c && x.measureText(t.replace(/\*/g, '')).width > maxW) { L.push(c); c = w; } else c = t; } if (c) L.push(c); return L; }
const BOX = {};   // id → [x0,y0,x1,y1] of what is on screen this frame
function headline(id, text, t0, t1, y, size = 84) {
  if (TNOW < t0 || TNOW >= t1) return y;
  const x = OX; x.save(); x.font = `${size}px "Lilita One"`; x.textBaseline = 'alphabetic'; x.lineJoin = 'round';
  const L = wrapL(x, text, 940), lh = size * 1.12, k = back(seg(TNOW, t0, t0 + .32), 2);
  x.translate(70, y); x.scale(k, k); x.translate(-70, -y);
  x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = 22;
  L.forEach((l, i) => { x.lineWidth = 16; x.strokeStyle = '#2a1c15'; x.strokeText(l, 70, y + i * lh); });
  x.shadowBlur = 0; L.forEach((l, i) => { x.fillStyle = '#fff6df'; x.fillText(l, 70, y + i * lh); });
  x.restore();
  const wmax = Math.max(...L.map(l => { x.font = `${size}px "Lilita One"`; return x.measureText(l).width; }));
  BOX[id] = [62, y - size, 70 + wmax + 10, y + (L.length - 1) * lh + size * .3];
  return y + L.length * lh;
}
function caption(id, text, t0, t1, cy) {
  if (TNOW < t0 || TNOW >= t1) return;
  const x = OX, size = 52; x.save(); x.font = `700 ${size}px Fredoka`;
  const L = wrapL(x, text, 860), lh = size * 1.25, w = Math.max(...L.map(l => x.measureText(l.replace(/\*/g, '')).width)) + 80, h = L.length * lh + 50;
  const k = back(seg(TNOW, t0, t0 + .3), 2.2), y0 = cy - h / 2;
  x.translate(540, cy); x.rotate(-.012); x.scale(k, k); x.translate(-540, -cy);
  x.fillStyle = 'rgba(40,25,15,.3)'; x.beginPath(); x.roundRect(540 - w / 2 + 10, y0 + 12, w, h, 22); x.fill();
  x.fillStyle = '#fffaf0'; x.beginPath(); x.roundRect(540 - w / 2, y0, w, h, 22); x.fill(); x.lineWidth = 7; x.strokeStyle = INK; x.stroke();
  x.textBaseline = 'alphabetic'; let hi = false;
  L.forEach((l, i) => {
    const plain = l.replace(/\*/g, ''); let px = 540 - x.measureText(plain).width / 2; const py = y0 + 25 + size * .95 + i * lh;
    for (const part of l.split(/(\*)/)) { if (part === '*') { hi = !hi; continue; } x.fillStyle = hi ? '#d8423a' : '#2a1c15'; x.fillText(part, px, py); px += x.measureText(part).width; }
  });
  x.restore();
  BOX[id] = [540 - w / 2, y0, 540 + w / 2, y0 + h];
}
function bubble(id, text, t0, t1, an) {
  if (TNOW < t0 || TNOW >= t1 || !an) return;
  const x = OX, size = 56; x.save(); x.font = `600 ${size}px Fredoka`;
  const L = wrapL(x, text, 780), lh = size * 1.2, w = Math.max(...L.map(l => x.measureText(l).width)) + 90, h = L.length * lh + 70;
  const top = Math.max(300, ...Object.entries(BOX).filter(([k]) => k[0] === 'h').map(([, b]) => b[3] + 40)), bx = clamp(an[0] - w * .45, 50, W - 50 - w), by = clamp(an[1] - h - 110, top, 1300 - h), tx = clamp(an[0], bx + 60, bx + w - 60);
  const k = back(seg(TNOW, t0, t0 + .25), 2.2);
  x.translate(tx, by + h); x.scale(k, k); x.translate(-tx, -(by + h));
  x.fillStyle = 'rgba(40,25,15,.25)'; x.beginPath(); x.roundRect(bx + 8, by + 12, w, h, 46); x.fill();
  x.beginPath(); x.roundRect(bx, by, w, h, 46); x.moveTo(tx - 28, by + h - 2); x.lineTo(lerp(tx, an[0], .8), Math.min(an[1] - 14, by + h + 90)); x.lineTo(tx + 24, by + h - 2);
  x.fillStyle = '#fffdf8'; x.fill(); x.lineWidth = 7; x.strokeStyle = INK; x.lineJoin = 'round';
  x.beginPath(); x.roundRect(bx, by, w, h, 46); x.stroke();
  x.beginPath(); x.moveTo(tx - 28, by + h); x.lineTo(lerp(tx, an[0], .8), Math.min(an[1] - 14, by + h + 90)); x.lineTo(tx + 24, by + h); x.stroke();
  x.fillStyle = '#fffdf8'; x.fillRect(tx - 24, by + h - 9, 44, 10);
  x.fillStyle = '#241814'; x.textBaseline = 'alphabetic'; L.forEach((l, i) => x.fillText(l, bx + 45, by + 35 + size * .9 + i * lh));
  x.restore(); BOX[id] = [bx, by, bx + w, by + h];
}

// texts printed on the 3D cards (for readcheck): [id, text, card, t0, t1]
const CARDTXT = [
  ['k2b', 'KB: pil', 'pc', 8.3, 11.75],
  ['k3', 'TD 114/76 · NADI 94 · NAPAS 18 · SUHU 36,8', 'tri', 13.0, 17.75], ['k3si', 'SHOCK INDEX 0,82', 'si', 15.2, 17.75],
  ['k5', 'kadang lupa minum?', 'pc2', 26.4, 30.3], ['k6', 'NADI 126 · TD 84/52', 'mon', 34.4, 37.3], ['k6si', 'SHOCK INDEX 1,50', 'mon', 34.7, 37.3],
  ['k7', 'KEHAMILAN EKTOPIK TERGANGGU', 'banner', 42.3, 45.85], ['k7s0', '2 jalur infus besar', 'sticky', 43.6, 46.6], ['k7s1', 'siapkan darah', 'sticky', 43.95, 46.6], ['k7s2', 'telepon SpOG', 'sticky', 44.3, 46.6],
  ['k8', 'pasien ini di sini', 'chart', 50.5, 56], ['k9a', '1 Tes kehamilan', 'ck1', 60.5, 65.2], ['k9b', '2 Hitung shock index', 'ck2', 61.1, 65.2], ['k9c', '3 Cari cairan bebas', 'ck3', 61.7, 65.2],
];

// ---------- sound events ----------
const EV = [];
for (const r of POPS) if (r.ev) EV.push({ t: r.t0 + .08, type: 'pop' }), r.t1 < DUR && EV.push({ t: r.t1 + .05, type: 'fold' });
for (const [a, b] of TURNS) EV.push({ t: a + .05, type: 'page', d: b - a });
EV.push({ t: 2.0, type: 'marker', d: .3 }, { t: 2.35, type: 'marker', d: .25 }, { t: 2.0, type: 'alarm' }, { t: 7.0, type: 'puff' }, { t: 7.2, type: 'puff' });
EV.push({ t: 8.3, type: 'pen', d: .4 }, { t: 8.8, type: 'marker', d: .4 }, { t: 19.6, type: 'pen', d: .8 }, { t: 20.6, type: 'pen', d: .5 }, { t: 26.4, type: 'pen', d: .7 }, { t: 27.1, type: 'marker', d: .3 });
EV.push({ t: 18.3, type: 'bubble' }, { t: 25.0, type: 'bubble' }, { t: 30.5, type: 'door' }, { t: 31.0, type: 'door' });
EV.push({ t: 34.8, type: 'alarm' }, { t: 35.8, type: 'alarm' }, { t: 36.8, type: 'alarm' });
EV.push({ t: 40.0, type: 'roll', d: 1.5 }, { t: 42.0, type: 'banner' }, { t: 43.0, type: 'sticky' });
for (let i = 0; i < 3; i++) EV.push({ t: 43.15 + i * .35, type: 'pen', d: .3 });
EV.push({ t: 47.8, type: 'marker', d: 1.0 }, { t: 48.1, type: 'marker', d: 1.2 }, { t: 50.1, type: 'marker', d: .4 }, { t: 50.3, type: 'tick' });
for (let i = 0; i < 3; i++) EV.push({ t: 60.0 + i * .6, type: 'bell', n: i });
EV.push({ t: 66.6, type: 'marker', d: .3 }, { t: 66.9, type: 'marker', d: .3 }, { t: 72.3, type: 'creak' }, { t: 73.05, type: 'close' }, { t: 72.4, type: 'tag' });
const HRf = t => t < 32.4 ? 108 : t < 34.4 ? Math.round(lerp(108, 126, seg(t, 32.4, 34.4))) : 126;
for (let tb = 31.7; tb < 37.4; tb += 60 / HRf(tb)) EV.push({ t: +tb.toFixed(3), type: 'beep' });
for (const [id, who, text, t0] of BUB) for (let i = 0; i < text.length; i += 2) if (/[A-Za-z]/.test(text[i])) EV.push({ t: t0 + .1 + i / 40, type: 'blip' });
{ let prev = 0; for (let f = 0; f < DUR * 30; f++) { const t = f / 30, s = patientState(t), ph = s.pose.walk || 0; if (s.vis && s.pose.stride && Math.floor(ph / Math.PI) !== Math.floor(prev / Math.PI)) EV.push({ t, type: 'step' }); prev = ph; } }
EV.sort((a, b) => a.t - b.t);
window.EV = EV; window.DUR = DUR;

// ---------- render ----------
let TNOW = 0;
const tmp = new THREE.Vector3();
function toScreen(v) { const p = v.clone().project(cam); if (p.z > 1) return null; return [(p.x * .5 + .5) * W, (-p.y * .5 + .5) * H]; }
function boxOf(obj) {
  const b = new THREE.Box3().setFromObject(obj); if (b.isEmpty()) return null;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const cx of [b.min.x, b.max.x]) for (const cy of [b.min.y, b.max.y]) for (const cz of [b.min.z, b.max.z]) { const s = toScreen(new THREE.Vector3(cx, cy, cz)); if (!s) return null; x0 = Math.min(x0, s[0]); y0 = Math.min(y0, s[1]); x1 = Math.max(x1, s[0]); y1 = Math.max(y1, s[1]); }
  return [x0, y0, x1, y1];
}
const LT = { banner, sticky };

window.render = function (t, noGL) {
  TNOW = t;
  for (const k in BOX) delete BOX[k];
  // book open; closes at the end
  book.setOpen(Math.PI / 2 * (1 - eio(seg(t, 72.3, 73.1))));
  const sp = spreadAt(t);
  const night = lightsAt(t).night;
  const sky0 = night > .5 ? PT.wardN : PT.ward, gr0 = night > .5 ? PT.floorN : PT.floor;
  const skyOf = i => i === 0 ? sky0 : SPREADS[i].sky, grOf = i => i === 0 ? gr0 : SPREADS[i].ground;
  book.groundMat.map = grOf(sp); book.groundMat.needsUpdate = true;
  let turning = -1; TURNS.forEach(([a, b], i) => { if (t >= a && t < b) turning = i; });
  book.backMat.map = turning >= 0 ? skyOf(turning) : skyOf(sp); book.backMat.needsUpdate = true;
  if (turning >= 0) {
    const [a, b] = TURNS[turning];
    book.leafFront.material.map = book.leafFront.material.emissiveMap = grOf(turning);
    book.leafBack.material.map = book.leafBack.material.emissiveMap = skyOf(turning + 1);
    book.leafFront.material.needsUpdate = book.leafBack.material.needsUpdate = true;
    book.setLeaf(eio(seg(t, a, b)));
    if (t >= (a + b) / 2) book.groundMat.map = grOf(turning + 1);
  } else book.setLeaf(0);
  // chart page (drawn as the backdrop of spread 2)
  if (sp === 2 || turning === 1) {
    const st = { kN: seg(t, 47.8, 48.8), kT: seg(t, 48.1, 49.4), drop: seg(t, 50.1, 50.5), tag: seg(t, 50.3, 50.6), foot: t > 48.3 ? 1 : 0 };
    const k = JSON.stringify(st, (kk, v) => typeof v === 'number' ? Math.round(v * 30) / 30 : v);
    if (k !== chartKey) { chartKey = k; A.drawChartPage(chartC.getContext('2d'), A.PGW, A.PGH, st); chartT.needsUpdate = true; }
  }
  // pop-ups
  for (const r of POPS) {
    const k = rise(r, t); r.g.visible = k > .002; if (!r.g.visible) continue;
    r.g.rotation.x = r.dir * (Math.PI / 2) * (1 - k);
    if (r.sway) r.m.rotation.z = Math.sin(t * 1.6 + r.ph) * r.sway * k;
  }
  // card contents
  cards.resep.m.userData.redraw({ cross: seg(t, 2.0, 2.55) });
  cards.pc.m.userData.redraw({ kb: seg(t, 8.3, 8.7), ring: seg(t, 8.8, 9.2) });
  cards.tri.m.userData.redraw({ n: Math.floor(clamp((t - 12.9) / .2 + 1, 0, 4)) });
  cards.si.m.userData.redraw({});
  cards.resep2.m.userData.redraw({ write1: seg(t, 19.6, 20.4), write2: seg(t, 20.6, 21.1) * .5, sig: 0 });
  cards.pc2.m.userData.redraw({ kb: 1, ring: 1, note: 1, noteK: seg(t, 26.4, 27.1) });
  const hr = HRf(t), ps = seg(t, 32.4, 34.4);
  if (cards.mon.g.visible) cards.mon.m.userData.redraw({ hr, bp: `${Math.round(lerp(96, 84, ps))}/${Math.round(lerp(60, 52, ps))}`, t: Math.round(t * 30) / 30, alarm: t > 34.8, si: seg(t, 34.4, 34.7) });
  cards.tp.m.userData.redraw({ tline: seg(t, 38.9, 39.2) });
  cards.resep3.m.userData.redraw({ cross: 1, thick: seg(t, 66.6, 67.2) });
  // banner drops on its strings at 42.0
  const bk = t < 41.9 ? 0 : spring(t - 41.9, 6, .32);
  banner.visible = t > 41.85 && t < 45.85; banner.position.y = lerp(.5, .235, clamp(bk, 0, 1.2)); banner.rotation.z = Math.sin((t - 42) * 5) * .04 * Math.exp(-(t - 42) * 1.5);
  // sticky note on the desk
  sticky.visible = t > 42.9 && t < 46.7;
  if (sticky.visible) { const k = eo(seg(t, 42.9, 43.15)); sticky.position.y = (1 - k) * .03; const s = [0, 1, 2].map(i => seg(t, 43.15 + i * .35, 43.6 + i * .35)); const key = s.map(v => v.toFixed(2)).join(); if (sticky.userData.key !== key) { sticky.userData.key = key; A.drawStickyNote(snC.getContext('2d'), SN, SN, s); snT.needsUpdate = true; } }
  // characters
  for (const [actor, st] of [[patient, patientState(t)], [doctor, doctorState(t)]]) {
    actor.root.visible = actor.shadow.visible = st.vis;
    if (!st.vis) continue;
    actor.pose(st.pose); actor.root.position.set(st.x, st.y, st.z); actor.body.scale.set(st.face * st.scale, st.scale, st.scale);
    actor.shadow.position.set(st.x, .0004 + (st.y > .01 ? st.y : 0), st.z); actor.shadow.scale.setScalar(st.scale * (st.y > .01 ? .6 : 1));
  }
  // lights
  const L = lightsAt(t);
  spot.color.copy(L.alarm ? RED : WARM); spot.intensity = L.spotI;
  lampGlass.forEach(m => m.emissive.copy(L.alarm ? RED : new THREE.Color('#ffd9a0')));
  fill.intensity = L.fillI; fill.color.copy(WARM).lerp(COOL, L.night); hemi.intensity = L.hemiI;
  scene.environmentIntensity = L.env; scene.backgroundIntensity = .5 + L.env * .5;
  // camera (+ shake on the two big hits)
  const Cm = camAt(t);
  let sx = 0, sy = 0; for (const [t0, a, d] of [[2.0, .004, .35], [42.0, .006, .45], [34.8, .002, .3]]) if (t >= t0 && t < t0 + d) { const q = 1 - (t - t0) / d; sx += a * q * q * Math.sin(t * 91); sy += a * q * q * Math.cos(t * 77); }
  cam.position.copy(Cm.pos).add(new THREE.Vector3(sx, sy, 0)); cam.fov = Cm.fov; cam.lookAt(Cm.tgt); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  post.dof.focus = Cm.pos.distanceTo(Cm.tgt); post.dof.aper = Cm.aper * .6; post.dof.maxCoc = 8;
  post.vig.uniforms.warm.value = .12 - L.night * .1;
  post.vig.uniforms.fade.value = 1 - .9 * seg(t, 73.3, 73.95);
  post.bloom.strength = .2;
  scene.updateMatrixWorld(true);
  if (!noGL) post.composer.render();
  // overlay
  OX.clearRect(0, 0, W, H);
  // flash on the big hits
  for (const [f, pk, d] of [[2.0, .35, .2], [42.0, .45, .15]]) if (t >= f && t < f + d) { OX.fillStyle = `rgba(255,255,255,${pk * Math.pow(1 - (t - f) / d, 2)})`; OX.fillRect(0, 0, W, H); }
  for (const [id, text, t0, t1] of HL) { const yEnd = headline(id, text, t0, t1, 330); for (const h2 of HL2) if (h2[4] === id) headline(h2[0], h2[1], h2[2], h2[3], yEnd + (h2[0] === 'h10b' ? 70 : 50), h2[0] === 'h10b' ? 84 : 60); }
  for (const [id, text, t0, t1] of CAP) caption(id, text, t0, t1, id === 't8' ? 1300 : 1460);
  const ph = patient.root.visible ? toScreen(patient.head(tmp)) : null;
  for (const [id, who, text, t0, t1] of BUB) bubble(id, text, t0, t1, ph);
  // handle on the last frames
  if (t >= 70.4 && t < 73.4) { OX.save(); OX.font = '700 40px Fredoka'; OX.textAlign = 'center'; const k = back(seg(t, 70.4, 70.7), 2); OX.translate(540, 1590); OX.scale(k, k); OX.lineWidth = 9; OX.strokeStyle = '#2a1c15'; OX.lineJoin = 'round'; OX.strokeText('@dokter.emergency', 0, 0); OX.fillStyle = '#fff6df'; OX.fillText('@dokter.emergency', 0, 0); OX.restore(); BOX.hd = [370, 1550, 710, 1600]; }
};
window.TEXTS = t => {
  window.render(t, true);
  const out = [];
  const all = [...HL, ...HL2, ...CAP, ...BUB.map(b => [b[0], b[2], b[3], b[4]])];
  for (const [id, text, t0, t1] of all) if (t >= t0 && t < t1 && BOX[id]) { const b = BOX[id]; out.push({ id, text: text.replace(/\*/g, ''), x0: b[0], y0: b[1], x1: b[2], y1: b[3] }); }
  for (const [id, text, card, t0, t1] of CARDTXT) {
    if (t < t0 || t >= t1) continue;
    const obj = card === 'banner' ? banner.children[0] : card === 'sticky' ? sticky.userData.top : card === 'chart' ? null : cards[card].g;
    const b = obj ? boxOf(obj) : [200, 600, 880, 1100];
    if (b) out.push({ id, text, x0: b[0], y0: b[1], x1: b[2], y1: b[3] });
  }
  if (t >= 70.4 && t < 73.4) out.push({ id: 'hd', text: '@dokter.emergency', x0: 370, y0: 1550, x1: 710, y1: 1600 });
  return out;
};
window.DBG = { cam, book, patient, doctor, cards, banner, sticky };
window.render(0);
window.READY = true;
