# Last Signal — Pixel Royale

Jeu de battle royale tactique en Canvas 2D et modules JavaScript, à jouer au clavier et à la souris. Choisissez Battle Royale, Zone Wars ou Nuit furtive, puis Solo, Duo, Trio ou Squad. Chaque partie contient 80 combattants.

## Lancer

Ouvrez directement `index.html` dans un navigateur, ou lancez l’aperçu avec `python3 serve.py` et ouvrez `http://localhost:8000`. Cet aperçu désactive le cache et recharge automatiquement la page après une reconstruction ; pendant une partie, il affiche un bouton d’actualisation sans interrompre le jeu. La page est autonome : CSS et JavaScript sont intégrés et aucune dépendance réseau n'est nécessaire pour jouer.

Pour modifier le jeu, éditez `style.css`, les modules de `js/` ou `index.template.html`, puis reconstruisez la page autonome :

```sh
npm ci
npm run build
```

Le fichier `index.html` est généré par cette commande ; ne l'éditez pas directement. Si JavaScript est désactivé ou rencontre une erreur, un message est affiché en haut de la page.

## Commandes

- **ZQSD**, **WASD** ou flèches : déplacement ; **Shift** : marche silencieuse.
- **Souris** : viser ; **clic gauche** : tirer.
- **1, 2, 3** ou **molette** : choisir un emplacement.
- **E** : ramasser un objet ou utiliser le soin / fumigène sélectionné. Maintenir E près d'un allié à terre pour le réanimer. Les objets occupent d'abord un emplacement libre ; lorsque l'inventaire est plein, appuyez une première fois sur E puis une seconde fois dans les trois secondes pour remplacer l'objet du slot sélectionné. L'objet remplacé est déposé au sol.
- **F** : regrouper les alliés ; **G** : défendre leur position.
- **M** : ouvrir ou fermer la carte ; **Échap** ferme aussi la carte.
- **B** : déclencher l’emote équipée.

Les buissons bloquent la vue, pas les balles, et cachent les combattants qui s'y trouvent tant qu'ils ne tirent pas. Le joueur réapparaît temporairement après un tir. En équipe, un joueur éliminé observe un allié survivant jusqu'à la fin de l'équipe. Les réserves de munitions sont illimitées, mais les chargeurs se rechargent automatiquement lorsqu’ils sont vides ; les soins sont consommables. Le coffre mythique est situé sur l'îlot du lac ; l'eau est traversable. La boutique vend des skins en pièces fictives ; les achats sont aussi disponibles dans le casier, qui permet d'équiper skins, faisceaux, traînées et emotes. La carte de 9 600 × 9 600 comporte dix lieux nommés. Les équipes apparaissent espacées et les tirs sont désactivés pendant les huit premières secondes. La minimap et la grande carte montrent la zone actuelle en violet et la prochaine en pointillés jaunes. Le joueur commence avec 600 pièces de test ; une partie terminée rapporte 60 pièces, 10 par élimination et 120 supplémentaires pour une victoire. Un abandon compte dans les statistiques, mais ne rapporte pas de pièces. Le profil et les cosmétiques sont stockés localement dans le navigateur : changer de navigateur ou effacer ses données les réinitialise. Dans Compétition, les boutons de test donnent 500 pièces et 100 PR de test, ou démarrent une simulation d'endgame à 32 survivants. Cette simulation ne modifie ni les statistiques ni les récompenses et reste une partie locale contre des bots. Les onglets Compétition et Carrière affichent le profil local. La Ranked et les Cups sont jouables contre des bots ; classement, PR, gains et pièces sont fictifs et ne correspondent pas à une compétition en ligne.

## Arsenal et profil — version 3.0

L'arsenal comprend deux pompes, trois fusils d'assaut (dont une vraie rafale de trois tirs), deux PM dont le P90 à 50 cartouches, le sniper coup par coup, le fusil de précision semi-auto, un pistolet et un lance-grenades. Les explosions blessent les ennemis à proximité si aucun mur ne les sépare. Le sniper augmente la portée de vision. Les mini-potions, grosses potions, kits et fumigènes sont complétés par le Bleuvage : 30 points sur 10 secondes, d'abord en vie puis en bouclier.

Les skins ont des sprites pixel art dessinés en Canvas et des accessoires propres ; les aperçus du lobby et du casier sont animés. La carte de carrière permet de modifier le pseudo et la bannière. Son cadre suit le rang ; le niveau gagne un point toutes les cinq parties. Les statistiques par format commencent à la version 3.0 : les anciens totaux ne contenaient pas le format et ne peuvent pas être répartis rétroactivement. Le meilleur classement Cup est attribué au format de la dixième partie. Le K/D est le nombre d'éliminations divisé par les parties sans victoire (minimum 1), incluant les abandons.

