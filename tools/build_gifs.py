#!/usr/bin/env python3
"""Construit les GIF de démonstration (assets/gifs/*.gif) à partir des images
de free-exercise-db (https://github.com/yuhonas/free-exercise-db, licence Unlicense /
domaine public). Chaque exercice y est illustré par deux photos (position de
départ 0.jpg et position d'arrivée 1.jpg) ; on les assemble en un GIF animé
de deux images en boucle.

Usage :
    python3 tools/build_gifs.py [dossier_cache]

Dépendance : Pillow (pip install pillow). Le dossier cache (par défaut
.cache/free-exercise-db à côté du dépôt) reçoit les JPG téléchargés.
"""
import io
import sys
import urllib.request
from pathlib import Path

from PIL import Image

BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises"

# nom dans programme.json -> identifiant free-exercise-db
MAPPING = {
    "hack-squat": "Hack_Squat",
    "souleve-de-terre-roumain": "Romanian_Deadlift",
    "presse-45": "Leg_Press",
    "hip-thrust": "Barbell_Hip_Thrust",
    "leg-curl-assis": "Seated_Leg_Curl",
    "chest-press-incline": "Leverage_Incline_Chest_Press",
    "shoulder-press": "Leverage_Shoulder_Press",
    "dips-assistes": "Parallel_Bar_Dip",
    "ecartes-halteres-inclines": "Incline_Dumbbell_Flyes",
    "elevations-laterales": "Side_Lateral_Raise",
    "traction-assistee": "Band_Assisted_Pull-Up",
    "low-row": "Leverage_Iso_Row",
    "rowing-assis-poulie": "Seated_Cable_Rows",
    "curl-pupitre-ez": "Preacher_Curl",
    "face-pull": "Face_Pull",
    "planche": "Plank",
    "dead-bug": "Dead_Bug",
    "planche-laterale": "Side_Bridge",
    "superman": "Superman",
    "pompes": "Pushups",
}

WIDTH = 320          # largeur des GIF
FRAME_MS = 900       # durée de chaque image


def fetch(url: str, dest: Path) -> bytes:
    if dest.exists():
        return dest.read_bytes()
    with urllib.request.urlopen(url, timeout=30) as r:
        data = r.read()
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data)
    return data


def build(slug: str, fid: str, cache: Path, out_dir: Path) -> int:
    frames = []
    for i in (0, 1):
        raw = fetch(f"{BASE}/{fid}/{i}.jpg", cache / fid / f"{i}.jpg")
        im = Image.open(io.BytesIO(raw)).convert("RGB")
        h = round(im.height * WIDTH / im.width)
        im = im.resize((WIDTH, h), Image.LANCZOS)
        frames.append(im.quantize(colors=128, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG))
    out = out_dir / f"{slug}.gif"
    frames[0].save(out, save_all=True, append_images=frames[1:], duration=FRAME_MS, loop=0, optimize=True)
    return out.stat().st_size


def main():
    root = Path(__file__).resolve().parent.parent
    cache = Path(sys.argv[1]) if len(sys.argv) > 1 else root / ".cache" / "free-exercise-db"
    out_dir = root / "assets" / "gifs"
    out_dir.mkdir(parents=True, exist_ok=True)
    total = 0
    for slug, fid in MAPPING.items():
        try:
            size = build(slug, fid, cache, out_dir)
            total += size
            print(f"{slug:28s} <- {fid:32s} {size/1024:6.1f} ko")
        except Exception as exc:  # noqa: BLE001
            print(f"{slug:28s} ECHEC ({exc})")
    print(f"total : {total/1024:.0f} ko")


if __name__ == "__main__":
    main()
