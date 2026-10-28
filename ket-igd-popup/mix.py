# Score + paper foley for "Buku Jaga IGD", synthesized in code (no samples).
# 120 BPM grid (0.5 s), A minor; music box, pizzicato, glockenspiel, a reedy clarinet voice and brushes.
# SFX come from events.json, exported from the page.  usage: python mix.py → out/mix.wav
import json, os
import numpy as np
from scipy.signal import lfilter, butter
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
EVJ = json.load(open(os.path.join(HERE, 'events.json')))
SR = 44100; DUR = float(EVJ['dur']); N = int(SR * DUR)
ML, MR, SL, SRr = (np.zeros(N) for _ in range(4))
MUS, SFX = (ML, MR), (SL, SRr)
rng = np.random.default_rng(23)
def mtof(m): return 440.0 * 2 ** ((m - 69) / 12)
def put(bus, sig, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N or i < 0: return
    sig = sig[: N - i] * gain; l = np.cos((pan + 1) * np.pi / 4) * 1.414; r = np.sin((pan + 1) * np.pi / 4) * 1.414
    bus[0][i:i + len(sig)] += sig * l; bus[1][i:i + len(sig)] += sig * r
def lp(x, fc, o=2): b, a = butter(o, min(fc / (SR / 2), .99)); return lfilter(b, a, x)
def hp(x, fc, o=2): b, a = butter(o, fc / (SR / 2), 'high'); return lfilter(b, a, x)
def bp(x, lo, hi, o=2): b, a = butter(o, [lo / (SR / 2), hi / (SR / 2)], 'band'); return lfilter(b, a, x)
def tt(d): return np.arange(int(d * SR)) / SR
def noise(n): return rng.standard_normal(n)

# ---------- instruments ----------
def musicbox(m, d=1.4):
    t = tt(d); f = mtof(m)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t * 3) + .5 * np.sin(2 * np.pi * f * 3.01 * t) * np.exp(-t * 7) + .25 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 12)
    return s * np.minimum(1, t / .0015)
def glock(m, d=1.6):
    t = tt(d); f = mtof(m)
    return (np.sin(2 * np.pi * f * t) * np.exp(-t * 2.2) + .35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 5)) * np.minimum(1, t / .001)
def pizz(m, d=.35):
    t = tt(d); f = mtof(m); ph = 2 * np.pi * f * t
    s = lp(np.sin(ph) + .45 * np.sin(2 * ph) + .25 * np.sin(3 * ph) + .1 * np.sign(np.sin(ph)), 2200)
    return s * np.exp(-t * 11) * np.minimum(1, t / .003)
def clarinet(m, d):
    t = tt(d); f = mtof(m) * (1 + .004 * np.sin(2 * np.pi * 5 * t) * np.minimum(1, t / .4)); ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) + .35 * np.sin(3 * ph) + .18 * np.sin(5 * ph) + .08 * np.sin(7 * ph)
    s = lp(s, 2600) + .01 * bp(noise(len(t)), 1500, 4000)
    return s * np.minimum(1, t / .08) * np.clip((d - t) / .15, 0, 1)
def bassp(m, d=.4):
    t = tt(d); f = mtof(m); ph = 2 * np.pi * f * t
    return lp(np.sin(ph) + .4 * np.sin(2 * ph) + .2 * np.sin(3 * ph), 900) * np.exp(-t * 6) * np.minimum(1, t / .004)
def brush(open_=False):
    t = tt(.3 if open_ else .12); return bp(noise(len(t)), 2500, 9000) * np.exp(-t * (9 if open_ else 30)) * .35
def softkick(g=1.):
    t = tt(.3); f = 50 + 70 * np.exp(-t * 30); return np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 10) * 1.4) * g
def pad(ms, d, bright=1800):
    t = tt(d); s = np.zeros(len(t))
    for m in ms:
        for det in (-.1, .1): s += 2 / np.pi * np.arcsin(np.sin(2 * np.pi * mtof(m) * (1 + det / 100) * t))
    return lp(s / (len(ms) * 2), bright) * np.minimum(1, t / .2) * np.clip((d - t) / .3, 0, 1)

