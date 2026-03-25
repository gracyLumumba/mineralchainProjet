# nft-minier — MineralNFT Smart Contract v2.0

ERC-721 pour la certification des lots miniers au Katanga (RDC).

## Contrat déployé

| Propriété      | Valeur |
|----------------|--------|
| Adresse        | `0xE7A51a1136968A33fE06bAc07B5794757E349Fbb` |
| Owner (minter) | `0xdb5745DeeDcF8e6e0099460bf94c96b56804EC70` |
| Réseau         | Ganache `localhost:7545` |
| Standard       | ERC-721 + ERC721URIStorage (OpenZeppelin 4.8.0) |
| Nom / Symbole  | `MineralNFT / MINRL` |

## Fonction principale

```solidity
function mintMineralToken(
    address  to,              // Adresse du producteur
    string   lotId,           // "KAMOA-2603-142"
    string   site,            // "KAMOA" | "KANSOKO" | "KCC"
    string   mineralType,     // "copper" | "cobalt" | "mixed"
    string   impurityLevel,   // "low" | "medium" | "high"
    uint256  confidence,      // Score IA × 100 (9650 = 96.50%)
    string   iaSignature,     // "0x7ccffb17ae1da04d"
    bool     isAuthentic,     // true = AUTHENTIQUE
    string   certificateHash, // SHA-256 du certificat JSON
    string   ipfsHash,        // "ipfs://QmXy..."
    uint256  cuGrade,         // Cu %×100  (324 = 3.24%)
    uint256  coGrade,         // Co %×100  (12  = 0.12%)
    uint256  feGrade,         // Fe %×100  (123 = 1.23%)
    uint256  weight           // Poids t×100 (2530 = 25.30 t)
) external onlyOwner returns (uint256 tokenId)
```

## Installation et déploiement

### 1. Prérequis

```bash
# Node.js v16+
node --version

# Python 3.11+ (pour le backend)
python --version

# Ganache Desktop ou CLI
ganache-cli --port 7545
```

### 2. Installation

```bash
cd nft-minier
npm install
```

### 3. Déploiement sur Ganache

```bash
# Démarrer Ganache (port 7545)
# Puis dans ce dossier :

npm run deploy
# Équivalent à : truffle compile && truffle migrate --reset

# Sortie attendue :
# Deploying 'MineralNFT'
# Deployed at: 0xE7A51...
```

### 4. Tests Truffle complets

```bash
npm test
# ou
truffle test --network development
```

Les tests couvrent :
- Déploiement et état initial (totalSupply=0)
- `mintMineralToken()` avec 14 paramètres → vérifie event, données, ownerOf
- `validateByDGMR()` → statut DGMR on-chain
- `updateIPFSHash()` → mise à jour tokenURI
- Lot SUSPECT (isAuthentic=false)
- Contrôles d'accès (`onlyOwner`, double certification interdite)

### 5. Test de transaction Python

```bash
pip install web3==6.15.1
python test_transaction.py
```

Ce script :
- Se connecte à Ganache
- Appelle `mintMineralToken()` avec un vrai lot de test
- Affiche le tokenId, tx hash, block, gas
- Lit les données depuis la blockchain via `getMineralData()`
- La transaction devient visible dans **Ganache UI > TRANSACTIONS**

## Intégration Backend Flask

Le backend appelle le contrat via `routes/blockchain.py` :

```bash
# Variables d'environnement requises
GANACHE_URL=http://localhost:7545
CONTRACT_ADDRESS=0xE7A51a1136968A33fE06bAc07B5794757E349Fbb
OWNER_ADDRESS=0xdb5745DeeDcF8e6e0099460bf94c96b56804EC70
OWNER_PRIVATE_KEY=0x...   # Clé privée du account[0] Ganache
```

API disponible après `python app.py` :

```
POST /api/blockchain/mint           → Mint un NFT
POST /api/blockchain/validate-dgmr  → Valider DGMR on-chain
POST /api/blockchain/update-ipfs    → Mettre à jour IPFS hash
GET  /api/blockchain/status         → État Ganache + contrat
GET  /api/blockchain/token/:id      → Données d'un token
GET  /api/blockchain/lot/:lotId     → Token par lot
GET  /api/blockchain/transactions   → Toutes les transactions
GET  /api/blockchain/verify/:id     → Vérifier un token
```

## Structure des fichiers

```
nft-minier/
├── contracts/
│   ├── MineralNFT.sol          ← Contrat principal (ERC-721 + OpenZeppelin)
│   └── Migrations.sol
├── migrations/
│   ├── 1_initial_migrations.js
│   └── 2_deploy_contracts.js
├── test/
│   └── test_mineral.js         ← Tests Truffle complets (7 suites, 15+ tests)
├── test_transaction.py         ← Test direct Web3 Python
├── truffle-config.js           ← Ganache localhost:7545, Solidity 0.8.20
├── package.json
└── README.md
```

## Fonctions du contrat

| Fonction | Accès | Description |
|----------|-------|-------------|
| `mintMineralToken(...)` | onlyOwner | Certifie un lot → NFT ERC-721 |
| `validateByDGMR(tokenId, status, validator)` | onlyOwner | Enregistre la validation DGMR |
| `updateIPFSHash(tokenId, ipfsHash, certHash)` | onlyOwner | Met à jour le certificat IPFS |
| `getMineralData(tokenId)` | public | Lit toutes les données on-chain |
| `getTokenByLot(lotId)` | public | Retrouve le tokenId par lotId |
| `isLotCertified(lotId)` | public | true si le lot est certifié |
| `isLotDGMRValidated(lotId)` | public | true si validé par DGMR |
| `totalSupply()` | public | Nombre de NFTs mintés |

## Events

| Event | Paramètres |
|-------|-----------|
| `MineralMinted` | tokenId, to, lotId, site, mineralType, isAuthentic, confidence |
| `DGMRValidated` | tokenId, lotId, status, validator, timestamp |
| `CertificateUpdated` | tokenId, lotId, ipfsHash, timestamp |
| `Transfer` | from, to, tokenId (ERC-721 standard) |
