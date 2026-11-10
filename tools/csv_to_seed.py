#!/usr/bin/env python3
"""Convertit les CSV de suivi (muscu, cardio, gainage) en data/seed.json.

Usage :
    python3 tools/csv_to_seed.py [dossier_csv] [fichier_sortie]

Par défaut : lit data/muscu.csv, data/cardio.csv, data/gainage.csv
et écrit data/seed.json.

Format de sortie (identique à l'export JSON de l'application) :
{
  "version": 1,
  "exported_at": "...",
  "muscu":   [{date, seance, exercice, serie, reps, charge_kg, chauffe, note}],
  "cardio":  [{date, type, duree_min, distance_km, fc_moy, fc_max, pente_moy_pct, note}],
  "gainage": [{date, exercice, series, valeur, unite, note}]
}
"""
import csv
import json
import sys
from datetime import datetime, timezone
from pathlib import Path


def num(value):
    """Convertit une chaîne en int/float, ou None si vide."""
    value = (value or "").strip().replace(",", ".")
    if value == "":
        return None
    try:
        f = float(value)
    except ValueError:
        return value
    return int(f) if f.is_integer() else f


def read_csv(path):
    with open(path, newline="", encoding="utf-8") as fh:
        return list(csv.DictReader(fh))


def convert(csv_dir: Path):
    muscu = []
    for row in read_csv(csv_dir / "muscu.csv"):
        note = (row.get("note") or "").strip()
        muscu.append({
            "date": row["date"].strip(),
            "seance": row["seance"].strip(),
            "exercice": row["exercice"].strip(),
            "serie": num(row["serie"]),
            "reps": num(row["reps"]),
            "charge_kg": num(row["charge_kg"]),
            "chauffe": "chauffe" in note.lower(),
            "note": note,
        })

    cardio = []
    for row in read_csv(csv_dir / "cardio.csv"):
        cardio.append({
            "date": row["date"].strip(),
            "type": row["type"].strip(),
            "duree_min": num(row["duree_min"]),
            "distance_km": num(row["distance_km"]),
            "fc_moy": num(row["fc_moy"]),
            "fc_max": num(row["fc_max"]),
            "pente_moy_pct": num(row["pente_moy_pct"]),
            "note": (row.get("note") or "").strip(),
        })

    gainage = []
    for row in read_csv(csv_dir / "gainage.csv"):
        gainage.append({
            "date": row["date"].strip(),
            "exercice": row["exercice"].strip(),
            "series": num(row["series"]),
            "valeur": (row["valeur"] or "").strip(),
            "unite": (row["unite"] or "").strip(),
            "note": (row.get("note") or "").strip(),
        })

    return {
        "version": 1,
        "exported_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "muscu": muscu,
        "cardio": cardio,
        "gainage": gainage,
    }


def main():
    root = Path(__file__).resolve().parent.parent
    csv_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else root / "data"
    out = Path(sys.argv[2]) if len(sys.argv) > 2 else root / "data" / "seed.json"
    data = convert(csv_dir)
    out.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"{out} : {len(data['muscu'])} séries, {len(data['cardio'])} cardio, "
          f"{len(data['gainage'])} gainage")


if __name__ == "__main__":
    main()