# ---------- paper foley ----------
def crinkle(d, dens=160, lo=1800, hi=9000):
    n = int(d * SR); x = np.zeros(n)
    for _ in range(int(dens * d)):
        i = rng.integers(0, max(1, n - 400)); L = int(rng.integers(40, 300)); L = min(L, n - i); x[i:i + L] += noise(L) * np.exp(-np.arange(L) / (L / 4 + 1)) * rng.uniform(.3, 1)
    return bp(x, lo, hi)
def popsnap():
    t = tt(.18); f = 900 * np.exp(-t * 25) + 250
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 30) * .8 + np.pad(crinkle(.08, 300), (0, len(t) - int(.08 * SR))) * .6
def foldsnd():
    t = tt(.25); return crinkle(.25, 120, 1200, 6000) * np.sin(np.pi * t / .25) * .7
def pagesnd(d):
    t = tt(d); n = len(t); x = noise(n); y = np.zeros(n)
    for k in range(8):
        a, b = k * n // 8, (k + 1) * n // 8; fc = 500 + 3000 * (k + .5) / 8; y[a:b] = bp(x, fc * .6, min(fc * 1.6, 18000))[a:b]
    return (y * np.sin(np.pi * t / t[-1]) ** 1.5 + crinkle(d, 90) * .4) * .9
def scratch(d, lo=2500, hi=7000, rate=20):
    t = tt(d); x = bp(noise(len(t)), lo, hi); g = .5 + .5 * np.abs(np.sin(np.pi * rate * t + rng.uniform(0, 3)))
    return x * g * np.minimum(1, t / .02) * np.clip((d - t) / .04, 0, 1)
def alarm():
    out = np.zeros(int(.62 * SR))
    for k, f in enumerate([880, 698, 880]):
        t = tt(.16); s = lp(np.sign(np.sin(2 * np.pi * f * t)) * .3 + np.sin(2 * np.pi * f * t) * .5, 3000) * np.minimum(1, t / .005) * np.clip((.16 - t) / .02, 0, 1)
        i = int(k * .2 * SR); out[i:i + len(s)] += s
    return out
def beep(): t = tt(.11); return np.sin(2 * np.pi * 988 * t) * np.minimum(1, t / .004) * np.clip((.11 - t) / .02, 0, 1) * .5
def blip(f): t = tt(.05); ph = 2 * np.pi * f * t; return lp(np.sign(np.sin(ph)) * .4 + np.sin(ph) * .5, 4000) * np.exp(-t * 40)
def tap(): t = tt(.1); return bp(noise(len(t)), 600, 2500) * np.exp(-t * 60) + np.sin(2 * np.pi * 300 * t) * np.exp(-t * 40) * .4
def thump(big=1.):
    t = tt(.6); f = 60 + 80 * np.exp(-t * 20)
    return np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7) * 1.5) * big + crinkle(.6, 60, 800, 4000) * np.exp(-t * 8) * .5
def creak(d=.7):
    t = tt(d); f = 140 + 40 * np.sin(2 * np.pi * 1.3 * t); ph = 2 * np.pi * np.cumsum(f) / SR
    s = sum(np.sin(ph * k) / k for k in range(1, 9)) * (.5 + .5 * np.abs(np.sin(2 * np.pi * 9 * t)))
    return bp(s, 300, 3000) * np.sin(np.pi * t / d) * .5
def puff(): t = tt(.35); return lp(noise(len(t)), 1500) * np.sin(np.pi * t / .35) ** 2 * .6
def riser(d):
    t = tt(d); n = len(t); x = noise(n); out = np.zeros(n)
    for i in range(0, n, 512):
        p = i / n; fc = 300 + 5000 * p ** 2; blk = x[i:i + 512]; out[i:i + len(blk)] = bp(x[max(0, i - 2048):i + 512], fc * .8, fc * 1.25)[-len(blk):]
    return out * (t / d) ** 2

