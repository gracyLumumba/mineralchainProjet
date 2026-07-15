# Base De Donnees MineralChain

Ce dossier documente la structure PostgreSQL utilisée par le backend MineralChain.

## Fichiers

- `models.py` : définition SQLAlchemy des tables.
- `schema.sql` : schéma PostgreSQL lisible et versionné.

## Tables

- `lots` : lot minier principal avec analyses, statut, blockchain et validation régulateur.
- `lot_history` : historique des événements d’un lot.
- `alerts` : alertes frauduleuses ou anormales liées à un lot.

## Utilisation

Pour initialiser la base PostgreSQL avec ce schéma, exécutez :

```bash
psql -d mineralchain -f backend-minier/database/schema.sql
```

Le backend peut aussi créer les tables via `db.create_all()` au démarrage, mais ce fichier permet de documenter la structure dans GitHub.
