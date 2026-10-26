"""Score + foley for TRIAGE, all synthesized. Reads events.json (exported from the page) → out/mix.wav.
120 BPM. D minor through the four colours, F major from the turn on. Heartbeat kick as the spine."""
import json, os, sys
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt, sosfiltfilt, fftconvolve

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.environ['LIB'], 'core', 'audio'))
import sfx  # noqa: E402  (library foley helpers)

SR = 48000
D = json.load(open(os.path.join(HERE, 'events.json')))
DUR, EV = D['dur'], D['ev']
N = int(round((DUR + 0.2) * SR))
BEAT = 0.5
rng = np.random.default_rng(11)

music = np.zeros((N, 2)); verb_send = np.zeros((N, 2)); fx = np.zeros((N, 2))


def tt(d): return np.arange(int(round(d * SR))) / SR
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, a, b, o=2): return sosfilt(butter(o, [a, b], 'band', fs=SR, output='sos'), x)
def mtof(m): return 440.0 * 2 ** ((m - 69) / 12)
def nz(d): return rng.standard_normal(int(round(d * SR)))


def put(bus, x, at, g=1.0, pan=0.0):
    sfx.add(bus, x, at, g, pan)


# ───────── instruments ─────────
def kick(v=1.0, f1=52):
    d = 0.42; t = tt(d)
    f = f1 + 90 * np.exp(-t / 0.03)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16)
    click = hp(nz(d), 2000) * np.exp(-t / 0.003) * 0.45
    knock = np.sin(2 * np.pi * 180 * t) * np.exp(-t / 0.025) * 0.35  # so the heartbeat reads on small speakers
    x = body + click + knock
    return np.tanh(x * 1.6) * v


def clap(v=1.0):
    d = 0.3; t = tt(d); x = np.zeros(len(t))
    for k, off in enumerate([0, 0.011, 0.023]):
        s = int(off * SR); n = bp(nz(d - off), 900, 5000); x[s:] += n * np.exp(-tt(d - off) / (0.012 if k < 2 else 0.09))
    return x / np.abs(x).max() * v


def hat(v=1.0, dec=0.03):
    d = 0.12; t = tt(d)
    return hp(nz(d), 7000, 3) * np.exp(-t / dec) * v * 0.7


def cymbal(v=1.0, d=1.8):
    t = tt(d)
    x = hp(nz(d), 4500, 2) * np.exp(-t / 0.55) + bp(nz(d), 7000, 11000) * np.exp(-t / 0.3) * 0.6
    return x / np.abs(x).max() * v


def bip(v=1.0, f=988, d=0.1):
    t = tt(d); e = np.minimum(1, t / 0.004) * np.minimum(1, (d - t) / 0.01)
    return (np.sin(2 * np.pi * f * t) + 0.15 * np.sin(4 * np.pi * f * t)) * e * v


def saw(f, d, det=0.0):
    t = tt(d); ph = (f * (1 + det)) * t + rng.random()
    return 2 * (ph % 1) - 1


def bass(m, d, v=1.0):
    t = tt(d); f = mtof(m)
    x = saw(f, d) * 0.7 + np.sin(2 * np.pi * f * t) * 0.8 + 0.25 * np.sin(4 * np.pi * f * t)
    x = lp(x, 700)
    e = np.minimum(1, t / 0.005) * np.exp(-t / max(0.08, d * 0.7)) * np.minimum(1, (d - t) / 0.01)
    return np.tanh(x * 1.4 * e) * v


def stab(ms, v=1.0, d=0.5):
    t = tt(d); x = np.zeros(len(t))
    for m in ms:
        for det in (-0.006, 0.0, 0.007):
            x += saw(mtof(m), d, det)
    x = lp(x, 2600) / (len(ms) * 3)
    return x * np.exp(-t / 0.16) * np.minimum(1, t / 0.003) * v * 2.2


