# Score + sound effects for "Berkas IGD: Nyeri Perut", synthesized in code.
# 120 BPM (grid 0.5 s, one bar = 2 s), A minor. SFX are driven by events.json (exported from the page).
# Instrument recipes adapted from the Lemo-Opuscar halftone-dossier demo (MIT).
# usage: python mix.py   → out/mix.wav
import json, os
import numpy as np
from scipy.signal import lfilter, butter
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
EVJ = json.load(open(os.path.join(HERE, 'events.json')))
SR = 44100
DUR = float(EVJ['dur'])
N = int(SR * DUR)
ML, MR = np.zeros(N), np.zeros(N)   # music bus
SL, SR_ = np.zeros(N), np.zeros(N)  # sfx bus
rng = np.random.default_rng(11)

def mtof(m): return 440.0 * 2 ** ((m - 69) / 12)
def put(bus, sig, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N or i < 0: return
    sig = sig[: N - i] * gain
    l = np.cos((pan + 1) * np.pi / 4) * 1.414; r = np.sin((pan + 1) * np.pi / 4) * 1.414
    L, R = bus
    L[i:i + len(sig)] += sig * l; R[i:i + len(sig)] += sig * r
MUS, SFX = (ML, MR), (SL, SR_)

def lp(x, fc, order=2): b, a = butter(order, min(fc / (SR / 2), 0.99)); return lfilter(b, a, x)
def hp(x, fc, order=2): b, a = butter(order, fc / (SR / 2), 'high'); return lfilter(b, a, x)
def bp(x, lo, hi, order=2): b, a = butter(order, [lo / (SR / 2), hi / (SR / 2)], 'band'); return lfilter(b, a, x)
def tt(d): return np.arange(int(d * SR)) / SR

# ---------- instruments ----------
def kick(g=1.0):
    t = tt(0.35); f = 48 + 110 * np.exp(-t * 28)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)
    return np.tanh(s * 1.6) * g
def clap():
    n = int(0.25 * SR); out = np.zeros(n)
    for k, off in enumerate([0, 0.011, 0.022]):
        i = int(off * SR); m = n - i; t = np.arange(m) / SR
        out[i:] += bp(rng.standard_normal(m), 900, 5000) * np.exp(-t * (60 if k < 2 else 16))
    return out * 0.6
def snare():
    t = tt(0.22)
    return bp(rng.standard_normal(len(t)), 1500, 8000) * np.exp(-t * 18) * 0.7 + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30) * 0.5
def hat(open_=False):
    t = tt(0.18 if open_ else 0.05)
    return hp(rng.standard_normal(len(t)), 7000) * np.exp(-t * (18 if open_ else 90)) * 0.35
def pluck(m, dur=0.5, bright=1.0):
    t = tt(dur); f = mtof(m)
    s = (np.sin(2 * np.pi * f * t) * np.exp(-t * 6) + 0.35 * bright * np.sin(2 * np.pi * f * 3.99 * t) * np.exp(-t * 30)
         + 0.12 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 12))
    return s * np.minimum(1, t / 0.002)
def bell(m, dur=1.6):
    t = tt(dur); f = mtof(m)
    s = (np.sin(2 * np.pi * f * t) * np.exp(-t * 2.6) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6)
         + 0.2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 11))
    return s * np.minimum(1, t / 0.001)
def bass(m, dur=0.22):
    t = tt(dur); f = mtof(m); ph = 2 * np.pi * f * t
    s = lp(np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.2 * np.sin(3 * ph) + 0.12 * np.sign(np.sin(ph)), 1100)
    e = np.minimum(1, t / 0.004) * np.where(t < dur * 0.7, 1, np.exp(-(t - dur * 0.7) / 0.03))
    return s * e
def pad(ms, dur, bright=2200):
    t = tt(dur); s = np.zeros(len(t))
    for m in ms:
        f = mtof(m)
        for det in (-0.12, 0.12): s += 2 / np.pi * np.arcsin(np.sin(2 * np.pi * f * (1 + det / 100) * t))
    s = lp(s / (len(ms) * 2), bright)
    return s * np.minimum(1, t / 0.12) * np.clip((dur - t) / 0.25, 0, 1)

