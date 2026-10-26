#!/bin/sh
# One command: picture → events → score/foley → master. Needs the Lemo-Opuscar library (LIB) with its deps installed.
set -e
LIB=${LIB:-/root/lemo-opuscar}
HERE=$(cd "$(dirname "$0")" && pwd)
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
cd "$LIB"
node core/render/readcheck.mjs "$HERE" --size 1080x1920
node core/render/events.mjs "$HERE" --size 1080x1920
node core/render/video.mjs "$HERE" --size 1080x1920 --fps 24 --workers 4 --out "$HERE/out/video.mp4"
"$LIB/.venv/bin/python" "$HERE/mix.py"
sh "$HERE/master.sh" "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/triage-reels.mp4" 24
ffmpeg -loglevel error -y -ss 9.0 -i "$HERE/triage-reels.mp4" -frames:v 1 "$HERE/poster.jpg"
node -e "global.window={}; require('$HERE/timeline.js'); require('fs').writeFileSync('$HERE/out/cues.json', JSON.stringify(window.TL.cues.map(([t0,t1,text])=>({t0,t1,text}))))"
"$LIB/.venv/bin/python" core/render/srt.py "$HERE/out/cues.json" "$HERE/triage-reels.srt"
