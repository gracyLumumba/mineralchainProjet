# MineralNFT Smart Contract

Contrat ERC-721 utilisé par MineralChain pour certifier les lots miniers sur un réseau Ganache local.

## Déploiement de démonstration

- Réseau : `Ganache` sur `localhost:7545`
- Adresse du contrat : `0x831A68CD2070d988f5baB3003cE7fa65A9B1ca78`
- Standard : `ERC-721` + `ERC721URIStorage`
- Symbole : `MINRL`

Le propriétaire est le compte Ganache qui a déployé le contrat.

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

## Démarrage rapide

```bash
cd nft-minier
npm install
npx truffle compile
npx truffle migrate --reset --network development
npx truffle test --network development
```

## Vérification Python

```bash
pip install web3==6.15.1
python test_transaction.py
```

## Intégration backend

Le backend Flask lit l’adresse du contrat depuis :

- `CONTRACT_ADDRESS`
- l’artifact Truffle déployé dans `build/contracts/MineralNFT.json`

Variables d’environnement utiles :

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

- Si vous redéployez le contrat, mettez à jour les adresses par défaut du frontend et du backend, ou renseignez les variables d’environnement.
- Le fichier `build/contracts/MineralNFT.json` versionné dans le dépôt sert au chargement de l’ABI par le backend.
