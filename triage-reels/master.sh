#!/bin/sh
# master.sh video.mp4 mix.wav out.mp4 [fps]
# Same steps as $LIB/core/render/mux.sh (two-pass loudnorm to -14 LUFS / TP -1.2, H.264 + AAC, no grain),
# without its "decoded duration" guard, which misfires with ffmpeg 6.1 (loudnorm's progress stops ~3 s early).
set -e
V=$1; A=$2; O=$3; FPS=${4:-24}
M=$(ffmpeg -hide_banner -nostats -i "$A" -af loudnorm=I=-14:TP=-1.2:LRA=11:print_format=json -f null - 2>&1)
J=$(echo "$M" | sed -n '/{/,/}/p')
g() { echo "$J" | grep "\"$1\"" | sed 's/.*: "\(.*\)".*/\1/'; }
LN="loudnorm=I=-14:TP=-1.2:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true"
ffmpeg -y -loglevel error -i "$V" -i "$A" \
  -filter_complex "[0:v]fps=$FPS,format=yuv420p[v];[1:a]$LN,aresample=48000[a]" \
  -map "[v]" -map "[a]" -c:v libx264 -preset slow -crf 19 -r "$FPS" -c:a aac -b:a 256k -movflags +faststart -shortest "$O.tmp.mp4"
mv "$O.tmp.mp4" "$O"
echo "$O"
ffmpeg -hide_banner -nostats -i "$O" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|LRA|Peak):" | head -3
