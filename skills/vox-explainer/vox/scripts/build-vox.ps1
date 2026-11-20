# vox-explainer build for one project folder (cwd): export -> [stills sheet] -> srt -> music -> mix -> render (grain + audio, one encode) -> verify -> cover.
# usage: & ..\..\tools\vox\build-vox.ps1 -Dur 75 [-StillsOnly "6.5,13.5,..."] [-Vo audio_v4\edit.wav] [-Grain 5] [-Cover 5.5] [-SkipExport]
#   no -Vo: music only (POC / silent draft). With -Vo: run align.mjs first (it writes CUES into piece.html), VO starts at -Lead ms.
param([int]$Dur = 75, [string]$StillsOnly = '', [string]$Vo = '', [int]$Grain = 5, [double]$Cover = 0, [string]$Piece = 'piece.html', [int]$Lead = 1000, [switch]$SkipExport)
$bin = if ($env:FFMPEG_DIR) { $env:FFMPEG_DIR } else { 'C:\Users\Dion\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0-full_build\bin' }
$env:PATH = "$bin;$env:PATH"
$tools = $PSScriptRoot
$sw = [Diagnostics.Stopwatch]::StartNew()
$lap = { param($s) '{0} ({1:N1}s)' -f $s, $sw.Elapsed.TotalSeconds }
if (-not $SkipExport) { node "$tools\gc-export.mjs" --dur $Dur --piece $Piece | Select-Object -Last 1; & $lap 'export' }
if ($StillsOnly) {
  node "$tools\gc-render.mjs" --stills $StillsOnly | Out-Null
  $in = @(); $fc = ''; $k = 0
  foreach ($t in $StillsOnly.Split(',')) { $s = '{0:F2}' -f [double]$t; $in += '-i'; $in += "check\gc_$s.png"; $fc += "[$k]scale=270:480[v$k];"; $k++ }
  $per = [math]::Ceiling($k / 2); $rows = @()
  for ($r = 0; $r -lt 2; $r++) {
    $ids = @(); for ($j = $r * $per; $j -lt [math]::Min($k, ($r + 1) * $per); $j++) { $ids += "[v$j]" }
    while ($ids.Count -lt $per) { $fc += "color=c=white:s=270x480:d=1[bl$r$($ids.Count)];"; $ids += "[bl$r$($ids.Count)]" }
    $fc += ($ids -join '') + "hstack=$per[r$r];"; $rows += "[r$r]"
  }
  $fc += ($rows -join '') + 'vstack'
  ffmpeg.exe -v error -y @in -filter_complex $fc -frames:v 1 sheet1.jpg
  & $lap 'stills -> sheet1.jpg'
  return
}
node "$tools\srt.mjs"
node "$tools\music.mjs" --dur $Dur --cues cues.json
if ($Vo) {
  ffmpeg.exe -v error -y -i $Vo -af "adelay=$Lead,apad=whole_dur=$Dur" -t $Dur -ar 48000 -ac 1 vo_padded.wav
  ffmpeg.exe -v error -y -i vo_padded.wav -i music.wav -filter_complex "[1]volume=0.35[m];[m][0]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=300[md];[0][md]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11,alimiter=limit=0.84:attack=2:release=50:level=disabled[x]" -map '[x]' -t $Dur -ar 48000 mix_norm.wav
} else {
  ffmpeg.exe -v error -y -i music.wav -af "volume=0.8,loudnorm=I=-16:TP=-1.5:LRA=11" -t $Dur -ar 48000 mix_norm.wav
}
& $lap 'audio'
node "$tools\gc-render.mjs" preview.mp4 --grain $Grain --audio mix_norm.wav | Select-Object -Last 1
& $lap 'render (grain + audio, one encode)'
ffprobe.exe -v error -count_frames -show_entries stream=codec_name,width,height,r_frame_rate,nb_read_frames -show_entries format=duration,size -of compact preview.mp4
ffmpeg.exe -hide_banner -i preview.mp4 -vf "blackdetect=d=0.1:pix_th=0.1" -an -f null - 2>&1 | Select-String 'black_start'
ffmpeg.exe -hide_banner -i preview.mp4 -af volumedetect -vn -f null - 2>&1 | Select-String 'max_volume'
New-Item -ItemType Directory -Force check | Out-Null
ffmpeg.exe -v error -y -i preview.mp4 -vf "fps=1/3,scale=180:-1,tile=9x3" -frames:v 1 check\contact.jpg
if ($Cover -gt 0) {
  $cf = [int][math]::Round($Cover * 30)
  ffmpeg.exe -v error -y -ss $Cover -i preview.mp4 -frames:v 1 -q:v 2 cover-raw.jpg
  node "$tools\cover-badge.mjs" cover-raw.jpg ("cover-{0:D4}.jpg" -f $cf)
}
& $lap 'done'
