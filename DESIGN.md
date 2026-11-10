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

## Thème rétro 16 bits (optionnel)

Second thème, choisi dans l'onglet Données (« Thème : Moderne / 16 bits / 8 bits »), mémorisé dans
`localStorage` (`gymtrack:theme`) et posé en `data-theme="retro"` sur `<html>` par un script inline
dans `<head>`, avant le premier rendu. Tout tient dans `styles.css` sous `html[data-theme="retro"]` :
surcharge des jetons, puis règles propres au thème. Le thème par défaut ne change pas.

Référence : Super Nintendo / Mega Drive, pas la Game Boy. Boîtes de dialogue de RPG, HUD d'arcade,
palette saturée mais limitée. Les rôles sémantiques du thème moderne sont conservés.

### Palette

| Nom | Hex | Rôle (jeton remplacé) |
|---|---|---|
| Nuit | `#0f0f23` | Fond (`--encre`). |
| Panneau | `#171d4a` | Surfaces des boîtes de dialogue (`--ardoise`). |
| Bleu royal | `#2a3a8c` | Boutons, bordures de 4 px, filets (`--ardoise-2`, `--filet`). |
| Crème | `#fff4d6` | Texte (`--craie`). Secondaire : bleu pâle `#a9b6ea` (`--gris`). |
| Orange couchant | `#ff8c3a` | **Maintenant** : charge cible, série active, compte à rebours, validation (`--braise`). |
| Menthe | `#5ce0a0` | **Fait** : séries enregistrées, charge max, repos terminé (`--cyan`). |
| Rose vif | `#ff5fa2` | Danger : suppression, retour au seed (`--rose`). |
| Ciel | `#5ab4ff` | Sélection et focus : onglet actif, curseur de menu, biseau clair (`--sky`). |
| Or | `#ffd23f` | Récompense et HUD : titres, `LEVEL UP`, `EXP`, courbes, compteur `TIME` (`--gold`). |

Tous les couples texte/fond utilisés passent 4,5:1 (le plus serré : bleu pâle sur bleu royal, 5,1:1).

### Typographie

- **Silkscreen 400/700** (OFL, `assets/fonts/silkscreen-latin-*.woff2`) : chiffres et étiquettes de
  HUD — compte à rebours (72 px), charge cible (30 px), champs de saisie des séries, pastilles,
  libellés de champs en capitales, boutons, onglets d'historique, graduations des graphiques.
- **Pixelify Sans 400/500/700** (OFL, `assets/fonts/pixelify-sans-latin-*.woff2`) : titres et noms
  d'exercice uniquement (mots, jamais de nombres) ; libellés des onglets du bas.
- **Barlow** reste la fonte du corps de texte. Testé à 17 px : le `5` de Pixelify Sans se confond avec
  un `S` (« 22,5 kg » se lit « 22,S kg ») et le `2` est proche du `Z`. Pour un carnet fait de chiffres,
  c'est rédhibitoire ; la version pixel du corps a donc été écartée après essai. Les nombres isolés
  sont en Silkscreen, dont les chiffres sont sans ambiguïté.
- Fontes auto-hébergées (≈ 40 Ko de plus), ajoutées au shell du service worker.

### Chrome

- Panneaux (`.card`, tuiles, démo ouverte, toast) : bordure pleine de 4 px bleu royal, biseau deux
  tons en `box-shadow` inset (ciel en haut/gauche, nuit en bas/droite), aucun rayon, aucun flou.
- Boutons : en relief (biseau + ombre dure de 4 px dessous), qui s'enfoncent de 2 px à l'appui.
  Champs : en creux (biseau inversé).
- Onglets : barre de menu en bas, icônes pixel 16 × 16 dessinées en rectangles SVG
  (`shape-rendering="crispEdges"`, `.icon-retro`), curseur `▶` or à gauche de l'onglet actif.
  Les icônes modernes restent dans le HTML (`.icon-modern`) ; le CSS affiche l'une ou l'autre.
- Repos : barre de PV segmentée (un segment par 5 s, `#rest-hp`, remplie en orange, qui se vide) sous
  de gros chiffres Silkscreen ; à zéro, chiffres et barre passent menthe et `READY!` clignote en
  deux pas (coupé par `prefers-reduced-motion`). Les boutons +30 s / Passer passent sous la barre.
- Chrono de séance : compteur `TIME 24:13` en or dans l'en-tête, comme un HUD d'arcade, à la place
  du filet qui s'allonge.