Les hubs et le HUD compétitif affichent la progression et les points calculés en direct. Les paliers de placement Ranked ne sont pas cumulables, contrairement aux paliers de Cup. Le HUD Ranked distingue le gain brut et le bilan après frais d'entrée ; le classement Cup en cours est une estimation contre les scores simulés des manches déjà terminées. Les pourcentages de rang sont arrondis à deux décimales.

## Compétition locale — version 4.0

**Ces règles sont inspirées du jeu compétitif mais ne sont pas officielles.** Les parties sont locales contre IA ; classement, PR, dollars et pièces sont fictifs. Chaque classement de Cup comporte 30 équipes simulées, pas un classement mondial.

- **Ranked** : Bronze 0, Argent 300, Or 700, Platine 1 200, Diamant 1 800, Élite 2 500, Champion 3 300, Unreal 4 200 points. À l'intérieur des sept premiers rangs, le pourcentage est calculé entre les deux seuils ; Unreal affiche les points au-delà de 4 200, sans classement mondial inventé. Placement non cumulable : victoire +120, top 10 % +80, top 25 % +50, top 50 % +20. Par élimination : respectivement 15, 15, 16, 16, 17, 18, 19, 20 selon le rang. Coût d'entrée : 0, 10, 20, 30, 40, 50, 60, 70 points selon le rang. Un abandon coûte seulement l'entrée. Deux parties après une promotion protègent contre une descente sous le seuil du nouveau rang ; elles sont consommées même lors d'un abandon. Le solde ne descend pas sous zéro. Le gain en % de l'écran de résultat est exprimé sur l'échelle du rang **avant** la partie ; les pourcentages avant/après apparaissent séparément lors d'un changement de rang.
- **Cups** : Solo Cash Cup (Bronze), Duo Victory Cup (Or), Trio Contender Cup (Platine), Squad Cup (Diamant). Chaque format est imposé et chaque événement conserve sa session indépendante de 10 parties. Après la dixième, consulter le classement final ou démarrer explicitement une nouvelle session. Les seuils de rang s'appliquent aussi pour reprendre une session. Un abandon consomme une partie et rapporte zéro.
- **Barème Cup cumulable** : Top 25 +2, Top 15 +3, Top 10 +3, Top 5 +4, Top 3 +5, Top 1 +8 ; élimination +2. En Squad, où 20 équipes commencent, le palier Top 25 est atteint dès le départ. Les autres équipes accumulent des scores simulés après chaque partie.
- **Récompenses de session fictives** : 1er 100 PR / $500 / 500 pièces, top 5 50 / $200 / 300, top 10 30 / $100 / 200, top 15 20 / $50 / 100, autres 5 / $0 / 50. Un Top 1 débloque automatiquement Champion doré ; un top 10 de Cup débloque Icône de la Cup. Ces récompenses s'ajoutent aux pièces de partie et ne sont attribuées qu'une fois.
- **Migration 3.0** : les anciennes sessions sont conservées comme archives, avec leurs scores inchangés, mais ne sont pas poursuivies avec le nouveau barème. Les totaux, historiques, cosmétiques et rang restent conservés.
- **Storm Surge** : à partir de la phase 4 affichée, si le nombre de survivants dépasse le seuil (65, 50, 40, 24, 16, puis 10), les équipes les moins actives en dégâts sont averties pendant 8 secondes puis subissent 12 dégâts toutes les 3 secondes jusqu'à sortir de la zone de risque ou repasser sous le seuil.

Les coffres ordinaires apparaissent à l'intérieur des structures ; des caches sans coffre se trouvent près des lieux-dits. Le fumigène dissimule temporairement les combattants à l'intérieur, sauf pendant un tir ; il ne bloque pas les balles.

## Tests de logique

```sh
npm test
```

Les tests couvrent les 12 combinaisons de modes et formats, les KO, les éliminations, le classement, les buissons, la carte, les achats, la persistance, le ramassage, les distances de spawn, les cercles de tempête, le Storm Surge, la vision des bots, les barèmes Ranked/Cup, les promotions et protections, les sessions et leur migration, les coffres et les récompenses enregistrées une seule fois. Ils ne remplacent pas un test visuel ou de performance dans un navigateur.
