# MineralChain Backend

## Présentation

Ce dossier contient le backend Flask du projet MineralChain. Il expose les endpoints API nécessaires pour analyser les lots miniers, produire un certificat numérique, enregistrer les données sur IPFS et interagir avec le smart contract NFT en local.

Le backend est conçu pour fonctionner avec les autres modules du projet :

- `mineralchain` pour l'interface React
- `nft-minier` pour le smart contract
- `modele_ia_minier` pour les modeles de machine learning

## Fonctionnalites

- analyse IA des caracteristiques d'un lot
- detection de fraude ou d'anomalies
- creation d'un certificat de lot
- upload du certificat sur IPFS via Pinata
- connexion reelle a Ganache pour le mint NFT
- mint d'un NFT pour les lots authentiques
- gestion des lots via API REST, avec PostgreSQL en production et SQLite possible en local

## Structure

```text
backend-minier/
|-- app.py
|-- requirements.txt
|-- .env.example
|-- start_backend.bat
|-- run_backend_utf8.py
|-- seed_demo_lots.py
|-- seed_experiment_history.py
|-- migrate.py
|-- migrate_regulator.py
|-- models/
|   `-- load_models.py
|-- database/
|   |-- models.py
|   |-- schema.sql
|   |-- MIGRATIONS.md
|   |-- SCHEMA.md
|   `-- SEEDS.md
|-- routes/
|   |-- analyze.py
|   |-- lots.py
|   |-- certify.py
|   |-- ipfs.py
|   `-- database.py
`-- utils/
```

## Prérequis

- Python 3.10 ou plus recent
- environnement virtuel Python
- Ganache en local sur `http://127.0.0.1:7545`
- smart contract compile dans `nft-minier/build/contracts/MineralNFT.json`
- modeles presents dans `modele_ia_minier/modeles`
- compte Pinata si vous souhaitez un vrai stockage IPFS

## Installation

Depuis ce dossier :

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Important :

- utilisez l'environnement `.venv` du projet pour lancer le backend ;
- les modeles IA sauvegardes ont ete entraines avec `scikit-learn 1.6.1` ;
- evitez de lancer le backend avec un autre environnement Python si vous voulez supprimer les warnings de compatibilite lors du chargement des `.pkl`.

## Configuration

Copiez `.env.example` en `.env` puis renseignez vos variables :

```env
DATABASE_URL=postgresql://postgres:motdepasse@localhost:5432/mineralchain
PINATA_JWT=your_real_jwt_here
```

Variables utiles selon votre configuration :

- `DATABASE_URL`
- `GANACHE_URL`
- `CONTRACT_ADDRESS`
- `PINATA_JWT`
- `PINATA_API_KEY`
- `PINATA_API_SECRET`
- `PINATA_GATEWAY`
- `OWNER_PRIVATE_KEY`
- `PORT`

Si vous ne renseignez pas `DATABASE_URL`, le backend utilise SQLite via `mineralchain_dev.db` pour éviter de bloquer le démarrage en local. Pour un déploiement propre, fournissez une URL PostgreSQL.

Si vous redeployez le contrat, mettez à jour `CONTRACT_ADDRESS` ou laissez le backend lire la nouvelle adresse depuis `build/contracts/MineralNFT.json`.

## Lancement

```bash
python app.py
```

Ou sous Windows :

```bash
start_backend.bat
```

Le serveur démarre par défaut sur :

```text
http://localhost:5000
```

## Endpoints principaux

### Sante et information

- `GET /`
- `GET /api/health`

### Analyse et certification

- `POST /api/analyze`
- `POST /api/analyze-and-certify`

### Gestion des lots

- `GET /api/lots`
- `POST /api/lots`
- `GET /api/lots/<lot_id>`
- `POST /api/lots/<lot_id>/certify`

### Blockchain

- `GET /api/status`
- `GET /api/contract-info`
- `GET /api/token/<token_id>`
- `POST /api/token/<token_id>/sync-certificate`
- `GET /api/verify?lot=<lot_id>&token=<token_id>`

### IPFS

- `GET /api/ipfs-status`
- `GET /api/ipfs/status`
- `POST /api/ipfs/upload`
- `GET /api/ipfs/get/<ipfs_hash>`
- `POST /api/ipfs/pin/<ipfs_hash>`

## Exemple de donnees

```json
{
  "lot_id": "LOT-001",
  "site": "KAMOA",
  "extraction_date": "2026-03-25",
  "cu_grade_percent": 5.4,
  "co_grade_percent": 0.8,
  "fe_percent": 12.1,
  "s_percent": 1.9,
  "ni_percent": 0.2,
  "silica_percent": 7.4,
  "density_t_m3": 3.1,
  "moisture_percent": 8.2,
  "hardness_mohs": 4.6,
  "weight_tonnes": 25
}
```

## Dependances principales

- `flask`
- `flask-cors`
- `flask-sqlalchemy`
- `pandas`
- `numpy`
- `scikit-learn`
- `joblib`
- `python-dotenv`
- `web3`

## Remarques techniques

- `app.py` accepte PostgreSQL mais bascule sur SQLite si `DATABASE_URL` est absente.
- au démarrage, les anciens lots présents dans `lots_data.json` sont importés dans la base si nécessaire.
- `routes/certify.py` utilise aussi un chemin absolu pour charger l'ABI du smart contract.
- les routes de certification et IPFS échouent explicitement si Ganache, le contrat ou Pinata ne sont pas disponibles.
- la structure PostgreSQL documentée se trouve dans `backend-minier/database/schema.sql`.
- les seeds de démonstration sont documentés dans `backend-minier/database/SEEDS.md`.
- les migrations disponibles sont documentées dans `backend-minier/database/MIGRATIONS.md`.

## Fichiers de test

Des exemples de requetes sont disponibles dans :

- `test.json`
- `test2.json`
- `test_certify.json`

Exemple de test :

```bash
curl -X POST http://localhost:5000/api/analyze ^
  -H "Content-Type: application/json" ^
  -d @test.json
```
