from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets" / "branding" / "irrint-logo-master.png"
ANDROID_RES = ROOT / "android" / "app" / "src" / "main" / "res"
BACKGROUND = (234, 248, 244, 255)


def fitted_logo(size: int, occupancy: float) -> Image.Image:
    source = Image.open(SOURCE).convert("RGBA")
    bounds = source.getbbox()
    if bounds is None:
        raise ValueError("A imagem da marca está vazia.")
    source = source.crop(bounds)
    maximum = round(size * occupancy)
    source.thumbnail((maximum, maximum), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.alpha_composite(source, ((size - source.width) // 2, (size - source.height) // 2))
    return canvas


def launcher_icon(size: int, round_icon: bool = False) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0) if round_icon else BACKGROUND)
    if round_icon:
        ImageDraw.Draw(canvas).ellipse((0, 0, size - 1, size - 1), fill=BACKGROUND)
    canvas.alpha_composite(fitted_logo(size, 0.78))
    return canvas


def splash(width: int, height: int) -> Image.Image:
    canvas = Image.new("RGB", (width, height), BACKGROUND[:3])
    mark_size = round(min(width, height) * 0.38)
    mark = fitted_logo(mark_size, 0.92)
    canvas.paste(mark, ((width - mark_size) // 2, (height - mark_size) // 2), mark)
    return canvas


def main() -> None:
    densities = {
        "mdpi": (48, 108),
        "hdpi": (72, 162),
        "xhdpi": (96, 216),
        "xxhdpi": (144, 324),
        "xxxhdpi": (192, 432),
    }
    for density, (legacy_size, foreground_size) in densities.items():
        directory = ANDROID_RES / f"mipmap-{density}"
        launcher_icon(legacy_size).save(directory / "ic_launcher.png")
        launcher_icon(legacy_size, round_icon=True).save(directory / "ic_launcher_round.png")
        fitted_logo(foreground_size, 0.68).save(directory / "ic_launcher_foreground.png")

    splash_files = [ANDROID_RES / "drawable" / "splash.png"]
    splash_files.extend(ANDROID_RES.glob("drawable-*/splash.png"))
    for target in splash_files:
        current = Image.open(target)
        splash(*current.size).save(target)

    public_logo = fitted_logo(512, 0.92)
    (ROOT / "public").mkdir(exist_ok=True)
    public_logo.save(ROOT / "public" / "irrint-logo.png")


if __name__ == "__main__":
    main()
