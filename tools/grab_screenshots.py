"""
从 YouTube 教程视频中按时间间隔截图，保存到 site/public/images/tutorials/
用法: python grab_screenshots.py
"""
import subprocess
import sys
import os
import json
import tempfile
import shutil

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_OUT = r"c:\Users\h\Desktop\银行卡Aff项目\site\public\images\tutorials"
TEMP_DIR = r"c:\tmp\yt_frames"

# ffmpeg 完整路径（winget 安装后需要显式指定）
FFMPEG = r"C:\Users\h\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.1-full_build\bin\ffmpeg.exe"

VIDEOS = {
    "bybit-card":   "nRonDOI1Hho",
    "pokepay":      "CUfqusNgyVU",
    "safepal-card": "rSWtH_urn1Y",
    "roogoo":       "t9dhdeERN7g",
    "monzo":        "sP9RKUY5FbA",
    "n26":          "X7nFo_LVlNk",
    "kraken-card":  "mKqiHKqy2k8",
}

# 截图时间点（秒）— 跳过前 90s 片头，覆盖：注册/KYC/申请卡/充值/绑定支付宝
TIMESTAMPS = [90, 150, 210, 300, 390, 510, 630, 750, 870, 1020]


def get_video_duration(url):
    result = subprocess.run(
        ["python", "-m", "yt_dlp", "--dump-json", "--no-playlist", url],
        capture_output=True, text=True, encoding="utf-8", errors="ignore"
    )
    if result.returncode != 0:
        return None
    info = json.loads(result.stdout)
    return info.get("duration", 600)


def download_and_extract(slug, video_id):
    url = f"https://www.youtube.com/watch?v={video_id}"
    out_dir = os.path.join(BASE_OUT, slug)
    tmp_video = os.path.join(TEMP_DIR, f"{slug}.mp4")
    os.makedirs(TEMP_DIR, exist_ok=True)

    print(f"\n[{slug}] 获取视频信息...")
    duration = get_video_duration(url) or 600
    print(f"[{slug}] 时长: {duration}秒")

    # 过滤掉超出视频时长的时间点
    timestamps = [t for t in TIMESTAMPS if t < duration - 5]

    print(f"[{slug}] 下载低画质视频...")
    dl_result = subprocess.run(
        [
            "python", "-m", "yt_dlp",
            "-f", "worst[ext=mp4]/worst",
            "--no-playlist",
            "-o", tmp_video,
            "--no-progress",
            url,
        ],
        capture_output=True, encoding="utf-8", errors="ignore"
    )
    if dl_result.returncode != 0:
        print(f"[{slug}] download failed")
        return False

    print(f"[{slug}] extracting {len(timestamps)} screenshots...")
    for i, ts in enumerate(timestamps, 1):
        out_path = os.path.join(out_dir, f"step-{i:02d}.jpg")
        ff = subprocess.run(
            [
                FFMPEG, "-y",
                "-ss", str(ts),
                "-i", tmp_video,
                "-frames:v", "1",
                "-q:v", "2",
                "-vf", "scale=960:-2",
                out_path,
            ],
            capture_output=True
        )
        if ff.returncode == 0:
            print(f"  [OK] step-{i:02d}.jpg  ({ts}s)")
        else:
            print(f"  [FAIL] step-{i:02d}.jpg")

    # 清理临时视频
    try:
        os.remove(tmp_video)
    except Exception:
        pass
    return True


if __name__ == "__main__":
    cards = sys.argv[1:] if len(sys.argv) > 1 else list(VIDEOS.keys())
    for slug in cards:
        if slug not in VIDEOS:
            print(f"未知卡片: {slug}")
            continue
        download_and_extract(slug, VIDEOS[slug])
    print("\n全部完成。截图已保存，请单独运行 clean_screenshots.py 去水印。")
