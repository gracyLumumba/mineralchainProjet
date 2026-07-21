# MineralChain

MineralChain is a mineral lot traceability and certification platform built as a multi-app project.

It combines:

- a React web frontend;
- an Expo / React Native mobile app;
- a Flask backend with AI analysis;
- SOAP-based API exchanges for the sensitive business flows;
- IPFS / Pinata storage;
- a local ERC-721 smart contract deployed with Ganache / Truffle.

The main flow covers lot creation, AI analysis, DGMR validation, NFT certification, QR verification, transport tracking, and delivery to the plant.

## How The System Works

1. A producer creates a lot and sends the mining data to the backend.
2. The AI model analyses the quantitative chemical inputs and produces a mineral classification.
3. SHAP explains which variables influenced the prediction.
4. The system builds a mineral fingerprint that also includes geological origin and texture.
5. The lot can then be validated, certified, pinned to IPFS, and minted as an NFT.
6. Transport and delivery status are tracked from the web or mobile app.

The system now clarifies that:

- chemical assay values are used by the model as numerical inputs;
- geological origin and texture are stored in the mineral fingerprint for traceability;
- SHAP is used to explain the model decision;
- descriptive fingerprint fields are not yet the main predictive inputs of the classifier.

This makes the AI workflow easier to understand for producers, regulators, and transport actors.

## Project Structure

- `mineralchain/` - web frontend.
- `mineralchain-mobile/` - mobile frontend.
- `backend-minier/` - API, AI logic, certification, IPFS, and blockchain integration.
- `nft-minier/` - `MineralNFT` contract, migrations, and Truffle tests.
- `modele_ia_minier/` - notebooks, trained models, reports, and visualizations.

## Core Features

- lot creation and AI-based classification
- SHAP explanations for the AI decision
- mineral fingerprint enriched with chemical, geological, and textural context
- DGMR validation with lab comparison
- NFT minting for certified lots
- IPFS certificate storage
- QR scanning on web and mobile
- `jsQR` fallback when `BarcodeDetector` is not available
- transport status tracking: ready, in transit, delivered
- public certificate verification by QR code or token reference
- SOAP transport for the main authenticated operations

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

## AI And Explainability

The AI layer focuses on structured numeric features so the prediction remains stable and reproducible.

Chemical assay values such as `Cu`, `Co`, `Fe`, `Ni`, `S`, and `silica` are used directly by the model. Geological origin and texture are captured in the mineral fingerprint because they are important for traceability and certification, but they are not yet the main predictive variables of the classifier.

SHAP is used to expose the strongest contributing variables in each analysis result. This helps users understand why a lot was classified as authentic, suspect, or requires manual verification.

## SOAP Transport

The backend and clients use SOAP envelopes for the main secure business requests. This applies especially to:

- authentication;
- lot analysis and certification;
- regulator validation;
- blockchain updates;
- IPFS operations;
- admin approval / rejection actions.

This keeps the request format consistent across web and mobile clients for sensitive operations.

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

Recent protocol and explainability updates are already committed to the repository history. If you are reading an older clone, pull the latest `main` branch before working.

Project history notes:

- [HISTORIQUE_COMMITS.md](/C:/Users/Dr_Denise/Documents/GitHub/mineralchainProjet/HISTORIQUE_COMMITS.md)

Database schema notes:

- [backend-minier/database/SCHEMA.md](/C:/Users/Dr_Denise/Documents/GitHub/mineralchainProjet/backend-minier/database/SCHEMA.md)
- [backend-minier/database/schema.sql](/C:/Users/Dr_Denise/Documents/GitHub/mineralchainProjet/backend-minier/database/schema.sql)
- [backend-minier/database/MIGRATIONS.md](/C:/Users/Dr_Denise/Documents/GitHub/mineralchainProjet/backend-minier/database/MIGRATIONS.md)
- [backend-minier/database/SEEDS.md](/C:/Users/Dr_Denise/Documents/GitHub/mineralchainProjet/backend-minier/database/SEEDS.md)
