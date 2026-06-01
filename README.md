# MineralChain

MineralChain est une plateforme de tracabilite et de certification de lots miniers. Elle combine une interface web React, une application mobile Expo, un backend Flask avec analyse IA, un stockage IPFS et un smart contract ERC-721 deploye localement avec Ganache/Truffle.

Le flux principal couvre l'extraction du lot, l'analyse IA, la validation independante DGMR, la certification NFT, le scan QR du certificat, le transport et la livraison usine.

## Structure

- `mineralchain/` : frontend web React.
- `backend-minier/` : API Flask, analyse IA, certification, IPFS, connexion blockchain.
- `nft-minier/` : smart contract `MineralNFT`, migrations et tests Truffle.
- `modele_ia_minier/` : notebooks, modeles IA et visualisations.
- `mineralchain-mobile/` : application mobile Expo/React Native.

## Fonctionnalites

- creation et analyse IA des lots miniers
- validation DGMR par double analyse labo
- generation de certificat et mint NFT ERC-721
- stockage IPFS des certificats
- scan QR avec camera pour les transporteurs et regulateurs
- fallback de scan QR via `jsQR` sur les navigateurs sans `BarcodeDetector`
- application mobile Expo avec scanner QR transporteur via `expo-camera`
- suivi transport : pret a expedier, en transit, livre
- verification publique d'un certificat par QR code

## Prerequis

- Node.js et npm
- Python 3.10+
- Ganache lance sur `127.0.0.1:7545`
- PostgreSQL si l'on veut activer la base de donnees backend
- navigateur avec acces camera pour le scan QR web. En local, `localhost` fonctionne ; sur telephone ou reseau, utilisez HTTPS ou l'app mobile Expo.

## Installation rapide

Frontend :

```bash
cd mineralchain
npm install
npm start
```

Application mobile :

```bash
cd mineralchain-mobile
npm install
npm start
```

Backend :

```bash
cd backend-minier
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Smart contract :

```bash
cd nft-minier
npm install
npx truffle compile
npx truffle migrate --reset --network development
npx truffle test --network development
```

## Configuration

Les fichiers `.env` ne doivent pas etre commits. Utiliser les fichiers `.env.example` comme base :

- `backend-minier/.env.example`
- `mineralchain/.env.example`

Variables importantes cote backend :

- `DATABASE_URL`
- `PINATA_JWT`
- `OWNER_PRIVATE_KEY`
- `PORT`

## Scan QR camera

Le scan QR est disponible dans deux workflows web :

- Transporteur : `Scanner QR Code` pour verifier le certificat et ouvrir le lot.
- Regulateur : `Scanner QR du lot` pour selectionner le lot avant l'import du fichier labo DGMR.

Le frontend web utilise d'abord l'API native `BarcodeDetector` si le navigateur la fournit. Si elle n'est pas disponible, il decode les images camera avec `jsQR`, ce qui permet de garder le scan fonctionnel sur Edge/Chrome selon les versions.

Cote mobile, le role transporteur dispose d'un ecran `Scanner QR` base sur `expo-camera`. Le QR du certificat ouvre directement la fiche du lot synchronisee.

## Verification rapide

```bash
cd mineralchain
npm run build
```

```bash
cd mineralchain-mobile
npx expo export --platform web
```

```bash
cd nft-minier
npx truffle test --network development
```

## Notes GitHub

Les dossiers de dependances (`node_modules`, environnements Python, caches, logs et builds generes) sont ignores par Git. Les dependances doivent etre reinstallees avec `npm install` ou `pip install -r requirements.txt`.
