# MineralChain

MineralChain is a mineral traceability, certification, and explainable-AI platform designed to support the operational control of mineral lots across the extraction, validation, and certification pipeline.

The system combines:

- a React web application;
- an Expo / React Native mobile application;
- a Flask backend for business processing and AI inference;
- SOAP-based exchanges for sensitive authenticated operations;
- IPFS / Pinata storage for certificate persistence;
- a local ERC-721 smart contract deployed through Ganache and Truffle.

The platform covers lot registration, AI-assisted classification, DGMR validation, NFT certification, QR-based verification, transport supervision, and delivery tracking.

## Operational Overview

1. A producer registers a mineral lot and transmits the associated operational data to the backend.
2. The AI engine evaluates the quantitative assay inputs and produces a mineral classification.
3. SHAP generates an interpretation of the model decision by identifying the most influential variables.
4. A mineral fingerprint is assembled, including chemical, geological, and textural context.
5. The lot may then be validated, certified, stored on IPFS, and minted as an NFT.
6. Transport and delivery status remain accessible through the web and mobile interfaces.

## AI Interpretation Model

The AI component is intentionally constrained to structured numerical inputs in order to preserve stability, reproducibility, and auditability.

- Chemical assay values such as `Cu`, `Co`, `Fe`, `Ni`, `S`, and `silica` are used as direct predictive inputs.
- Geological origin and texture are retained in the mineral fingerprint to strengthen traceability and certification.
- SHAP is used to explain why a lot was classified as authentic, suspect, or requiring manual review.
- Descriptive fingerprint fields are not yet the main predictive variables of the classifier and therefore remain contextual rather than primary features.

This design improves transparency for producers, regulators, and transport operators while keeping the model explainable.

## Project Structure

- `mineralchain/` - web frontend.
- `mineralchain-mobile/` - mobile frontend.
- `backend-minier/` - API, AI logic, certification, IPFS, and blockchain integration.
- `nft-minier/` - `MineralNFT` contract, migrations, and Truffle tests.
- `modele_ia_minier/` - notebooks, trained models, reports, and visualizations.

## Core Features

- Mineral lot registration and AI-assisted classification
- SHAP-based model explainability
- Mineral fingerprint enriched with chemical, geological, and textural context
- DGMR validation with laboratory comparison
- NFT minting for certified lots
- Certificate persistence on IPFS
- QR scanning on web and mobile
- `jsQR` fallback when `BarcodeDetector` is not available
- Transport status tracking: ready, in transit, delivered
- Public certificate verification by QR code or token reference
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

The current modeling choice is deliberate: it separates predictive inference from descriptive fingerprinting. The first supports classification, while the second supports chain-of-custody traceability and certificate documentation.

## SOAP Transport

The backend and clients use SOAP envelopes for the main secure business requests. This applies especially to:

- authentication;
- lot analysis and certification;
- regulator validation;
- blockchain updates;
- IPFS operations;
- admin approval / rejection actions.

This keeps the request format consistent across web and mobile clients for sensitive operations and provides a clearer contract for authenticated business exchanges.

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
