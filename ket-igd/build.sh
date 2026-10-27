#!/bin/sh
# One command: picture → events → score & sfx → master.  Run from anywhere.
set -e
LIB=${LIB:-/home/user/lemomo-ai/lemo-opuscar}
HERE=$(cd "$(dirname "$0")" && pwd)
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
cd "$LIB"
node core/render/events.mjs "$HERE" --size 1080x1920
node core/render/video.mjs "$HERE" --size 1080x1920 --fps 30 --workers 4 --out "$HERE/out/video.mp4"
"$LIB/.venv/bin/python" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/out/master.mp4" 30 1
# Instagram-friendly size (~8 Mbps)
ffmpeg -v error -y -i "$HERE/out/master.mp4" -c:v libx264 -preset slow -crf 20 -tune grain -maxrate 8M -bufsize 16M -pix_fmt yuv420p -movflags +faststart -c:a copy "$HERE/ket-igd.mp4"