def pad(ms, d, v=1.0, cut=1100):
    t = tt(d); x = np.zeros(len(t))
    for m in ms:
        for det in (-0.004, 0.004):
            x += saw(mtof(m), d, det)
    x = lp(x, cut) / (len(ms) * 2)
    e = np.minimum(1, t / 0.6) * np.minimum(1, (d - t) / 0.5)
    return x * e * v


def mallet(m, v=1.0, d=0.9):
    t = tt(d); f = mtof(m)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.35) + 0.3 * np.sin(2 * np.pi * 4 * f * t) * np.exp(-t / 0.05) + 0.08 * np.sin(2 * np.pi * 9.9 * f * t) * np.exp(-t / 0.015)
    return x * v


def riser(d, v=1.0):
    t = tt(d); n = nz(d); out = np.zeros(len(n)); blk = 480
    for i in range(0, len(n), blk):
        f = 400 + 6000 * (i / len(n)) ** 2; j = min(len(n), i + blk)
        out[i:j] = bp(n[max(0, i - 2000):j], f * 0.8, min(f * 1.25, 20000))[-(j - i):]
    return out / np.abs(out).max() * (t / d) ** 2 * v


def wood(v=1.0):  # yellow accent
    d = 0.15; t = tt(d)
    return (np.sin(2 * np.pi * 820 * t) * np.exp(-t / 0.025) + 0.5 * np.sin(2 * np.pi * 1450 * t) * np.exp(-t / 0.012)) * v


def shaker(v=1.0, d=0.22):  # green accent
    t = tt(d)
    return hp(nz(d), 5000) * np.sin(np.pi * t / d) ** 3 * v * 0.8


# ───────── score ─────────
def hb(at, v=1.0):  # heartbeat: lub on the beat, dub a 16th later
    put(music, kick(v), at, 0.9)
    put(music, kick(v * 0.55, 48), at + 0.125, 0.9)


DM, BB, FM, CM = [62, 65, 69], [58, 62, 65], [60, 65, 69], [60, 64, 67]
ROOT = {'Dm': 38, 'Bb': 34, 'F': 41, 'C': 36}  # roots below MIDI 36 are lifted an octave in bassbar
CH = {'Dm': DM, 'Bb': BB, 'F': FM, 'C': CM}


def bassbar(t0, chord, beats=4, pat=(1, 0, 1, 1, 0, 1, 1, 0), v=0.55):
    r = ROOT[chord] if ROOT[chord] >= 36 else ROOT[chord] + 12
    for i in range(beats * 2):
        if pat[i % 8]:
            put(music, bass(r + (12 if i % 8 == 6 else 0), 0.22, v), t0 + i * 0.25, 1.0, 0)


def big_hit(at, chord, size=1.0):
    put(music, kick(1.0), at, 1.0 * size)
    put(music, clap(0.8), at, 0.6 * size, 0.1)
    s = stab([m - 12 for m in CH[chord]] + CH[chord], 0.9)
    put(music, s, at, 0.55 * size, -0.15); put(verb_send, s, at, 0.4 * size)
    put(music, cymbal(0.6), at, 0.35 * size, 0.2)
    put(music, sfx.thump(1.0, 42), at, 0.5 * size)


# HOOK 0–6: heartbeat + monitor, one pedal note
for b in range(12):
    t = b * BEAT
    hb(t, 0.85 if b % 2 == 0 else 0.6)
    if b % 2 == 0: put(music, bip(0.5), t, 0.35, 0.3); put(verb_send, bip(0.5), t, 0.2)
put(music, pad([38, 50, 57], 6.0, 0.6, 500), 0.0, 0.5)
big_hit(2.0, 'Dm', 1.0)

# TRIAGE 6–10: hats in, four mallet notes for the four colours, riser into the push
for b in range(8):
    t = 6 + b * BEAT
    hb(t, 0.8)
    for k in range(2): put(music, hat(0.5 + 0.3 * k), t + k * 0.25, 0.35, 0.25)
bassbar(6.0, 'Dm'); bassbar(8.0, 'Bb')
for i, m in enumerate([74, 77, 81, 86]):
    put(music, mallet(m, 0.7), 8.5 + i * 0.25, 0.45, -0.3 + i * 0.2); put(verb_send, mallet(m, 0.7), 8.5 + i * 0.25, 0.3)
