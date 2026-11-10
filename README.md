# GymTrack

Carnet d'entraînement (musculation, cardio, gainage, poids de corps) sous forme de petite application web, pensée pour être utilisée sur téléphone à la salle. Le dépôt est livré avec des données d'exemple : l'historique d'un pratiquant depuis le 30/09/2026 (`data/seed.json`). Site 100 % statique (HTML/CSS/JS, sans framework ni étape de build), installable comme PWA et utilisable hors ligne, hébergé sur GitHub Pages.

## Utilisation

Ouvrir l'URL GitHub Pages du dépôt (ou `index.html` via un petit serveur local, voir plus bas). Sur téléphone, « Ajouter à l'écran d'accueil » installe l'application.

### Onglets

- **Aujourd'hui** — la séance du jour est présélectionnée selon le jour de la semaine (lundi jambes, mardi poussée, mercredi cardio, jeudi tirage, vendredi cardio ou repos) ; on peut en choisir une autre ou changer la date. Pour chaque exercice : objectif (séries × reps @ charge), détail de charge, dernière performance enregistrée, un bloc « Voir la démo » (GIF chargé à la demande) et une ligne par série à valider (reps et kg préremplis, case « chauffe » pour une série d'échauffement). Valider une série l'enregistre, lance le **timer de repos** (90 s ou 60 s selon l'exercice, affiché en gros en haut de l'écran, avec vibration et bip à zéro, boutons +30 s / Passer) et démarre le **chrono de séance** dans l'en-tête (appuyer dessus pour le terminer). Le timer et le chrono sont calculés à partir d'horodatages : ils restent justes même si l'écran s'éteint. Le bloc « Autre exercice » permet d'enregistrer un exercice hors programme.
- **Historique** — par défaut, une carte par séance (date + type de séance), la plus récente en premier : nombre d'exercices, nombre de séries, volume total (Σ reps × kg des séries hors échauffement, contrepoids compté tel quel) et la séance cardio du même jour s'il y en a une (durée, distance, FC moyenne). Appuyer sur une carte déplie ses séries, regroupées par exercice avec la charge max de la séance ; un badge **Progression +x** apparaît sur un exercice quand sa charge max (hors échauffement) dépasse celle de la séance précédente du même exercice (pour les exercices à contrepoids, traction et dips assistés, c'est au contraire un contrepoids plus bas qui compte : badge **Progression −x**), et la carte repliée affiche le nombre de progressions. Le bouton « Par séance / Toutes les séries » bascule vers le tableau à plat de toutes les séries. Les filtres exercice et date s'appliquent aux deux vues ; suppression possible série par série.
- **Progression** — un graphique par exercice : charge maximale (hors échauffement) par séance.
- **Cardio** — saisie et liste des séances de tapis, plus le gainage.
- **Profil** — fiche (taille, date de naissance, FC max estimée avec un bouton « 220 − âge », objectif libre), journal du poids de corps (date, poids prérempli avec la dernière pesée, note ; liste et graphique SVG dans le temps) et tuiles calculées : IMC (taille + dernière pesée ; vide tant que la taille n'est pas renseignée), poids réellement tiré en traction (poids − contrepoids courant, c'est-à-dire la dernière série hors échauffement de « Traction assistée »), ratio chest press / poids de corps (charge max de la dernière séance de chest press) et zones cardiaques dérivées de la FC max (échauffement < 60 %, base 65–75 %, intervalles 80–88 %).
- **Données** — export JSON, import JSON (remplacement ou fusion), retour au seed, rappel des règles de progression.

### Charges

Les charges sont enregistrées comme dans les CSV d'origine : charge totale pour les machines à disques (le détail « par côté » figure dans le programme), charge par main pour les haltères, valeur du contrepoids pour les tractions et dips assistés.

## Stockage et mise à jour des données

Au premier lancement, `data/seed.json` est chargé dans le `localStorage` du navigateur. Ensuite tout vit dans le `localStorage` : le seed n'est relu que si l'on clique « Revenir au seed » (onglet Données).

**Vie privée** : le dépôt est public. Il contient l'historique d'entraînement (séries, cardio, gainage, pesées), la FC max et l'objectif, mais aucune donnée identifiante. Les champs du profil qui décrivent la personne (taille, date de naissance) restent à `null` / vide dans `data/seed.json` ; ils ne sont écrits que dans le `localStorage` du téléphone. Si tu exportes puis commits un `seed.json`, pense à vider ces deux champs avant.

Pour remonter les données saisies sur le téléphone dans le dépôt :

1. Onglet **Données** → **Exporter en JSON** : un fichier `seed.json` est téléchargé, au même format que `data/seed.json`.
2. Remplacer `data/seed.json` par ce fichier, committer, pousser.
3. Sur les autres appareils, « Revenir au seed » (ou « Importer ») recharge ces données.

Pour repartir des CSV (`data/muscu.csv`, `data/cardio.csv`, `data/gainage.csv`) :

```bash
python3 tools/csv_to_seed.py            # lit data/*.csv, écrit data/seed.json
python3 tools/csv_to_seed.py autre/dossier sortie.json
```

Format de `seed.json` :

```json
{
  "version": 2,
  "exported_at": "2026-11-09T07:00:00Z",
  "profil":  { "taille_cm": null, "naissance": "", "fc_max": 185, "objectif": "Traction complète sans assistance" },
  "muscu":   [{ "date": "2026-11-03", "seance": "Jambes", "exercice": "Hack squat", "serie": 2, "reps": 10, "charge_kg": 40, "chauffe": false, "note": "20 par côté" }],
  "cardio":  [{ "date": "2026-11-06", "type": "Intervalles", "duree_min": 47.2, "distance_km": 4.25, "fc_moy": 144, "fc_max": 172, "pente_moy_pct": 10.1, "note": "" }],
  "gainage": [{ "date": "2026-10-28", "exercice": "Planche", "series": 2, "valeur": "60", "unite": "s", "note": "" }],
  "poids":   [{ "date": "2026-09-22", "poids_kg": 84, "note": "" }]
}
```

La version 2 ajoute `profil` et `poids`. Un fichier de version 1 (sans ces clés, par exemple produit par `tools/csv_to_seed.py`) s'importe toujours : le profil est alors vide et la liste des pesées également. En mode « fusionner », les pesées sont dédoublonnées comme les autres entrées et seuls les champs renseignés du profil importé remplacent les champs locaux.

## Programme

`data/programme.json` décrit les séances (un objet par type de séance) : exercices avec séries, reps, charge cible, détail, temps de repos (`repos_s`), règle de progression, GIF de démonstration (`gif`) et éventuels alias (`alias`) qui rattachent d'anciens intitulés du CSV au nom actuel (ex. « Leg curl » → « Leg curl assis ») pour l'historique et la progression. Il contient aussi la correspondance jour de semaine → séance (`par_jour`, 0 = dimanche), le gainage de chaque jour et la routine de fin de séance. Modifier ce fichier suffit pour changer les charges cibles ou le programme.

## GIF de démonstration

Les animations de `assets/gifs/` sont construites par `tools/build_gifs.py` à partir des photos de [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (licence **Unlicense**, domaine public). Cette base fournit deux photos par exercice (position de départ et position d'arrivée) ; le script les télécharge, les réduit à 320 px et les assemble en un GIF de deux images en boucle (≈ 1,7 Mo au total pour les 19 exercices). Toutes les animations sont donc des boucles à deux images, pas des vidéos.

Correspondances approximatives : « Dips assistés » utilise les dips aux barres parallèles, « Traction assistée » la traction assistée à l'élastique, « Chest press incliné », « Shoulder press » et « Low row » les machines à levier (leverage) de la base.

```bash
pip install pillow
python3 tools/build_gifs.py   # télécharge dans .cache/ et régénère assets/gifs/
```

## Développement local

Le service worker et `fetch()` exigent un serveur HTTP (pas `file://`) :

```bash
python3 -m http.server 8000
# puis http://localhost:8000/
```

Tous les chemins sont relatifs : le site fonctionne aussi bien à la racine d'un domaine que sous `/GymTrack/` sur GitHub Pages. Après une modification de `index.html`, `app.js` ou `styles.css`, incrémenter `CACHE_NAME` dans `sw.js` pour forcer la mise à jour du cache hors ligne.

## Arborescence

```
index.html            structure des six écrans
app.js                logique (stockage, rendu, timer, graphiques SVG)
styles.css            thème sombre, mobile-first (identité visuelle : voir DESIGN.md)
sw.js                 service worker (cache hors ligne)
manifest.webmanifest  manifeste PWA
icons/                icônes
assets/gifs/          démonstrations (domaine public, voir ci-dessus)
data/seed.json        données de départ (export de l'application)
data/programme.json   programme en cours
data/*.csv            CSV d'origine
tools/csv_to_seed.py  conversion CSV → seed.json
tools/build_gifs.py   génération des GIF
```
