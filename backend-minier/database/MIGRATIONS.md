# Migrations Base De Donnees

Ce dossier regroupe la structure de base de données et les scripts de migration liés au backend MineralChain.

## Fichiers

- `models.py` : modèles SQLAlchemy utilisés par l’application.
- `schema.sql` : schéma PostgreSQL versionné.
- `SCHEMA.md` : description lisible de la structure des tables.

## Scripts De Migration

- `backend-minier/migrate.py` : migration simple pour créer les tables et ajouter les colonnes de validation régulateur.
- `backend-minier/migrate_regulator.py` : script léger pour ajouter les colonnes de validation si elles manquent.

## Quand Les Utiliser

- Utilisez `schema.sql` pour reconstruire la base à partir de zéro.
- Utilisez `migrate.py` après l’ajout de nouvelles colonnes ou d’un nouveau schéma local.
- Utilisez `migrate_regulator.py` pour une correction rapide sur une base déjà existante.

## Remarque

Le backend crée aussi les tables au démarrage via `db.create_all()`, mais les fichiers ci-dessus permettent de documenter et reproduire la structure dans GitHub.