put(music, riser(0.5, 0.8), 9.5, 0.4)

# CHAPTERS 10–23: full groove, Dm Bb F C per bar
prog = ['Dm', 'Bb', 'F', 'C', 'Dm', 'Bb', 'F']
for bar in range(7):
    t0 = 10 + bar * 2.0
    if t0 >= 23: break
    ch = prog[bar]
    nb = 4 if t0 + 2 <= 23 else int((23 - t0) / BEAT)
    for b in range(nb):
        t = t0 + b * BEAT
        hb(t, 0.9)
        if b % 2 == 1: put(music, clap(0.7), t, 0.45, 0.05)
        for k in range(4): put(music, hat(0.35 + (0.35 if k == 2 else 0)), t + k * 0.125, 0.3, 0.25)
    bassbar(t0, ch, nb)
    put(music, pad([m - 12 for m in CH[ch]], nb * BEAT, 0.5, 1400), t0, 0.35)
big_hit(10.0, 'Dm', 1.0)
for t, ch in [(15.0, 'F'), (19.0, 'C')]:
    s = stab(CH[ch], 0.8); put(music, s, t, 0.4, -0.1); put(verb_send, s, t, 0.3)

# HITAM 23–26.5: everything drops; the monitor slows, then flatlines
put(music, pad([38, 45, 50], 3.4, 0.7, 450), 23.0, 0.45)
put(music, kick(0.8), 23.0, 0.7)
for t in (23.0, 23.9, 25.0):
    put(music, bip(0.5), t, 0.4, 0.3); put(verb_send, bip(0.5), t, 0.25)
fl = bip(0.5, 988, 0.95); put(music, fl, 25.5, 0.32, 0.3)
# 26.5–27.0: total silence (enforced after the mix)

# TURN 27–33: warm, F major, heartbeat back
big_hit(27.0, 'F', 1.25)
for bar, ch in enumerate(['F', 'Dm', 'Bb']):
    t0 = 27 + bar * 2.0
    for b in range(4):
        t = t0 + b * BEAT
        hb(t, 0.85)
        if b % 2 == 1: put(music, clap(0.6), t, 0.35)
        put(music, hat(0.4), t + 0.25, 0.25, 0.25)
    bassbar(t0, ch, pat=(1, 0, 0, 1, 0, 0, 1, 0), v=0.5)
    put(music, pad([m - 12 for m in CH[ch]] + [CH[ch][2]], 2.0, 0.6, 1600), t0, 0.4)
    for i, m in enumerate([CH[ch][0] + 12, CH[ch][1] + 12, CH[ch][2] + 12, CH[ch][1] + 12]):
        put(music, mallet(m, 0.4), t0 + i * 0.5, 0.25, 0.3 - i * 0.2); put(verb_send, mallet(m, 0.4), t0 + i * 0.5, 0.2)

# RUSH 33–37: 16th hats, driving bass, riser into the wall
for bar, ch in enumerate(['C', 'Dm']):
    t0 = 33 + bar * 2.0
    for b in range(4):
        t = t0 + b * BEAT
        hb(t, 1.0)
        if b % 2 == 1: put(music, clap(0.75), t, 0.45)
        for k in range(4): put(music, hat(0.5 if k % 2 else 0.3), t + k * 0.125, 0.32, 0.25)
    bassbar(t0, ch, pat=(1, 1, 1, 1, 1, 1, 1, 1), v=0.5)
big_hit(33.0, 'C', 0.7)
put(music, riser(1.0, 0.8), 36.0, 0.45)

# END 37–40.5: wall, tint, collapse into the mark, last stab rings out
put(music, pad([41, 48, 57, 60], 3.5, 0.5, 1200), 37.0, 0.3)
hb(37.0, 0.8); hb(37.5, 0.6); hb(38.0, 0.8)
big_hit(38.5, 'F', 1.1)
for t in (39.25, 39.75):
    put(music, bip(0.5), t, 0.3, 0.3); put(verb_send, bip(0.5), t, 0.25)

