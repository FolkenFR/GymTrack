# GymTrack — identité visuelle

Carnet d'entraînement lu à 7 h du matin, seul, dans une salle éclairée au néon rouge et bleu.
Le téléphone est tenu d'une main, souvent avec les doigts humides, entre deux séries.
Le contenu, ce sont des chiffres : la charge à mettre, les reps à faire, les secondes de repos.
Le design doit donc être une **affiche de salle** plutôt qu'une application de SaaS :
peu d'éléments, grands, et une lecture possible à 1,5 m pour le compte à rebours.

## Palette (6 couleurs)

| Nom | Hex | Rôle |
|---|---|---|
| Encre | `#141a2b` | Fond. Un indigo profond, pas un noir teinté : la salle est bleue la nuit, et un fond franchement coloré évite le halo d'un noir pur sur OLED en pièce sombre. |
| Ardoise | `#1f2740` | Surface des panneaux et des contrôles ; séparateurs en `#2c3654`. |
| Craie | `#f3efe6` | Texte principal, légèrement chaud pour trancher sur l'encre froide. Texte secondaire : `#98a1bb`. |
| Braise | `#ff7a45` | **Maintenant** : la charge à faire, la série active, le compte à rebours, le bouton de validation. C'est le néon rouge, poussé vers l'orange pour rester lisible et ne pas dire « erreur ». |
| Cyan | `#5fd3ff` | **Enregistré** : séries faites, courbes de progression, valeurs de la dernière fois, onglet actif. Le néon bleu. |
| Rose d'alerte | `#f0506e` | Suppression et réinitialisation uniquement. |

Règle : braise = ce qui reste à faire ou qui tourne ; cyan = ce qui est fait ou mesuré.
Une série passe donc visuellement du braise (cible) au cyan (faite). Les séries d'échauffement
restent en craie atténuée, sans couleur.

## Typographie

- **Barlow Condensed 600/700** (affichage) : les chiffres de charge, le compte à rebours, les
  titres de séance et d'exercice, les tuiles. Grotesque condensée à la DIN, dessinée pour les
  panneaux ; très lisible en gros et très économe en largeur sur 390 px.
- **Barlow 400/500/600** (texte) : corps, libellés, formulaires, tableaux. Même famille, donc
  une seule voix, mais un contraste franc entre condensé/gras et large/régulier.
- Chiffres tabulaires partout où des nombres s'alignent (`font-variant-numeric: tabular-nums`).
- Fontes auto-hébergées (`assets/fonts/`, licence OFL, 110 Ko) pour fonctionner hors ligne ;
  repli local : `"Arial Narrow"`, `Impact` pour le condensé, `system-ui` pour le texte.
- Échelle (base 17 px) : 13 — 15 — 17 — 20 — 26 — 34 — 44 (charge cible) — 128 (repos).

## Concept de mise en page

Pas de cartes identiques : un seul fond, et l'organisation se lit par la taille du type et
par des filets. Les panneaux (formulaires, timer) sont les seules surfaces en ardoise.
Les contrôles (champs, boutons) ont un rayon de 6 px ; les panneaux un rayon de 14 px ;
rien d'autre n'est arrondi.

Alignement : tout à gauche sur une colonne (max 720 px centrés sur tablette), sauf le compte
à rebours, centré car lu de loin. Les valeurs numériques dans les tableaux sont alignées à
droite.

### Aujourd'hui

```
┌──────────────────────────────────────┐
│ GymTrack                mar. 10 nov. │  en-tête fin
│━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 24:13   │  chrono : filet qui s'allonge (90 min = largeur), pas de pastille
├──────────────────────────────────────┤
│ Poussée                              │  34 px condensé
│ [Mardi — Poussée        ▾] [10/11 ▾] │  sélecteurs discrets, hauteur 48
│                                      │
│ 1 Chest press incliné                │  26 px condensé
│   60 kg      4 × 8        repos 90 s │  44 px braise  |  26 px craie  |  15 px gris
│   22,5/côté, +2,5 kg quand propre    │  15 px gris
│   Dernière fois 06/11 : 8×55 8×55 7×55│  cyan sur les valeurs
│                                      │
│   ✓ 1  8 × 60    ✓ 2  8 × 60         │  séries faites : cyan, compactes
│  ▌3  [  8 ] reps [ 60 ] kg [chauffe] [✓]│  série active : bord braise, ✓ plein
│   4  [  8 ]      [ 60 ]    [chauffe] [✓]│  suivantes : plus discrètes
│   + série                 Voir la démo ▸│
│ ──────────────────────────────────── │  filet entre exercices
│ 2 Écartés haltères inclinés          │
│   …                                  │
```

### Repos (barre fixe en haut, lisible à 1,5 m)

```
┌──────────────────────────────────────┐
│ Repos — Chest press incliné, série 2 │  15 px gris
│                                      │
│  [ +30 s ]       87        [ Passer ]│  128 px condensé braise, boutons 48 px
│                                      │
│ ████████████████████████░░░░░░░░░░░░ │  barre 8 px braise qui se vide (seul mouvement)
└──────────────────────────────────────┘
```
À 0 : le fond du panneau passe au cyan sombre, le chiffre au cyan, « C'est reparti ! ».

## Principes

1. **Le chiffre est le contenu.** La charge cible et le compte à rebours sont composés en
   affiche ; les libellés sont petits, après le nombre, jamais au-dessus en capitales.
2. **Deux couleurs, deux temps.** Braise = maintenant ; cyan = fait. Aucune autre couleur
   décorative. Le rose n'apparaît que sur ce qui efface.
3. **Lisible d'une main, doigts mouillés.** Corps ≥ 17 px, cibles tactiles ≥ 48 px, champs
   de saisie en 22 px condensé, bouton de validation plein et large à droite (pouce droit).
4. **La hiérarchie vient du type et des filets, pas des boîtes.** Un panneau n'existe que
   s'il porte une interaction (formulaire, timer, démo repliée).
5. **Un seul mouvement.** La barre de repos qui se vide. Tout le reste est instantané ;
   `prefers-reduced-motion` coupe aussi ce mouvement.

## Revue contre les poncifs — ce que j'ai changé

- Première version du plan : fond `#0e0f12` + un seul accent vert. C'est exactement le défaut
  à éviter. Remplacé par un indigo franc tiré de la salle, et **deux** accents à rôle sémantique
  (braise/cyan) qui viennent du néon du lieu, pas d'un nuancier.
- Les « étiquettes » en capitales espacées des tuiles du profil (`IMC`, `ZONE BASE`) sont passées
  en casse normale, sous la valeur, en Barlow 500.
- Les méta-informations jointes par des points médians (`détail · repos 90 s · progression`)
  sont composées en éléments distincts (repos à droite, détail en ligne propre).
- Les cartes identiques à rayon 12 px et bordure partout sont supprimées sur Aujourd'hui,
  Historique et Progression : liste + filets. Les panneaux restent pour les formulaires.
- Le chrono en pastille clignotante devient un filet de progression sous l'en-tête.
- Pas d'Inter/Roboto/system : Barlow + Barlow Condensed, auto-hébergées.
- Mode clair : non livré (le contexte est une salle sombre) ; les jetons sont dans `:root`
  et rendent un thème clair possible plus tard.
