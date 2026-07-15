# MineralNFT Smart Contract

Contrat ERC-721 utilise par MineralChain pour certifier les lots miniers sur un reseau Ganache local.

## Deploiement de demonstration

- Reseau : `Ganache` sur `localhost:7545`
- Adresse du contrat : `0x831A68CD2070d988f5baB3003cE7fa65A9B1ca78`
- Standard : `ERC-721` + `ERC721URIStorage`
- Symbole : `MINRL`

Le proprietaire est le compte Ganache qui a deploye le contrat.

## Fonction principale

```solidity
function mintMineralToken(
    address to,
    string lotId,
    string site,
    string mineralType,
    string impurityLevel,
    uint256 confidence,
    string iaSignature,
    bool isAuthentic,
    string certificateHash,
    string ipfsHash,
    uint256 cuGrade,
    uint256 coGrade,
    uint256 feGrade,
    uint256 weight
) external onlyOwner returns (uint256 tokenId)
```

## Demarrage rapide

```bash
cd nft-minier
npm install
npx truffle compile
npx truffle migrate --reset --network development
npx truffle test --network development
```

## Verification Python

```bash
pip install web3==6.15.1
python test_transaction.py
```

## Integration backend

Le backend Flask lit l adresse du contrat depuis :

- `CONTRACT_ADDRESS`
- l artifact Truffle genere localement dans `build/contracts/MineralNFT.json`

Variables d environnement utiles :

```env
GANACHE_URL=http://localhost:7545
CONTRACT_ADDRESS=0x831A68CD2070d988f5baB3003cE7fa65A9B1ca78
OWNER_PRIVATE_KEY=0x...
```

## Fichiers

```text
nft-minier/
|-- contracts/
|   |-- MineralNFT.sol
|   `-- Migrations.sol
|-- migrations/
|   |-- 1_initial_migrations.js
|   `-- 2_deploy_contracts.js
|-- test/
|   `-- test_mineral.js
|-- test_transaction.py
|-- truffle-config.js
|-- package.json
`-- README.md
```

## Notes

- Si vous redeployez le contrat, mettez a jour les adresses par defaut du frontend et du backend, ou renseignez les variables d environnement.
- Le dossier `build/` est genere localement par Truffle et n a pas vocation a etre versionne.