# ============================================================
# score
# ============================================================
BAR = 2.0
CH = {'Am': [57, 60, 64], 'F': [53, 57, 60], 'Dm': [50, 53, 57], 'E': [52, 56, 59], 'C': [48, 52, 55], 'G': [55, 59, 62]}
ROOT = {'Am': 45, 'F': 41, 'Dm': 38 + 12, 'E': 40, 'C': 48, 'G': 43}
MOTIF = [76, 72, 69, 72, 74, 72, 71, 69]   # music-box line, two bars
def storybook(t0, t1, prog, gain=1., mel=True, drums=True):
    t = t0
    while t < t1 - 1e-6:
        beat = round((t - t0) / .5); ch = prog[int((t - t0) // BAR) % len(prog)]
        if beat % 2 == 0: put(MUS, pizz(ROOT[ch] + 12, .35), t, .32 * gain, -.2)
        else: put(MUS, pizz(CH[ch][(beat // 2) % 3] + 12, .3), t, .2 * gain, .25)
        if drums:
            if beat % 4 == 0: put(MUS, softkick(), t, .45 * gain)
            put(MUS, brush(beat % 4 == 2), t, .5 * gain, .2)
        if mel and beat % 1 == 0 and (beat % 8) in (0, 1, 2, 3, 4, 6):
            put(MUS, musicbox(MOTIF[beat % 8] + (0 if ch in ('Am', 'F', 'C') else -1 if ch == 'E' else 0), 1.0), t, .12 * gain, .1)
        t += .5
def pads(t0, t1, prog, gain=.1, bar=BAR, bright=1600):
    t, k = t0, 0
    while t < t1 - 1e-6:
        put(MUS, pad(CH[prog[k % len(prog)]], min(bar, t1 - t) + .3, bright), t, gain); t += bar; k += 1

storybook(0, 2.0, ['Am'], 1.1, mel=False)
storybook(2.5, 6.5, ['Am', 'F'], .8, mel=False); pads(2.5, 6.5, ['Am', 'F'], .07)
storybook(6.5, 23.0, ['Am', 'F', 'Dm', 'E'], .85); pads(6.5, 23, ['Am', 'F', 'Dm', 'E'], .05)
pads(23.0, 24.5, ['Am'], .1, bar=1.5)                        # the room holds its breath
pads(25.0, 30.5, ['Dm', 'Am', 'E'], .09)
for t, m in [(25.5, 76), (27.5, 72), (28.0, 71), (29.5, 69)]: put(MUS, glock(m), t, .14, .2)
for i, t in enumerate(np.arange(30.5, 37.4, .25)):            # escalation: pizz ostinato that speeds the heart
    p = (t - 30.5) / 7; put(MUS, pizz(57 if (i // 8) % 2 == 0 else 58, .22), t, .18 + .12 * p, -.15 if i % 2 else .15)
pads(30.5, 37.4, ['Am', 'Am', 'E', 'E'], .07, bright=1100)
for e in EVJ['ev']:
    if e['type'] == 'beep': put(MUS, softkick(.7), e['t'] - .02, .35)
put(MUS, riser(2.0), 35.6, .2)
pads(38.0, 41.5, ['E', 'E'], .1, bright=1300)
put(MUS, riser(1.5), 40.0, .3)
pads(42.6, 46.0, ['Am', 'F'], .09, bright=1300)
for t in (42.6, 44.6): put(MUS, bassp(33 + 12, 1.6), t, .3)
pads(46.0, 56.5, ['Am', 'F', 'C', 'E'], .08)                  # concept: clarinet line over glock
for t, m, d in [(46.5, 69, 1.4), (48.0, 72, 1.0), (49.0, 71, 1.4), (50.5, 67, 1.0), (52.0, 69, 1.4), (53.5, 72, .9), (54.4, 76, 1.0), (55.4, 74, 1.0)]: put(MUS, clarinet(m - 12, d), t, .16, -.2)
for k, t in enumerate(np.arange(46.5, 56.5, 1.0)): put(MUS, glock([81, 76, 79, 76][k % 4], 1.4), t, .07, .3)
storybook(56.5, 65.5, ['Am', 'F', 'C', 'E'], .75)
storybook(65.5, 70.0, ['F', 'E'], .55, mel=False)
pads(65.5, 73.8, ['F', 'E', 'Am', 'Am'], .09)

# ============================================================
# sfx
# ============================================================
for e in EVJ['ev']:
    t, ty, d = e['t'], e['type'], e.get('d', .3)
    if ty == 'pop': put(SFX, popsnap(), t, .45, rng.uniform(-.3, .3))
    elif ty == 'fold': put(SFX, foldsnd(), t, .35, rng.uniform(-.3, .3))
    elif ty == 'page': put(SFX, pagesnd(d), t, .7)
    elif ty == 'marker': put(SFX, scratch(d, 1800, 6500, 14), t, .4, .15)
    elif ty == 'pen': put(SFX, scratch(d, 3000, 8000, 30), t, .28, -.1)
    elif ty == 'alarm': put(SFX, alarm(), t, .4)
    elif ty == 'puff': put(SFX, puff(), t, .4)
    elif ty == 'bubble': put(SFX, popsnap(), t, .35)
    elif ty == 'blip': put(SFX, blip(620 + 80 * rng.integers(0, 4)), t, .12, .1)
    elif ty == 'door': put(SFX, tap(), t, .5); put(SFX, creak(.4), t, .25)
    elif ty == 'step': put(SFX, tap(), t, .25, .2)
    elif ty == 'beep': put(SFX, beep(), t, .5)
    elif ty == 'roll':
        tr = t
        while tr < t + d: p = (tr - t) / d; put(SFX, brush(), tr, .15 + .45 * p, rng.uniform(-.2, .2)); tr += .1 * (1 - p) + .03 * p
    elif ty == 'banner': put(SFX, thump(1.2), t, .9); put(SFX, crinkle(.4, 200), t, .4)
    elif ty == 'sticky': put(SFX, crinkle(.2, 300, 1500, 7000), t, .4)
    elif ty == 'tick': put(SFX, tap(), t, .4)
    elif ty == 'bell': put(SFX, glock([76, 79, 84][e.get('n', 0) % 3], 1.4), t, .28)
    elif ty == 'creak': put(SFX, creak(.8), t, .4)
    elif ty == 'close': put(SFX, thump(1.0), t, .8)
    elif ty == 'tag':
        for k, m in enumerate([69, 72, 76, 81]): put(SFX, musicbox(m, 1.6), t + k * .14, .22, -.3 + .2 * k)

tA = np.arange(N) / SR
room = lp(noise(N), 450) * .01
clock = np.zeros(N)
for tc in np.arange(.0, DUR, 1.0): i = int(tc * SR); c = bp(noise(800), 2000, 6000) * np.exp(-np.arange(800) / 120) * .05; clock[i:i + 800] += c[: N - i]
silence = (tA > 41.5) & (tA < 42.0)
ML[silence] = 0; MR[silence] = 0
duck = np.ones(N)
for t0 in (2.0, 42.0):
    i = int(t0 * SR); j = min(N, i + int(.8 * SR)); duck[i:j] = np.minimum(duck[i:j], .35 + .65 * np.linspace(0, 1, j - i))
L = ML * duck + SL + room + clock; R = MR * duck + SRr + room + clock
def shelf(x, fc=120, g=.45):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); k = g + (1 - g) * np.clip((f - fc * .7) / (fc * .6), 0, 1); k[f < 28] = 0
    return np.fft.irfft(X * k, len(x))
L = shelf(L); R = shelf(R)
fo = np.clip((DUR - .15 - tA) / .6, 0, 1); L *= fo; R *= fo
st = np.stack([L, R], 1); st = np.tanh(st / (np.max(np.abs(st)) + 1e-9) * 1.6) * .8
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), st, SR, subtype='PCM_24')
print('mix.wav', st.shape)
