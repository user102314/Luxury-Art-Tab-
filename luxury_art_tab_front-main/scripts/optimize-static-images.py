"""Compress homepage static assets to display-sized WebP."""
from __future__ import annotations

import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow manquant. Installez-le avec: python -m pip install pillow")

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "src" / "assets"


def convert(src: Path, dest: Path, max_size: tuple[int, int], quality: int, keep_alpha: bool) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(src) as im:
        im.thumbnail(max_size, Image.Resampling.LANCZOS)
        if keep_alpha and ("A" in im.getbands() or im.mode in {"RGBA", "LA", "P"}):
            im = im.convert("RGBA")
            im.save(dest, "WEBP", quality=quality, method=6)
        else:
            im = im.convert("RGB")
            im.save(dest, "WEBP", quality=quality, method=6)
    print(f"{src.name}: {src.stat().st_size // 1024} KiB -> {dest.stat().st_size // 1024} KiB")


def main() -> None:
    decor = ASSETS / "decor"
    for name in [
        "brush-stroke-red.png",
        "brush-stroke-brown.png",
        "brush-stroke-orange.png",
        "brush-stroke-beige.png",
        "paint-splash-brown.png",
        "paint-splash-orange.png",
        "paint-splash-brick.png",
        "paint-splash-beige.png",
    ]:
        src = decor / name
        if src.exists():
            convert(src, src.with_suffix(".webp"), (400, 400), 78, True)
            src.unlink()

    atelier = decor / "atelier-process.jpg"
    if atelier.exists():
        convert(atelier, atelier.with_suffix(".webp"), (1280, 960), 76, False)
        atelier.unlink()

    cuisine = ASSETS / "Cuisine"
    if cuisine.exists():
        for src in cuisine.glob("*.jpeg"):
            convert(src, src.with_suffix(".webp"), (480, 640), 74, False)
            src.unlink()
        for src in cuisine.glob("*.jpg"):
            convert(src, src.with_suffix(".webp"), (480, 640), 74, False)
            src.unlink()


if __name__ == "__main__":
    main()
