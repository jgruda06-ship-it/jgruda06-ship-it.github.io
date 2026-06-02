"""Generate favicon.ico and apple-touch-icon.png for Jakub Gruda Fotografia."""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
BG = (24, 24, 24)
FG = (255, 255, 255)
ACCENT = (46, 228, 187)  # #2ee4bb – accent from template


def load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for name in ("arial.ttf", "Arial.ttf", "segoeui.ttf", "DejaVuSans.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def draw_monogram(size: int) -> Image.Image:
    img = Image.new("RGB", (size, size), BG)
    draw = ImageDraw.Draw(img)
    margin = max(2, size // 10)
    draw.rectangle(
        (margin, margin, size - margin - 1, size - margin - 1),
        outline=ACCENT,
        width=max(1, size // 24),
    )
    font = load_font(max(10, size // 3))
    text = "JG"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(((size - tw) // 2, (size - th) // 2 - size // 32), text, fill=FG, font=font)
    return img


def main() -> None:
    apple = draw_monogram(180)
    apple.save(ROOT / "apple-touch-icon.png", format="PNG", optimize=True)

    sizes = [16, 32, 48]
    icons = [draw_monogram(s) for s in sizes]
    icons[0].save(
        ROOT / "favicon.ico",
        format="ICO",
        sizes=[(s, s) for s in sizes],
    )
    print("Created favicon.ico and apple-touch-icon.png")


if __name__ == "__main__":
    main()
