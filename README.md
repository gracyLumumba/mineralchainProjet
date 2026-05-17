# MineralChain

MineralChain est une plateforme de certification de lots miniers combinant une interface React, un backend Flask avec analyse IA, et un smart contract ERC-721 deploye localement avec Ganache/Truffle.

## Structure

- `mineralchain/` : frontend web React.
- `backend-minier/` : API Flask, analyse IA, certification, IPFS, connexion blockchain.
- `nft-minier/` : smart contract `MineralNFT`, migrations et tests Truffle.
- `modele_ia_minier/` : notebooks, modeles IA et visualisations.
- `mineralchain-mobile/` : application mobile Expo/React Native.

## Prerequis

- Node.js et npm
- Python 3.10+
- Ganache lance sur `127.0.0.1:7545`
- PostgreSQL si l'on veut activer la base de donnees backend

## Installation rapide

Frontend :

```bash
cd mineralchain
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

## Notes GitHub

Les dossiers de dependances (`node_modules`, environnements Python, caches, logs et builds generes) sont ignores par Git. Les dependances doivent etre reinstallees avec `npm install` ou `pip install -r requirements.txt`.
