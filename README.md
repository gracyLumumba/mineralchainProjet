# MineralChain

MineralChain is a mineral lot traceability and certification platform built as a multi-app project.

It combines:

- a React web frontend;
- an Expo / React Native mobile app;
- a Flask backend with AI analysis;
- IPFS / Pinata storage;
- a local ERC-721 smart contract deployed with Ganache / Truffle.

The main flow covers lot creation, AI analysis, DGMR validation, NFT certification, QR verification, transport tracking, and delivery to the plant.

## Project Structure

- `mineralchain/` - web frontend.
- `mineralchain-mobile/` - mobile frontend.
- `backend-minier/` - API, AI logic, certification, IPFS, and blockchain integration.
- `nft-minier/` - `MineralNFT` contract, migrations, and Truffle tests.
- `modele_ia_minier/` - notebooks, trained models, reports, and visualizations.

## Core Features

- lot creation and AI-based classification
- DGMR validation with lab comparison
- NFT minting for certified lots
- IPFS certificate storage
- QR scanning on web and mobile
- `jsQR` fallback when `BarcodeDetector` is not available
- transport status tracking: ready, in transit, delivered
- public certificate verification by QR code or token reference

## Requirements

- Node.js and npm
- Python 3.10+
- Ganache running on `127.0.0.1:7545`
- PostgreSQL if you want production-style SQL persistence
- a browser with camera access for the web QR flow

For local development, `localhost` is enough. For a phone or network device, use HTTPS or the Expo mobile app.

## Quick Start

Web frontend:

```bash
cd mineralchain
npm install
npm start
```

Mobile app:

```bash
cd mineralchain-mobile
npm install
npm start
```

Backend:

```bash
cd backend-minier
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Smart contract:

```bash
cd nft-minier
npm install
npx truffle compile
npx truffle migrate --reset --network development
npx truffle test --network development
```

## Configuration

Do not commit `.env` files. Use the provided examples instead:

- `backend-minier/.env.example`
- `mineralchain/.env.example`
- `mineralchain-mobile/.env.example`

Important backend variables:

- `DATABASE_URL`
- `GANACHE_URL`
- `CONTRACT_ADDRESS`
- `PINATA_JWT`
- `OWNER_PRIVATE_KEY`
- `PORT`

Web frontend variables:

- `REACT_APP_BACKEND_URL`
- `REACT_APP_CONTRACT_ADDRESS`
- `REACT_APP_OWNER_ADDRESS`

Mobile variables:

- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_CONTRACT_ADDRESS`
- `EXPO_PUBLIC_GANACHE_URL`

## QR Workflows

The web app exposes two QR-based flows:

- `Transporteur > Scanner QR Code` to open and verify a certificate.
- `Regulateur > Scanner QR du lot` to select a lot before importing the DGMR lab file.

The web frontend uses `BarcodeDetector` first when the browser supports it. Otherwise it falls back to `jsQR` so QR scanning stays functional on common browsers.

On mobile, the transport role has a `Scanner QR` screen based on `expo-camera`. The certificate QR opens the synchronized lot detail directly.

## Verification

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

## Git Notes

Generated dependencies, caches, logs, builds, local databases, and notebook checkpoints are ignored by Git. After cloning, reinstall dependencies with `npm install` and `pip install -r requirements.txt` before running any module.

Project history notes:

- [HISTORIQUE_COMMITS.md](/C:/Users/Dr_Denise/Documents/GitHub/mineralchainProjet/HISTORIQUE_COMMITS.md)

Database schema notes:

- [backend-minier/database/SCHEMA.md](/C:/Users/Dr_Denise/Documents/GitHub/mineralchainProjet/backend-minier/database/SCHEMA.md)
- [backend-minier/database/schema.sql](/C:/Users/Dr_Denise/Documents/GitHub/mineralchainProjet/backend-minier/database/schema.sql)
- [backend-minier/database/MIGRATIONS.md](/C:/Users/Dr_Denise/Documents/GitHub/mineralchainProjet/backend-minier/database/MIGRATIONS.md)
- [backend-minier/database/SEEDS.md](/C:/Users/Dr_Denise/Documents/GitHub/mineralchainProjet/backend-minier/database/SEEDS.md)
