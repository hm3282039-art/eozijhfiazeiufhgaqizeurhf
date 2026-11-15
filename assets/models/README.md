# Modèles de pets (.glb)

Dépose ici les fichiers Blender exportés en **glTF 2.0 (.glb)** (ex : `cat.glb`, `dog.glb`).

Puis, dans `src/config/petSpecies.js`, renseigne l'URL du modèle pour l'espèce concernée :

```js
modelUrl: 'assets/models/cat.glb',
```

Le modèle est normalisé automatiquement (taille, centrage, sol, ombres) et son animation
« Idle » est jouée en boucle. Si le fichier est introuvable ou invalide, le jeu retombe
sur le générateur procédural et affiche un avertissement dans la console.
