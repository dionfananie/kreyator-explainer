# Full Group C build for one project folder (cwd): export -> render -> srt -> music -> mix -> mux -> verify -> scene mp3 -> cover badge.
# usage: & ..\..\tools\groupc\build-project.ps1 -Dur 75 -B "4.76, 20.55" -Cover 3.5 -Cuts "0,3.76,19.55,72.8" [-Vo audio_v4\full.wav] [-StillsOnly "1,2,3"]
param([int]$Dur, [string]$B, [double]$Cover, [string]$Cuts, [string]$Vo = 'audio_v4\full.wav', [string]$StillsOnly = '', [string]$Piece = 'piece.html', [int]$Lead = 1000)
$bin = if ($env:FFMPEG_DIR) { $env:FFMPEG_DIR } else { 'C:\Users\Dion\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0-full_build\bin' }
$env:PATH = "$bin;$env:PATH"
$tools = $PSScriptRoot
node "$tools\gc-export.mjs" --dur $Dur --piece $Piece | Select-Object -Last 1
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
  return
}
node "$tools\gc-render.mjs" video_noaudio.mp4 | Select-Object -Last 1
node srt.mjs
$m = Get-Content music.mjs -Raw
$m = $m -replace 'DUR = \d+', "DUR = $Dur"
$m = $m -replace 'const B = \[[^\]]*\];', "const B = [$B];"
[IO.File]::WriteAllText((Join-Path (Get-Location) 'music.mjs'), $m)
node music.mjs | Out-Null
ffmpeg.exe -v error -y -i $Vo -af "adelay=$Lead,apad=whole_dur=$Dur" -t $Dur -ar 48000 -ac 1 vo_padded.wav
ffmpeg.exe -v error -y -i vo_padded.wav -i music.wav -filter_complex "[1]volume=0.35[m];[m][0]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=300[md];[0][md]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11,alimiter=limit=0.84:attack=2:release=50:level=disabled[x]" -map '[x]' -t $Dur -ar 48000 mix_norm.wav
ffmpeg.exe -v error -y -i video_noaudio.mp4 -i mix_norm.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -ar 48000 -t $Dur -movflags +faststart preview.mp4
ffprobe.exe -v error -count_frames -show_entries stream=codec_name,width,height,r_frame_rate,nb_read_frames,duration -show_entries format=duration,size -of compact preview.mp4
ffmpeg.exe -hide_banner -i preview.mp4 -vf "blackdetect=d=0.1:pix_th=0.1,freezedetect=n=0.001:d=2" -an -f null - 2>&1 | Select-String 'black_start|freeze_start'
ffmpeg.exe -hide_banner -i preview.mp4 -af volumedetect -vn -f null - 2>&1 | Select-String 'max_volume'
$c = $Cuts.Split(',') | ForEach-Object { [double]$_ }
for ($i = 0; $i -lt $c.Count - 1; $i++) { ffmpeg.exe -v error -y -ss $c[$i] -to $c[$i + 1] -i $Vo -c:a libmp3lame -b:a 192k ("audio\scene_{0:D2}.mp3" -f ($i + 1)) }
$cf = [int][math]::Round($Cover * 30)
ffmpeg.exe -v error -y -ss $Cover -i preview.mp4 -frames:v 1 -q:v 2 cover-raw.jpg
node "$tools\cover-badge.mjs" cover-raw.jpg ("cover-{0:D4}.jpg" -f $cf)