- Historique : badge `LEVEL UP +2,5` sur fond or ; « volume » devient `EXP 3470 kg` (la valeur en kg
  reste accolée pour rester compréhensible). Le reste du texte français ne change pas.
- Graphiques : même série dessinée en escalier (`.line-step`, or, `crispEdges`) avec marqueurs carrés
  crème (`.dot-px`), grille pointillée bleu royal ; la version lissée reste dans le SVG et chaque
  thème affiche la sienne.
- Balayage CRT : pseudo-élément fixe `body::after`, 1 px sur 2 à 6 % de noir, `pointer-events: none`,
  statique (pas de scintillement).
- Sélecteur de thème : contrôle segmenté dans Données ; le changement re-rend l'écran courant.
  `theme-color` suit le fond (`#0f0f23`) via JS ; le manifeste garde la couleur du thème par défaut.

### Non retenu

- Corps de texte en Pixelify Sans (voir ci-dessus).
- `image-rendering: pixelated` n'est appliqué qu'aux images ; les GIF de démonstration (photos
  320 px) ne sont pas modifiés.
- Pas de son 8 bits : le bip Web Audio existant reste le même dans les deux thèmes.

## Thème 8 bits (optionnel)

Troisième thème, « 8 bits » dans le sélecteur de l'onglet Données (Moderne / 16 bits / 8 bits),
mémorisé dans `localStorage` (`gymtrack:theme` = `nes`) et posé en `data-theme="nes"` sur `<html>`
avant le premier rendu. Tout tient dans `styles.css` sous `html[data-theme="nes"]`. Les deux autres
thèmes ne changent pas (captures comparées pixel à pixel avant/après, seul l'onglet Données diffère).

Référence : NES / Game Boy, pas la Super Nintendo. Là où le 16 bits est une boîte de dialogue de RPG
avec biseaux et dégradés de bleu, le 8 bits est un écran noir, un filet blanc, une seule fonte et six
couleurs. Les rôles sémantiques sont conservés : jaune = maintenant, vert = fait, rouge = danger.

### Mécanique partagée (app.js)

`isRetro()` est remplacé par `theme()` (`'modern' | 'retro' | 'nes'`) et `isPixel()` (vrai pour les deux
thèmes pixel). `THEME_SPEC` porte ce qui diffère par thème : couleur de `theme-color`, libellés
(`LEVEL UP`, `EXP`, `READY!` / `GO!`, `NEW RECORD`), découpage de la barre de PV (un segment par 5 s en
16 bits, 8 blocs en 8 bits). `renderHpBar`, `labels()` et `applyTheme` lisent cette table ; le 8 bits n'a
donc dupliqué aucune logique. Les règles CSS structurelles communes aux deux thèmes pixel (icônes pixel,
grille du panneau de repos, compteur `TIME`) sont écrites avec les deux sélecteurs.

### Palette

| Nom | Hex | Rôle (jeton remplacé) |
|---|---|---|
| Noir | `#000000` | Fond et panneaux (`--encre`, `--ardoise`) : pas de surface, les boîtes sont des filets. |
| Blanc NES | `#fcfcfc` | Texte, bordures, icônes, curseur (`--craie`, `--filet`). |
| Gris | `#7c7c7c` | Texte secondaire, séries à venir, blocs de PV vides (`--gris`, 5,0:1 sur noir). |
| Jaune | `#f8b800` | **Maintenant** : charge cible, série active, compte à rebours, validation, titres de section, `LEVEL UP`, `EXP`, `NEW RECORD`, barre max des graphiques (`--braise`, `--gold`). |
| Vert clair | `#b8f818` | **Fait** : séries enregistrées, charge max, chiffre du repos à zéro (`--cyan`). |
| Bleu NES | `#0000fc` | Aplats seulement : blocs des histogrammes. Jamais en texte (1,9:1 sur noir). |
| Bleu clair | `#3cbcfc` | Texte bleu : type de séance dans l'historique, valeurs des graphiques, `code`, focus (`--sky`). |
| Rouge | `#f83800` | Danger : suppression, retour au seed (`--rose`, 5,3:1 sur noir). Le jaune porte « maintenant », le rouge ne porte donc que le danger ; le magenta de secours n'a pas été nécessaire. |

Six couleurs au plus par écran (noir, blanc, gris, jaune, vert, bleu clair ; le rouge n'apparaît que sur
Données). Tous les couples texte/fond passent 4,5:1 (le plus serré : gris sur noir, 5,0:1).

### Typographie

- **Press Start 2P 400** (OFL, `assets/fonts/press-start-2p-latin-400-normal.woff2`, 12 Ko, via
  `@fontsource/press-start-2p`) : **une seule fonte partout**, corps compris. Corps 12 px, interligne 1,8 ;
  charge cible 28 px ; compte à rebours 64 px (80 px à partir de 600 px) ; titres 16–18 px ; étiquettes
  de champs 9 px ; libellé d'onglet 7 px ; graduations 7 px.
- Accents vérifiés : é, è, ê, ç, à, ù, É, À sont dans le sous-ensemble latin (220 glyphes), aucun repli
  sur Silkscreen n'a été nécessaire pour le corps. Seuls `−` (U+2212), `→`, `←` et `▶` manquent : le
  signe moins tombe sur la fonte système, et les curseurs `▶` sont dessinés en CSS (triangle en bordures),
  pas en glyphe.
- **Capitales accentuées** : dans une grille 8 × 8, Press Start 2P dessine É, È, À… avec la forme des
  minuscules accentuées. `text-transform: uppercase` donnerait donc « POUSSéE » ou « SéANCE ». Testé aussi
  en tirant les capitales accentuées de Silkscreen par `unicode-range` : pas mieux. Les titres, étiquettes
  et boutons restent donc en casse normale (« Poussée », « + série », « Passer ») et seules les chaînes
  sans accent par construction sont en capitales : `GYMTRACK`, `TIME`, `LEVEL UP`, `EXP`, `NEW RECORD`,
  `GO!`. C'est l'écart assumé par rapport au brief « titres en capitales ».

### Chrome

- Boîtes de dialogue (`.card`, tuiles, démo ouverte, toast) : bordure blanche de 4 px, 2 px de vide, filet
  intérieur de 2 px (`box-shadow` inset en deux couches), aucun rayon, aucun biseau, aucun dégradé. Les
  champs ont un filet de 2 px, les boutons de 3 px.
- Boutons : blanc sur noir, **inversés à l'appui** (noir sur blanc). Le bouton principal est jaune plein, le
  bouton danger rouge sur noir.
- Curseur `▶` clignotant (1 Hz, deux pas, `steps(2)`) à gauche de l'onglet actif et de la première série à
  faire ; coupé par `prefers-reduced-motion`.
- Onglets : les icônes pixel du 16 bits (`.icon-retro`) en blanc uni, **icônes seules** ; le libellé en 7 px
  n'apparaît que sous l'onglet actif (il peut déborder sur les onglets voisins, mais jamais hors de l'écran :
  premier et dernier libellés calés sur les bords). Les `aria-label` restent sur chaque bouton ; cibles
  64 × 65 px.
- Repos : chiffres 64 px jaunes et barre de PV de **8 blocs carrés** de 24 px (un par huitième de la durée),
  séparés, qui passent gris en se vidant. À zéro : chiffre vert, `GO!` en 22 px qui cycle jaune → blanc →
  vert en trois pas (`steps(1)`, statique en `prefers-reduced-motion`), « C'est reparti ! » inchangé.
- Historique : `LEVEL UP` et `EXP` sur fond jaune comme en 16 bits ; `NEW RECORD` (blanc, clignotant) sur
  la séance dont le volume est le maximum de tout l'historique (pas seulement du filtre affiché). Pas de
  « STAGE 1-1 ».
- Graphiques : pas de courbe. `svgBlockChart` dessine un histogramme en **blocs** bleu NES, un bloc par
  5 kg (2,5 kg quand l'amplitude ≤ 15 kg, poids de corps compris), barre(s) au maximum en jaune, valeurs
  en bleu clair, socle blanc. La version courbe/escalier n'est pas générée dans ce thème : le changement de
  thème re-rend l'écran.
- Toast : boîte de dialogue avec une « pièce » jaune de deux images (large / étroite, `steps(1)`) à gauche
  du message. Pas de son.
- Service worker : `gymtrack-v8`, fonte ajoutée au shell. Le manifeste garde la couleur du thème par défaut ;
  `theme-color` passe à `#000000` via JS.

### Non retenu

- Capitales forcées sur les titres (voir Typographie).
- Balayage CRT : propre au 16 bits, le 8 bits reste en noir pur.
- Son 8 bits : le bip Web Audio reste le même dans les trois thèmes.
