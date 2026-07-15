# Seeds Base De Donnees

Ce dossier documente les jeux de données d’exemple et les scripts de seed utilisés pour MineralChain.

## Scripts Existants

- `backend-minier/seed_demo_lots.py` : crée trois lots de démonstration pour illustrer les parcours producteur, régulateur et transporteur.
- `backend-minier/seed_experiment_history.py` : injecte l’historique d’expérimentation utilisé pour les rapports et analyses.

## Démarrage Recommandé

```bash
cd backend-minier
python seed_demo_lots.py
python seed_experiment_history.py
```

## Contenu Fonctionnel

- lots de démonstration avec statuts variés
- historiques liés aux tests de validation
- base d’appui pour les captures d’écran, la soutenance et les démos

## Remarque

Les seeds ne remplacent pas les données réelles. Elles servent à rendre le dépôt immédiatement exploitable après installation locale.