# ---------- sfx ----------
def stamp_s():
    t = tt(1.0); f = 40 + 90 * np.exp(-t * 18)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4)
    click = lp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 55)
    return np.tanh((boom * 1.4 + click * 0.9) * 1.5) + hp(rng.standard_normal(len(t)), 4000) * np.exp(-t * 3.2) * 0.3
def shutter():
    n = int(0.16 * SR); out = np.zeros(n)
    for off in (0, 0.06):
        i = int(off * SR); t = np.arange(n - i) / SR
        out[i:] += bp(rng.standard_normal(n - i), 1200, 6000) * np.exp(-t * 110)
    return out * 0.9
def pop_s(f=900):
    t = tt(0.12); fr = f * (1 + 1.2 * np.exp(-t * 60))
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 35)
def whoosh(dur=0.5, up=True):
    n = int(dur * SR); t = np.arange(n) / SR; x = rng.standard_normal(n); out = np.zeros(n)
    for i in range(0, n, 512):
        p = i / n; fc = 400 + 3500 * (p if up else 1 - p)
        blk = x[i:i + 512]
        out[i:i + len(blk)] = bp(x[max(0, i - 2048):i + 512], fc * 0.7, fc * 1.3)[-len(blk):]
    return out * np.sin(np.pi * t / dur) ** 2 * 1.2
def paper(dur=0.32):
    t = tt(dur); x = bp(rng.standard_normal(len(t)), 900, 6000)
    return x * np.sin(np.pi * t / dur) ** 1.5 * (0.6 + 0.4 * np.sin(t * 90)) * 0.7
def scratch(dur, lo=2500, hi=7000, rate=22):
    t = tt(dur); x = bp(rng.standard_normal(len(t)), lo, hi)
    g = 0.5 + 0.5 * np.abs(np.sin(np.pi * rate * t + rng.uniform(0, 3)))
    return x * g * np.minimum(1, t / 0.02) * np.clip((dur - t) / 0.04, 0, 1)
def click():
    t = tt(0.04); return bp(rng.standard_normal(len(t)), 2500, 9000) * np.exp(-t * 160) * 0.6
def thud():
    t = tt(0.3); f = 140 * np.exp(-t * 10) + 60
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14) + lp(rng.standard_normal(len(t)), 600) * np.exp(-t * 40) * 0.4
def beep():
    t = tt(0.11); return np.sin(2 * np.pi * 988 * t) * np.minimum(1, t / 0.004) * np.clip((0.11 - t) / 0.02, 0, 1) * 0.5
def alarm():
    out = np.zeros(int(0.62 * SR))
    for k, f in enumerate([880, 698, 880]):
        t = tt(0.16); s = np.sign(np.sin(2 * np.pi * f * t)) * 0.35 + np.sin(2 * np.pi * f * t) * 0.5
        s = lp(s, 3000) * np.minimum(1, t / 0.005) * np.clip((0.16 - t) / 0.02, 0, 1)
        i = int(k * 0.2 * SR); out[i:i + len(s)] += s
    return out
def riser(dur):
    t = tt(dur); n = len(t); x = rng.standard_normal(n); out = np.zeros(n)
    for i in range(0, n, 512):
        p = i / n; fc = 300 + 5000 * p ** 2
        blk = x[i:i + 512]; out[i:i + len(blk)] = bp(x[max(0, i - 2048):i + 512], fc * 0.8, fc * 1.25)[-len(blk):]
    return out * (t / dur) ** 2

# ============================================================
# score (cue map in TREATMENT.md §6)
# ============================================================
BAR = 2.0
CH = {'Am': [57, 60, 64], 'F': [53, 57, 60], 'Dm': [50, 53, 57], 'E': [52, 56, 59], 'C': [48, 52, 55], 'G': [55, 59, 62]}
ROOT = {'Am': 45, 'F': 41, 'Dm': 50, 'E': 40, 'C': 48, 'G': 43}
PROG = ['Am', 'F', 'Dm', 'E']

