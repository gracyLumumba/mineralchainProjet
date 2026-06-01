# MineralChain Web

Interface React de MineralChain pour les producteurs, regulateurs DGMR, transporteurs et administrateurs.

## Roles couverts

- Producteur : creation du lot, analyse IA, certification NFT, consultation du certificat et de l'historique.
- Regulateur DGMR : scan QR ou recherche du lot, import du fichier labo DGMR, comparaison des resultats, validation ou blocage.
- Transporteur : scan QR du certificat, prise en charge du lot, suivi en transit et confirmation de livraison usine.
- Administrateur : supervision des comptes, lots et statuts.

## Demarrage

Depuis `mineralchainProjet/mineralchain` :

```bash
npm install
npm start
```

L'application web demarre generalement sur :

```text
http://localhost:3000
```

## Backend attendu

Le frontend consomme l'API Flask sur `http://localhost:5000` par defaut. La valeur peut etre surchargee avec :

```env
REACT_APP_BACKEND_URL=http://localhost:5000
```

## Scan QR camera

Le scan QR est actif dans deux interfaces :

- `Transporteur > Scanner QR Code` : lit le QR du certificat puis ouvre/verifie le lot.
- `Regulateur > Analyse DGMR` : lit le QR du certificat ou du lot avant l'import du fichier labo.

Le scanner utilise :

- `navigator.mediaDevices.getUserMedia` pour afficher la camera.
- `BarcodeDetector` si le navigateur le supporte.
- `jsQR` en fallback, notamment utile avec Edge lorsque `BarcodeDetector` n'est pas expose.

En local, l'acces camera fonctionne sur `localhost`. Sur un telephone ou une adresse reseau, utilisez HTTPS ou l'application Expo mobile.

## Certification et QR code

Le certificat affiche un QR code qui pointe vers :

- le lien IPFS si le certificat est epingle ;
- sinon la page publique `/verify?lot=<lot_id>&token=<token_id>`.

Ce QR peut etre scanne par le transporteur, le regulateur ou un auditeur externe pour retrouver le lot certifie.

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

Le build peut afficher des warnings ESLint historiques du projet. Les erreurs bloquantes doivent etre corrigees avant demonstration.
