"""
清理截图：
1. 抹掉右上角 "Nico投资有道" 水印
2. 模糊掉用户名等个人信息
用法: python clean_screenshots.py
"""
import sys
import os
from PIL import Image, ImageFilter, ImageDraw

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE = r"c:\Users\h\Desktop\银行卡Aff项目\site\public\images\tutorials"

# 水印区域（像素坐标，960x540 图像）—— 按卡片类别配置
# 每个卡片的 list 里可以有多个区域，都会用左侧贴片方式覆盖

WATERMARK_REGIONS = {
    # 默认：Nico投资有道 白色圆角框，右上角
    "_default": [(710, 5, 960, 75)],
    # roogoo 视频（知知点区块）：右下角有频道署名 + 右侧中部有小红 logo
    "roogoo": [(710, 5, 960, 75), (570, 478, 960, 540), (930, 250, 960, 310)],
    # monzo：crop 已把 x>700 裁掉（含右侧 Nico 水印），不再需要 patch 区域
    "monzo": [],
    # n26：中文财经博客的半透明斜线水印，覆盖在 slide 背景上，用重模糊淡化
    "n26": [(710, 5, 960, 75)],
    # kraken-card、safepal-card、pokepay — 与默认相同
}

# 特定截图需要额外模糊的区域（slug -> {step -> [(l,t,r,b), ...]}）
EXTRA_BLUR = {
    # bybit step-04 右侧面板曾有用户名，保留 blur 保险起见
    "bybit-card": {
        "step-04": [(638, 125, 958, 175)],
    },
    # n26 step-04 左侧手机显示邮件中的收件人姓名 "Hey Tala."
    "n26": {
        "step-04": [(65, 138, 250, 180)],
    },
    # monzo：浮动水印位置每帧不同，无法精准覆盖；crop 已移除右侧镜像手机
    # 不做额外 blur，避免误盖有效内容
}


def crop_to_phone_screen(img: Image.Image) -> Image.Image:
    """
    对 Monzo 截图：
    - 左侧 x<300 是深色 × 背景（含频道名水印）
    - x=300~690 是主手机屏幕内容
    - x=690~960 是右侧镜像手机 + × 背景
    裁剪掉右侧镜像区域，保留左侧 + 主屏幕，resize 到 960px。
    """
    cropped = img.crop((0, 0, 700, img.height))
    return cropped.resize((960, img.height), Image.LANCZOS)


def blur_region(img: Image.Image, box: tuple, radius: int = 18) -> Image.Image:
    """对指定区域做高斯模糊，返回新图像。"""
    region = img.crop(box)
    blurred = region.filter(ImageFilter.GaussianBlur(radius=radius))
    result = img.copy()
    result.paste(blurred, box)
    return result


def fill_with_patch(img: Image.Image, box: tuple) -> Image.Image:
    """
    用左侧等宽区域的内容填充（修补水印区域）。
    如果左侧区域可用，直接贴过来；否则退化为模糊。
    """
    l, t, r, b = box
    w = r - l
    h = b - t
    img_w, img_h = img.size

    # 取水印左边同等大小的区域作为贴片
    patch_r = l - 2          # 留 2px 间距
    patch_l = patch_r - w
    if patch_l >= 0:
        patch = img.crop((patch_l, t, patch_r, b))
        # 把贴片水平翻转一下，让过渡更自然
        patch = patch.transpose(Image.FLIP_LEFT_RIGHT)
        result = img.copy()
        result.paste(patch, (l, t))
        return result
    else:
        # 退化：用模糊
        return blur_region(img, box, radius=30)


def process_image(path: str, slug: str, step: str) -> bool:
    try:
        img = Image.open(path).convert("RGB")
    except Exception as e:
        print(f"  [FAIL] open {path}: {e}")
        return False

    # 0. monzo 专项：裁掉两侧深色 × 背景（含所有左侧频道名文字）
    if slug == "monzo":
        img = crop_to_phone_screen(img)

    # 1. 覆盖水印区域（用左侧贴片）
    regions = WATERMARK_REGIONS.get(slug, WATERMARK_REGIONS["_default"])
    for box in regions:
        img = fill_with_patch(img, box)

    # 2. 额外模糊（个人信息 + 频道文字）
    slug_blur = EXTRA_BLUR.get(slug, {})
    for box in slug_blur.get("__all__", []):      # 每张都要模糊的区域
        img = blur_region(img, box, radius=12)
    for box in slug_blur.get(step, []):            # 特定步骤的区域
        img = blur_region(img, box, radius=22)

    img.save(path, "JPEG", quality=90)
    return True


def main():
    import sys as _sys
    filter_cards = set(_sys.argv[1:]) if len(_sys.argv) > 1 else None
    cards = os.listdir(BASE)
    total, ok = 0, 0
    for slug in sorted(cards):
        if filter_cards and slug not in filter_cards:
            continue
        card_dir = os.path.join(BASE, slug)
        if not os.path.isdir(card_dir):
            continue
        print(f"\n[{slug}]")
        for fname in sorted(os.listdir(card_dir)):
            if not fname.lower().endswith(".jpg"):
                continue
            step = fname.replace(".jpg", "")
            path = os.path.join(card_dir, fname)
            total += 1
            if process_image(path, slug, step):
                print(f"  [OK] {fname}")
                ok += 1
            else:
                print(f"  [FAIL] {fname}")
    print(f"\n完成: {ok}/{total} 处理成功")


if __name__ == "__main__":
    main()