def groove(t0, t1, kick_every=1.0, clap_on=True, hats=True, bassline=True, mel=True, gain=1.0, prog=PROG):
    t = t0; b = 0
    while t < t1 - 1e-6:
        ch = prog[int((t - t0) // BAR) % len(prog)]
        beat = round((t - t0) / 0.5)
        if beat % int(kick_every / 0.5) == 0: put(MUS, kick(), t, 0.85 * gain)
        if clap_on and beat % 4 == 2: put(MUS, clap(), t, 0.32 * gain, 0.1)
        if hats:
            put(MUS, hat(), t + 0.25, 0.22 * gain, 0.3)
            put(MUS, hat(), t, 0.12 * gain, -0.3)
        if bassline:
            put(MUS, bass(ROOT[ch], 0.22), t, 0.42 * gain)
            put(MUS, bass(ROOT[ch] + (12 if beat % 2 else 7), 0.18), t + 0.25, 0.26 * gain)
        if mel and beat % 4 == 0:
            notes = CH[ch]
            seq = [notes[2] + 12, notes[1] + 12, notes[0] + 12, notes[1] + 12]
            for k, m in enumerate(seq[: 3 if (beat // 4) % 2 else 2]):
                put(MUS, pluck(m, 0.45), t + k * 0.375 + 0.5, 0.2 * gain, -0.25 + 0.25 * k)
        t += 0.5; b += 1

def pads(t0, t1, prog, gain=0.16, bar=BAR, bright=2000):
    t = t0; k = 0
    while t < t1 - 1e-6:
        d = min(bar, t1 - t)
        put(MUS, pad(CH[prog[k % len(prog)]], d + 0.25, bright), t, gain)
        t += bar; k += 1

# 1 · hook: driving, cut dead on the red line at 2.0
groove(0.0, 2.0, kick_every=0.5, clap_on=True, mel=False, gain=1.1, prog=['Am'])
groove(2.5, 6.5, kick_every=1.0, clap_on=False, mel=False, gain=0.8, prog=['Am', 'F'])
pads(2.5, 6.5, ['Am', 'F'], 0.10)
# 2–4 · routine shift: the "nothing is wrong" groove
groove(6.5, 23.0, gain=0.85)
pads(6.5, 23.0, PROG, 0.08)
# 5 · one sentence: music pulls back to a single pad, silence before the bubble
pads(23.0, 24.5, ['Am'], 0.13, bar=1.5)
pads(25.0, 30.5, ['Dm', 'Am', 'E'], 0.12)
for k, t in enumerate(np.arange(25.0, 30.5, 1.0)): put(MUS, bass(45 if k % 3 != 2 else 40, 0.35), t, 0.3)
for t, m in [(25.5, 76), (27.5, 72), (28.0, 71), (29.5, 69)]: put(MUS, pluck(m, 0.6, 0.6), t, 0.12, 0.2)
# 6 · escalation: low pulse that opens up, heartbeat under the monitor
for i, t in enumerate(np.arange(30.5, 38.0, 0.25)):
    p = (t - 30.5) / 7.5
    put(MUS, lp(bass(45 if (i // 8) % 2 == 0 else 46, 0.2), 400 + 2500 * p), t, 0.28 + 0.15 * p)
pads(30.5, 38.0, ['Am', 'Am', 'E', 'E'], 0.09, bright=1200)
for e in EVJ['ev']:
    if e['type'] == 'beep': put(MUS, kick(0.6), e['t'] - 0.02, 0.45)
put(MUS, riser(2.2), 35.8, 0.25)
# 7 · reveal: tension pad, roll + riser, full silence 41.5–42.0, the stamp lands alone
pads(38.0, 41.5, ['E', 'E'], 0.12, bright=1500)
put(MUS, riser(1.5), 40.0, 0.35)
pads(42.6, 46.0, ['Am', 'F'], 0.11, bright=1400)
for t in (42.6, 44.6): put(MUS, bass(33, 1.6), t, 0.35)
# 8 · concept: breathing room, slow pluck arpeggio
pads(46.0, 56.5, ['Am', 'F', 'C', 'E'], 0.1, bar=2.0, bright=1800)
arp = {'Am': [69, 72, 76, 72], 'F': [65, 69, 72, 69], 'C': [64, 67, 72, 67], 'E': [64, 68, 71, 68]}
for k, t in enumerate(np.arange(46.5, 56.5, 0.5)):
    ch = ['Am', 'F', 'C', 'E'][int((t - 46.0) // 2) % 4]
    put(MUS, pluck(arp[ch][k % 4], 0.7, 0.5), t, 0.11, -0.3 + 0.2 * (k % 4))
# 9 · takeaway: the groove comes back, lighter
groove(56.5, 65.5, gain=0.75, prog=['Am', 'F', 'C', 'E'])
# 10 · close: thinning out, bell tag
groove(65.5, 70.0, kick_every=1.0, clap_on=False, mel=False, gain=0.6, prog=['F', 'E'])
pads(65.5, 73.8, ['F', 'E', 'Am', 'Am'], 0.11)

# ============================================================
# sfx from the page's events
# ============================================================
for e in EVJ['ev']:
    t, ty = e['t'], e['type']; d = e.get('d', 0.3)
    if ty == 'hit': put(SFX, kick(1.0), t, 0.7); put(SFX, clap(), t, 0.7)
    elif ty == 'paper': put(SFX, paper(), t, 0.5, rng.uniform(-.3, .3))
    elif ty == 'marker': put(SFX, scratch(d, 1800, 6500, 14), t, 0.45, 0.15)
    elif ty == 'pen': put(SFX, scratch(d, 3000, 8000, 30), t, 0.3, -0.1)
    elif ty == 'alarm': put(SFX, alarm(), t, 0.42)
    elif ty == 'shutter': put(SFX, shutter(), t, 0.5)
    elif ty == 'pops':
        for k, tp in enumerate(np.arange(t, t + d, 0.09)): put(SFX, pop_s(700 + 90 * (k % 5)), tp, 0.09, rng.uniform(-.4, .4))
    elif ty == 'tick': put(SFX, click(), t, 0.7)
    elif ty == 'whoosh': put(SFX, whoosh(0.45), t - 0.1, 0.35)
    elif ty == 'wipe': put(SFX, whoosh(0.44), t, 0.22)
    elif ty == 'thump': put(SFX, thud(), t, 0.6)
    elif ty == 'bubble': put(SFX, pop_s(560), t, 0.5)
    elif ty == 'beep': put(SFX, beep(), t, 0.55)
    elif ty == 'bell': put(SFX, bell([76, 79, 84][e.get('n', 0) % 3], 1.4), t, 0.3)
    elif ty == 'roll':
        tr = t
        while tr < t + d:
            p = (tr - t) / d; put(SFX, snare(), tr, 0.12 + 0.4 * p, rng.uniform(-.2, .2)); tr += 0.125 * (1 - p) + 0.03 * p
    elif ty == 'stamp': put(SFX, stamp_s(), t, 1.0)
    elif ty == 'tag':
        for k, m in enumerate([69, 72, 76, 81]): put(SFX, bell(m, 1.8), t + k * 0.12, 0.22, -0.3 + 0.2 * k)

# room tone (hospital at night), a little hum in the dark section
room = lp(rng.standard_normal(N), 500) * 0.012
tA = np.arange(N) / SR
hum = (np.sin(2 * np.pi * 120 * tA) * 0.006) * ((tA > 30.5) & (tA < 38.0))
silence = (tA > 41.5) & (tA < 42.0)
room[silence] *= 0.2

# hard silence on the music bus before the stamp
ML[silence] = 0; MR[silence] = 0
# duck the music a touch under big hits
duck = np.ones(N)
for t0 in (2.0, 42.0):
    i = int(t0 * SR); j = min(N, i + int(0.8 * SR))
    duck[i:j] = np.minimum(duck[i:j], 0.35 + 0.65 * np.linspace(0, 1, j - i))
L = ML * duck * 0.9 + SL + room + hum
R = MR * duck * 0.9 + SR_ + room + hum
# tame the low end (synth kicks and bass pile up below 120 Hz)
def shelf(x, fc=120, g=0.45):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    k = g + (1 - g) * np.clip((f - fc * 0.7) / (fc * 0.6), 0, 1)
    k[f < 28] = 0
    return np.fft.irfft(X * k, len(x))
L = shelf(L); R = shelf(R)
# fade out with the picture
fo = np.clip((DUR - 0.15 - tA) / 0.6, 0, 1)
L *= fo; R *= fo
st = np.stack([L, R], 1)
st = np.tanh(st / (np.max(np.abs(st)) + 1e-9) * 1.6) * 0.8
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), st, SR, subtype='PCM_24')
print('mix.wav', st.shape, 'peak', float(np.max(np.abs(st))))
