# Structure des dossiers de donnees et des sorties

Ce document decrit l'organisation du dossier `modele_ia_minier` et le contenu attendu dans chaque sous-dossier. Il sert de guide pratique pour ranger correctement les donnees, les modeles, les visualisations et les rapports du projet.

## Arborescence recommandee

```text
modele_ia_minier/
|-- data/
|   |-- raw/
|   |   `-- dataset_minier_complet_50000.csv
|   |-- processed/
|   |-- train/
|   |-- val/
|   `-- test/
|-- modeles/
|-- visualisations/
|-- rapports/
|-- ia_de_id_et_aut.ipynb
|-- DATA_TRAINING_FR.md
`-- DATA_STRUCTURE.md
```

## `data/raw/`

Contenu :
- donnees originales, non modifiees
- copie de reference du dataset source

Fichiers attendus :
- `dataset_minier_complet_50000.csv`

Utilisation :
- archivage du jeu de donnees initial
- point de depart pour le pretraitement
- conservation de la version brute avant nettoyage ou transformation

Remarque :
- aucun nettoyage manuel ne doit etre fait directement dans ce dossier

## `data/processed/`

Contenu :
- donnees nettoyees
- donnees transformees ou normalisees
- versions prêtes pour l'apprentissage

Fichiers attendus :
- fichiers CSV issus du pretraitement
- eventuellement des donnees encodees ou enrichies

Fichier present :
- `dataset_minier_processed.csv`

Utilisation :
- fournir une base propre pour la preparation des ensembles de train, validation et test
- stocker les donnees apres suppression des incoherences ou standardisation

Exemples de fichiers possibles :
- `dataset_minier_clean.csv`
- `dataset_minier_processed.csv`

## `data/train/`

Contenu :
- sous-ensemble d'entrainement
- environ 70 % a 80 % des donnees

Utilisation :
- entrainer les modeles de machine learning
- apprendre les relations entre les caracteristiques minieres et les classes cibles

Exemples de fichiers possibles :
- `train.csv`
- `X_train.csv`
- `y_train.csv`

Fichier present :
- `train.csv`

## `data/val/`

Contenu :
- sous-ensemble de validation
- environ 10 % a 15 % des donnees

Utilisation :
- ajuster les hyperparametres
- comparer plusieurs versions d'un modele
- surveiller le surapprentissage pendant la phase de mise au point

Exemples de fichiers possibles :
- `val.csv`
- `X_val.csv`
- `y_val.csv`

Fichier present :
- `val.csv`

## `data/test/`

Contenu :
- sous-ensemble de test final
- environ 10 % a 15 % des donnees

Utilisation :
- evaluer objectivement la performance finale
- mesurer la capacite de generalisation sur des donnees non vues

Exemples de fichiers possibles :
- `test.csv`
- `X_test.csv`
- `y_test.csv`

Fichier present :
- `test.csv`

## `modeles/`

Contenu :
- modeles entraines au format `.pkl`
- objets de pretraitement necessaires a l'inference

Fichiers presents dans votre projet :
- `model_mineral_type.pkl`
- `model_impurity_level.pkl`
- `model_fraud_detection.pkl`
- `scaler.pkl`
- `label_encoder_mineral.pkl`
- `label_encoder_impurity.pkl`
- `feature_columns.pkl`
- `analyze_function.pkl`

Utilisation :
- charger les modeles dans le backend
- reutiliser les transformations appliquees pendant l'entrainement
- produire des predictions cohérentes sur de nouveaux lots

## `visualisations/`

Contenu :
- graphiques
- figures d'analyse
- matrices de confusion
- visualisations des resultats et de l'importance des variables

Fichiers presents dans votre projet :
- `1_distribution_generale.png`
- `2_confusion_identification.png`
- `3_feature_importance_identification.png`
- `4_confusion_impurity.png`
- `5_confusion_fraude.png`
- `5_confusion_fraude_seuil30.png`

Utilisation :
- illustrer les resultats du modele
- alimenter le memoire, la soutenance ou les rapports techniques
- faciliter l'interpretation des performances

## `rapports/`

Contenu :
- metriques d'evaluation
- fichiers de synthese
- rapports techniques ou exports JSON/CSV

Fichiers presents dans votre projet :
- `metrics.json`
- `blockchain_mapping.json`

Utilisation :
- conserver les performances finales des modeles
- documenter les sorties utiles a l'integration applicative
- centraliser les resultats exploitables par d'autres modules

Exemples de fichiers possibles en plus :
- `validation_metrics.json`
- `test_metrics.json`
- `classification_report.csv`

## Fichiers de documentation

### `DATA_TRAINING_FR.md`

Contenu :
- explication en francais du processus d'entrainement
- description du dataset, des modeles et des metriques

Utilisation :
- support de redaction pour le memoire
- documentation fonctionnelle du pipeline IA

### `DATA_STRUCTURE.md`

Contenu :
- description de l'arborescence des donnees et des sorties
- role de chaque dossier

Utilisation :
- standardiser l'organisation du projet
- faciliter la maintenance et la comprehension de la structure

## Regle simple d'organisation

Pour garder un projet propre :

- les donnees brutes vont dans `data/raw/`
- les donnees preparees vont dans `data/processed/`
- les splits vont dans `data/train/`, `data/val/` et `data/test/`
- les modeles sauvegardes vont dans `modeles/`
- les images d'analyse vont dans `visualisations/`
- les mesures de performance et rapports vont dans `rapports/`

Cette organisation permet de separer clairement les donnees sources, les donnees transformees, les sorties d'entrainement et les elements de documentation.
