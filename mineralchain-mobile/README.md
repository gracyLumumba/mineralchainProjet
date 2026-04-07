# MineralChain Mobile

Application mobile Expo pour consulter les lots, suivre leur statut blockchain et lancer une certification depuis un telephone.

## Demarrage

Depuis `mineralchainProjet/mineralchain-mobile` :

```bash
npm install
npm start
```

Puis :

- appuyez sur `a` pour un emulateur Android
- scannez le QR code avec Expo Go pour un telephone reel

## Tester sur un telephone reel

Le backend Flask doit tourner sur le meme reseau Wi-Fi que le telephone.

1. Lancez le backend dans `mineralchainProjet/backend-minier`
2. Lancez Expo dans `mineralchainProjet/mineralchain-mobile`
3. Si Expo detecte l IP reseau du PC, l application mobile utilisera automatiquement `http://<ip-du-pc>:5000/api`
4. Si besoin, forcez l URL de l API :

```bash
$env:EXPO_PUBLIC_API_BASE_URL="http://192.168.1.20:5000/api"
npm start
```

## Ameliorations deja ajoutees

- detection automatique de l hote Expo pour atteindre le backend depuis un telephone reel
- delai reseau explicite et message d erreur plus utile
- pull-to-refresh sur le tableau de bord, la liste des lots et le detail d un lot
- recherche locale des lots par identifiant, site, statut ou stockage
- detail de lot plus lisible sur petit ecran

## Point d attention

Si le telephone ne charge pas les donnees :

- verifiez que le pare-feu Windows autorise Python ou le port `5000`
- verifiez que le PC et le telephone sont sur le meme reseau
- testez l URL `http://<ip-du-pc>:5000/api/health` depuis le navigateur du telephone
