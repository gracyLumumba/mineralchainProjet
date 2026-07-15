# MineralChain Web

Interface React de MineralChain pour les producteurs, régulateurs DGMR, transporteurs et administrateurs.

## Roles couverts

- Producteur : création du lot, analyse IA, certification NFT, consultation du certificat et de l'historique.
- Régulateur DGMR : scan QR ou recherche du lot, import du fichier labo DGMR, comparaison des résultats, validation ou blocage.
- Transporteur : scan QR du certificat, prise en charge du lot, suivi en transit et confirmation de livraison usine.
- Administrateur : supervision des comptes, lots et statuts.

## Démarrage

Depuis `mineralchainProjet/mineralchain` :

```bash
npm install
npm start
```

L'application web démarre généralement sur :

```text
http://localhost:3000
```

## Backend attendu

Le frontend consomme l'API Flask sur `http://localhost:5000` par defaut. La valeur peut etre surchargee avec :

```env
REACT_APP_BACKEND_URL=http://localhost:5000
```

Le contrat NFT et l'adresse de deploiement par defaut sont aussi configurables :

```env
REACT_APP_CONTRACT_ADDRESS=0x831A68CD2070d988f5baB3003cE7fa65A9B1ca78
REACT_APP_OWNER_ADDRESS=0x55AfEC6F4bE846e0ae800556B20aDda3d746bfB6
```

## Scan QR caméra

Le scan QR est actif dans deux interfaces :

- `Transporteur > Scanner QR Code` : lit le QR du certificat puis ouvre/vérifie le lot.
- `Régulateur > Analyse DGMR` : lit le QR du certificat ou du lot avant l'import du fichier labo.

Le scanner utilise :

- `navigator.mediaDevices.getUserMedia` pour afficher la caméra.
- `BarcodeDetector` si le navigateur le supporte.
- `jsQR` en fallback, notamment utile avec Edge lorsque `BarcodeDetector` n'est pas exposé.

En local, l'accès caméra fonctionne sur `localhost`. Sur un téléphone ou une adresse réseau, utilisez HTTPS ou l'application Expo mobile.

## Certification et QR code

Le certificat affiche un QR code qui pointe vers :

- le lien IPFS si le certificat est epingle ;
- sinon la page publique `/verify?lot=<lot_id>&token=<token_id>`.

Ce QR peut être scanné par le transporteur, le régulateur ou un auditeur externe pour retrouver le lot certifié.

## Scripts utiles

```bash
npm start
npm run build
```

## Dependances notables

- `react`, `react-router-dom` pour l'interface.
- `react-qr-code` pour generer les QR des certificats.
- `jsqr` pour decoder les QR depuis la camera quand l'API native n'est pas disponible.
- `html2canvas` et `jspdf` pour l'export des certificats.
- `recharts` pour les graphiques.

## Verification avant livraison

```bash
npm run build
```

Le build peut afficher des warnings ESLint historiques du projet. Les erreurs bloquantes doivent être corrigées avant démonstration.
