# MineralChain Mobile

Application mobile Expo pour consulter les lots, suivre leur statut blockchain, scanner les certificats QR et travailler depuis un téléphone sur le terrain.

## Fonctionnalités principales

- connexion par rôle : producteur, régulateur, transporteur, administrateur
- consultation des lots synchronisés avec le backend Flask
- recherche locale dans le registre mobile
- détail de lot avec statut IA, DGMR, blockchain et transport
- scanner QR transporteur avec la caméra du téléphone
- ouverture directe de la fiche du lot après lecture du QR
- fallback par saisie manuelle du Lot ID ou du Token

## Démarrage

Depuis `mineralchainProjet/mineralchain-mobile` :

```bash
npm install
npm start
```

Puis :

- appuyez sur `a` pour un emulateur Android
- scannez le QR code avec Expo Go pour un téléphone réel

## Scanner QR transporteur

Le rôle transporteur dispose d'une entrée `Scanner QR`.

Le scanner utilise `expo-camera` pour lire le QR du certificat NFT. Quand un QR est détecté, l'application recherche le lot correspondant dans les lots synchronisés puis ouvre directement sa fiche.

Le QR peut contenir :

- une URL publique de vérification avec `lot` ou `token`
- un `lot_id`
- un `token_id`

Si la caméra n'est pas autorisée ou si le QR est abîmé, utilisez la saisie manuelle dans le même écran.

## Tester sur un téléphone réel

Le backend Flask doit tourner sur le même réseau Wi-Fi que le téléphone.

1. Lancez le backend dans `mineralchainProjet/backend-minier`
2. Lancez Expo dans `mineralchainProjet/mineralchain-mobile`
3. Si Expo détecte l'IP réseau du PC, l'application mobile utilisera automatiquement `http://<ip-du-pc>:5000/api`
4. Si besoin, forcez l URL de l API :

```bash
$env:EXPO_PUBLIC_API_BASE_URL="http://192.168.1.20:5000/api"
npm start
```

Variables utiles :

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.20:5000/api
EXPO_PUBLIC_CONTRACT_ADDRESS=0x831A68CD2070d988f5baB3003cE7fa65A9B1ca78
EXPO_PUBLIC_GANACHE_URL=http://127.0.0.1:7545
```

## Améliorations déjà ajoutées

- détection automatique de l'hôte Expo pour atteindre le backend depuis un téléphone réel
- champ de configuration de l'URL API directement dans l'écran de connexion mobile
- délai réseau explicite et message d'erreur plus utile
- pull-to-refresh sur le tableau de bord, la liste des lots et le détail d'un lot
- recherche locale des lots par identifiant, site, statut ou stockage
- détail de lot plus lisible sur petit écran
- scanner QR transporteur avec `expo-camera`
- entrée `Scanner QR` dans le menu transporteur et le menu latéral

## Point d'attention

Si le téléphone ne charge pas les données :

- vérifiez que le pare-feu Windows autorise Python ou le port `5000`
- vérifiez que le PC et le téléphone sont sur le même réseau
- testez l'URL `http://<ip-du-pc>:5000/api/health` depuis le navigateur du téléphone

Si la caméra ne s'ouvre pas :

- autorisez l'accès caméra dans Expo Go ou dans les paramètres du téléphone
- utilisez un appareil réel pour tester le scan QR
- gardez une bonne lumière et placez le QR entier dans le cadre
- utilisez la saisie manuelle si le scan n'est pas possible

## Verification

```bash
npx expo export --platform web
```
