# MineralChain Mobile

Application mobile Expo pour consulter les lots, suivre leur statut blockchain, scanner les certificats QR et travailler depuis un telephone sur le terrain.

## Fonctionnalites principales

- connexion par role : producteur, regulateur, transporteur, administrateur
- consultation des lots synchronises avec le backend Flask
- recherche locale dans le registre mobile
- detail de lot avec statut IA, DGMR, blockchain et transport
- scanner QR transporteur avec la camera du telephone
- ouverture directe de la fiche du lot apres lecture du QR
- fallback par saisie manuelle du Lot ID ou du Token

## Demarrage

Depuis `mineralchainProjet/mineralchain-mobile` :

```bash
npm install
npm start
```

Puis :

- appuyez sur `a` pour un emulateur Android
- scannez le QR code avec Expo Go pour un telephone reel

## Scanner QR transporteur

Le role transporteur dispose d'une entree `Scanner QR`.

Le scanner utilise `expo-camera` pour lire le QR du certificat NFT. Quand un QR est detecte, l'application recherche le lot correspondant dans les lots synchronises puis ouvre directement sa fiche.

Le QR peut contenir :

- une URL publique de verification avec `lot` ou `token`
- un `lot_id`
- un `token_id`

Si la camera n'est pas autorisee ou si le QR est abime, utilisez la saisie manuelle dans le meme ecran.

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
- champ de configuration de l URL API directement dans l ecran de connexion mobile
- delai reseau explicite et message d erreur plus utile
- pull-to-refresh sur le tableau de bord, la liste des lots et le detail d un lot
- recherche locale des lots par identifiant, site, statut ou stockage
- detail de lot plus lisible sur petit ecran
- scanner QR transporteur avec `expo-camera`
- entree `Scanner QR` dans le menu transporteur et le menu lateral

## Point d attention

Si le telephone ne charge pas les donnees :

- verifiez que le pare-feu Windows autorise Python ou le port `5000`
- verifiez que le PC et le telephone sont sur le meme reseau
- testez l URL `http://<ip-du-pc>:5000/api/health` depuis le navigateur du telephone

Si la camera ne s'ouvre pas :

- autorisez l'acces camera dans Expo Go ou dans les parametres du telephone
- utilisez un appareil reel pour tester le scan QR
- gardez une bonne lumiere et placez le QR entier dans le cadre
- utilisez la saisie manuelle si le scan n'est pas possible

## Verification

```bash
npx expo export --platform web
```
