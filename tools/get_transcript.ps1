# 用法: .\get_transcript.ps1 "https://www.youtube.com/watch?v=xxxxx"
# 输出: subtitles\ 目录下的 .txt 纯文字字幕

param([string]$url)

if (-not $url) {
    Write-Host "用法: .\get_transcript.ps1 <YouTube链接>"
    exit
}

$outDir = "$PSScriptRoot\..\subtitles"
New-Item -ItemType Directory -Force $outDir | Out-Null

Write-Host "正在下载字幕..." -ForegroundColor Cyan
python -m yt_dlp `
    --write-auto-sub `
    --sub-lang "zh-Hans" `
    --sub-format vtt `
    --skip-download `
    --js-runtimes node `
    --remote-components "ejs:github" `
    --output "$outDir\%(title)s.%(ext)s" `
    $url

# 找到刚下载的 vtt 文件
$vttFile = Get-ChildItem $outDir -Filter "*.vtt" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if (-not $vttFile) {
    Write-Host "未找到字幕文件，该视频可能没有中文字幕" -ForegroundColor Red
    exit
}

Write-Host "清洗字幕中..." -ForegroundColor Cyan

$txtFile = $vttFile.FullName -replace '\.zh-Hans\.vtt$', '.txt'
python -c "
import sys
sys.stdout.reconfigure(encoding='utf-8')
path = r'$($vttFile.FullName.Replace('\','\\'))'
out  = r'$($txtFile.Replace('\','\\'))'
with open(path, encoding='utf-8') as f:
    content = f.read()
result, prev = [], None
for line in content.split('\n'):
    line = line.strip()
    if not line or line.startswith('WEBVTT') or line.startswith('Kind:') or line.startswith('Language:') or '-->' in line:
        continue
    if line != prev:
        result.append(line)
        prev = line
with open(out, 'w', encoding='utf-8') as f:
    f.write(''.join(result))
print('字幕已保存:', out)
"

Write-Host "完成！把 .txt 内容粘贴给 Claude，让它生成博客文章。" -ForegroundColor Green
