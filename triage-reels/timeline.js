// One timeline for picture, score, foley and subtitles. 120 BPM: 1 beat = 0.5 s, 1 bar = 2 s.
(function () {
  const TL = {
    bpm: 120, beat: 0.5, dur: 40.5,
    // shots: [id, t0, t1]
    shots: [
      ['hook', 0, 6], ['triage', 6, 10], ['red', 10, 15], ['yellow', 15, 19], ['green', 19, 23],
      ['ink', 23, 27], ['queue', 27, 33], ['rush', 33, 37], ['end', 37, 40],
    ],
    // chapter cards
    cards: {
      red:    { n: 1, pk: 'red',    title: 'MERAH',  line: 'Nyawa terancam.',      chip: 'PRIORITAS 1', ex: 'henti jantung · sesak berat', pose: 'down',  body: 0 },
      yellow: { n: 2, pk: 'yellow', title: 'KUNING', line: 'Gawat, tapi stabil.',  chip: 'PRIORITAS 2', ex: 'patah tulang · luka robek',   pose: 'seat',  body: 1 },
      green:  { n: 3, pk: 'green',  title: 'HIJAU',  line: 'Tidak gawat.',          chip: 'PRIORITAS 3', ex: 'lecet · keseleo ringan',      pose: 'walk',  body: 1 },
      ink:    { n: 4, pk: 'ink',    title: 'HITAM',  line: 'Meninggal saat tiba.',  chip: null,          ex: 'tidak ada tanda kehidupan',   pose: 'still', body: 0 },
    },
    // subtitle file (.srt) for accessibility: the card text, as read
    cues: [
      [0.25, 2.0, 'Datang terakhir,'],
      [2.0, 6.0, 'Datang terakhir, ditangani pertama. Kok bisa?'],
      [6.0, 10.0, 'TRIAGE: yang paling gawat, duluan.'],
      [10.5, 14.5, 'MERAH. Nyawa terancam. Prioritas 1 (henti jantung, sesak berat).'],
      [15.0, 18.5, 'KUNING. Gawat, tapi stabil. Prioritas 2 (patah tulang, luka robek).'],
      [19.0, 22.5, 'HIJAU. Tidak gawat. Prioritas 3 (lecet, keseleo ringan).'],
      [23.0, 27.0, 'HITAM. Meninggal saat tiba.'],
      [27.0, 29.0, 'Disuruh menunggu?'],
      [29.0, 33.0, 'Disuruh menunggu? Berarti kondisimu masih aman.'],
      [33.0, 37.0, 'Yang merah dikejar waktu.'],
      [37.0, 40.5, '@dokter.emergency'],
    ],
  };
  // sound / cue events (seconds). The score reads these too.
  const EV = [];
  const ev = (t, type, o = {}) => EV.push(Object.assign({ t: +t.toFixed(4), type }, o));
  // hook
  ev(0.0, 'start');
  [0.0, 0.0, 0.0, 0.0].forEach((_, i) => ev(0.05 + i * 0.125, 'ticket', { i }));
  ev(0.25, 'type');
  ev(1.5, 'whoosh', { d: 0.5, pan: -0.3 });
  ev(2.0, 'hit', { size: 1 });
  ev(2.0, 'type');
  ev(3.5, 'chip');
  ev(5.75, 'rows', { d: 0.5 });
  // triage
  ev(6.0, 'hit', { size: 0.6 });
  ev(6.5, 'type');
  for (let i = 0; i < 4; i++) ev(8.5 + i * 0.25, 'pop', { i });
  ev(8.5, 'split');
  ev(9.5, 'riser', { d: 0.5 });
  // chapters
  ev(10.0, 'hit', { size: 1, ch: 'red' });
  ev(10.5, 'rows', { d: 0.25 });
  for (const [k, t] of [['red', 10.5], ['yellow', 15.0], ['green', 19.0], ['ink', 23.0]]) {
    if (k !== 'red') { ev(t - 0.5, 'scroll', { d: 0.5 }); ev(t, 'accent', { ch: k }); }
    else ev(t, 'accent', { ch: k });
    ev(t + 0.05, 'slab');
  }
  ev(26.5, 'silence', { d: 0.5 });
  // turn
  ev(27.0, 'hit', { size: 1.2 });
  ev(27.0, 'rows', { d: 0.25 });
  for (let i = 0; i < 4; i++) ev(27.0 + i * 0.5, 'assemble', { i });
  ev(29.0, 'type');
  ev(32.5, 'wheels', { d: 4.4 });  // J-cut: the stretcher is heard before it is seen
  ev(32.75, 'whoosh', { d: 0.3, pan: 0.4 });
  ev(33.0, 'hit', { size: 0.7 });
  // end
  ev(37.0, 'whoosh', { d: 0.6, pan: 0 });
  for (let i = 0; i < 16; i++) ev(37.0 + 0.03 * i, 'flip', { i });
  ev(37.95, 'sort');
  ev(38.5, 'hit', { size: 1.1, last: true });
  TL.EV = EV.sort((a, b) => a.t - b.t);
  window.TL = TL;
})();