# ───────── foley from the page's events ─────────
for e in EV:
    t, k = e['t'], e['type']
    if k == 'ticket': put(fx, sfx.click(1.2, 0.5), t, 0.35, -0.4 + e['i'] * 0.27)
    elif k == 'type': put(fx, sfx.step(0.5), t, 0.25, -0.2)
    elif k == 'chip': put(fx, sfx.click(0.9, 0.6), t, 0.4)
    elif k == 'whoosh': put(fx, sfx.whoosh(e.get('d', 0.4), 0.8), t, 0.35, e.get('pan', 0))
    elif k == 'rows': put(fx, sfx.whoosh(max(0.25, e.get('d', 0.4)), 0.7), t, 0.3, 0.2)
    elif k == 'split': put(fx, sfx.whoosh(0.3, 0.6), t, 0.25, -0.2)
    elif k == 'scroll': put(fx, sfx.whoosh(0.5, 0.8), t, 0.4, 0)
    elif k == 'accent':
        ch = e['ch']
        if ch == 'red': put(fx, bip(0.7, 1318, 0.12), t, 0.35, 0.3)
        elif ch == 'yellow': put(fx, wood(0.8), t, 0.45, -0.2)
        elif ch == 'green': put(fx, shaker(0.8), t, 0.4, 0.2)
    elif k == 'slab': put(fx, sfx.thump(0.6, 90), t, 0.25)
    elif k == 'assemble': put(fx, sfx.pop(0.6), t, 0.25, -0.45 + e['i'] * 0.3)
    elif k == 'wheels':
        d = e['d']; tw = tt(d); n = nz(d)
        rattle = bp(n, 300, 2500) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 11 * tw))) ** 4
        env = np.minimum(1, tw / 0.5) * np.minimum(1, (d - tw) / 0.3)
        put(fx, rattle * env, t, 0.22, 0.1)
    elif k == 'flip': put(fx, sfx.click(1.5, 0.4), t, 0.2, -0.5 + (e['i'] % 4) * 0.33)
    elif k == 'sort': put(fx, sfx.whoosh(0.55, 0.8), t, 0.35, 0)

# ───────── reverb, glue, silence ─────────
ir_t = tt(1.4); ir = (rng.standard_normal((len(ir_t), 2)) * np.exp(-ir_t / 0.35)[:, None])
ir = np.stack([lp(ir[:, 0], 6000), lp(ir[:, 1], 6000)], 1); ir /= np.abs(ir).sum(0).max() / 12
wet = np.stack([fftconvolve(verb_send[:, c], ir[:, c])[:N] for c in range(2)], 1)
mixb = music + wet * 0.35 + fx
# low end: keep sub energy in check
mixb = np.stack([hp(mixb[:, c], 30) for c in range(2)], 1)
LOW = butter(4, 120, 'low', fs=SR, output='sos')  # zero-phase low shelf, about -8 dB under 120 Hz (phone speakers)
mixb = mixb - np.stack([sosfiltfilt(LOW, mixb[:, c]) for c in range(2)], 1) * 0.6
mixb = np.tanh(mixb * 1.1) / 1.1
s0, s1 = int(26.5 * SR), int(27.0 * SR) - 1
mixb[s0:s1] = 0.0
fade = int(0.01 * SR); mixb[s0 - fade:s0] *= np.linspace(1, 0, fade)[:, None]
mixb /= np.abs(mixb).max() / 0.9
mixb = np.stack([sfx.limit(mixb[:, c], 0.55) for c in range(2)], 1)  # tame transient peaks before loudnorm
mixb /= np.abs(mixb).max() / 0.9
# an inaudible floor (-80 dBFS) so loudness tools don't stall on pure digital zeros
mixb += rng.standard_normal(mixb.shape) * 1e-4
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mixb.astype(np.float32), SR, subtype='PCM_24')
print('mix.wav', round(len(mixb) / SR, 2), 's')
