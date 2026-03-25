# MineralChain Backend

## Presentation

Ce backend fournit l'API Flask du projet MineralChain pour l'analyse intelligente des lots miniers, la certification des resultats, le stockage des certificats sur IPFS et la synchronisation avec un smart contract NFT deploye en local.

Le systeme est concu pour fonctionner avec :

- le frontend React du projet `mineralchain`
- les modeles de machine learning du dossier `modele_ia_minier`
- le smart contract du dossier `nft-minier`
- une blockchain locale Ganache

## Fonctionnalites

- analyse IA d'un lot minier a partir de ses caracteristiques physico-chimiques
- detection de fraude ou d'anomalies
- generation d'un certificat numerique
- envoi du certificat sur IPFS via Pinata, avec mode de simulation si necessaire
- mint d'un NFT sur Ganache pour les lots consideres authentiques
- gestion simple des lots avec creation, consultation et certification
- endpoints de verification pour le suivi blockchain et IPFS

## Structure du backend

```text
backend-minier/
|-- app.py
|-- requirements.txt
|-- .env.example
|-- start_backend.bat
|-- run_backend_utf8.py
|-- models/
|   `-- load_models.py
|-- routes/
|   |-- analyze.py
|   |-- lots.py
|   |-- certify.py
|   |-- ipfs.py
|   `-- database.py
|-- database/
`-- utils/
```

## Prerequis

- Python 3.10 ou plus recent
- `pip`
- Ganache lance en local sur `http://127.0.0.1:7545`
- smart contract compile dans `nft-minier/build/contracts/MineralNFT.json`
- modeles IA presents dans `modele_ia_minier/modeles`
- compte Pinata si vous voulez utiliser un vrai stockage IPFS

## Installation

Placez-vous dans le dossier du backend :

```bash
cd mineralchainProjet/backend-minier
```

Creez un environnement virtuel puis activez-le :

```bash
python -m venv venv
venv\Scripts\activate
```

Installez les dependances :

```bash
pip install -r requirements.txt
```

## Configuration

Copiez le fichier `.env.example` en `.env` puis renseignez les variables utiles :

```env
PINATA_JWT=your_real_jwt_here
```

Variables optionnelles selon votre environnement :

- `PINATA_JWT` : jeton JWT Pinata pour l'upload IPFS
- `PINATA_API_KEY` : cle API Pinata
- `PINATA_API_SECRET` : secret API Pinata
- `PINATA_GATEWAY` : gateway IPFS a utiliser
- `OWNER_PRIVATE_KEY` : cle privee du compte utilise pour signer les transactions
- `PORT` : port de lancement du serveur, par defaut `5000`

## Demarrage

Lancement classique :

```bash
python app.py
```

Ou avec le script Windows :

```bash
start_backend.bat
```

Le backend sera disponible sur :

```text
http://localhost:5000
```

## Endpoints principaux

### Verification generale

- `GET /`
- `GET /api/health`

### Analyse IA

- `POST /api/analyze`
- `POST /api/analyze-and-certify`

### Gestion des lots

- `GET /api/lots`
- `POST /api/lots`
- `GET /api/lots/<lot_id>`
- `POST /api/lots/<lot_id>/certify`

### Blockchain et certification

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

## Exemple de requete d'analyse

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

- `flask` pour l'API REST
- `flask-cors` pour l'integration avec le frontend React
- `pandas`, `numpy`, `scikit-learn`, `joblib` pour le chargement et l'inference des modeles IA
- `python-dotenv` pour les variables d'environnement
- `web3` pour l'interaction avec Ganache et le smart contract

## Remarques importantes

- Le backend charge actuellement les modeles IA a partir d'un chemin absolu defini dans `app.py`.
- Le contrat NFT est aussi charge depuis un chemin absolu dans `routes/certify.py`.
- Si Ganache ou Pinata sont indisponibles, certaines routes utilisent un mode de simulation pour permettre les demonstrations.
- Les lots sont enregistres dans un fichier JSON local `lots_data.json`.

## Integration avec le projet

Ce backend travaille avec les modules suivants :

- `mineralchain/` : interface utilisateur React
- `backend-minier/` : API Flask
- `nft-minier/` : smart contract et deploiement Truffle
- `modele_ia_minier/` : modeles d'intelligence artificielle

## Tests manuels utiles

Vous pouvez utiliser les fichiers suivants pour vos essais :

- `test.json`
- `test2.json`
- `test_certify.json`

Exemple :

```bash
curl -X POST http://localhost:5000/api/analyze ^
  -H "Content-Type: application/json" ^
  -d @test.json
```

## Auteur

Projet academique MineralChain consacre a la tracabilite et a la certification intelligente des minerais strategiques.
