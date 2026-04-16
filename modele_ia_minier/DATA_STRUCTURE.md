# Structure des Donnees - Guide d'Utilisation

## Organisation des Dossiers

```
modele_ia_minier/
├── Data/
│   ├── raw/                    Donnees brutes (originales)
│   │   └── dataset_minier_complet_50000.csv
│   ├── processed/              Donnees nettoyees et pretraitees
│   ├── train/                  Donnees d'entrainement (70-80%)
│   ├── val/                    Donnees de validation (10-15%)
│   └── test/                   Donnees de test (10-15%)
├── modeles/                    Modeles entraines (.pkl)
├── visualisations/             Graphiques et visualisations
├── rapports/                   Rapports et metriques
├── ia_de_id_et_aut.ipynb      Notebook principal
└── load_data.py               Script utilitaire pour charger les donnees
```

## Utilisation

### 1. Charger le Dataset

```python
from load_data import load_dataset, setup_directories

# Creer la structure de repertoires
dirs = setup_directories()

# Charger le dataset
df = load_dataset()
```

### 2. Chemins des Fichiers

```python
import os

# Acceder aux repertoires
data_raw = dirs['data_raw']
models_dir = dirs['models']
viz_dir = dirs['visualizations']

# Exemple: sauvegarder un modele
model_path = os.path.join(models_dir, 'mon_modele.pkl')
```

### 3. Workflow Recommande

#### Etape 1: Donnees Brutes -> Donnees Traitees
```
Data/raw/ -> [Nettoyage] -> Data/processed/
```

#### Etape 2: Donnees Traitees -> Donnees Divisees
```
Data/processed/ -> [Split 70/10/10] -> Data/train/, Data/val/, Data/test/
```

#### Etape 3: Entrainement et Evaluation
```
Data/train/ -> [Modele] -> modeles/
Data/test/ -> [Evaluation] -> rapports/
```

## Contenu de Chaque Dossier

### Data/raw/
- Contenu: Donnees originales, non modifiees
- Fichiers: dataset_minier_complet_50000.csv
- Utilisation: Reference, archivage

### Data/processed/
- Contenu: Donnees nettoyees, normalisees
- Fichiers: CSV avec donnees pretraitees
- Utilisation: Entree pour la division train/val/test

### Data/train/
- Contenu: 70-80% des donnees pour l'entrainement
- Utilisation: Entrainer les modeles

### Data/val/
- Contenu: 10-15% des donnees pour la validation
- Utilisation: Ajuster les hyperparametres

### Data/test/
- Contenu: 10-15% des donnees pour le test final
- Utilisation: Evaluer la performance finale

### modeles/
- Contenu: Modeles entraines (.pkl)
- Fichiers:
  - model_mineral_type.pkl
  - model_impurity_level.pkl
  - model_fraud_detection.pkl
  - scaler.pkl
  - label_encoder_*.pkl

### visualisations/
- Contenu: Graphiques et visualisations
- Fichiers: PNG, JPG des analyses

### rapports/
- Contenu: Metriques et rapports
- Fichiers: JSON, CSV avec resultats

## Sauvegarde des Modeles

```python
import joblib
import os

models_dir = dirs['models']

# Sauvegarder un modele
joblib.dump(model, os.path.join(models_dir, 'model_name.pkl'))

# Charger un modele
model = joblib.load(os.path.join(models_dir, 'model_name.pkl'))
```

## Bonnes Pratiques

1. Ne jamais modifier les fichiers dans Data/raw/
2. Toujours creer des copies dans Data/processed/
3. Documenter les transformations appliquees
4. Versionner les modeles avec des noms explicites
5. Sauvegarder les metriques pour chaque experience

## Exemple Complet

```python
from load_data import load_dataset, setup_directories
import pandas as pd
import joblib
import os

# 1. Configuration
dirs = setup_directories()

# 2. Charger les donnees brutes
df = load_dataset()

# 3. Pretraitement
df_processed = df.copy()
# ... nettoyage, normalisation, etc.

# 4. Sauvegarder les donnees traitees
processed_path = os.path.join(dirs['data_processed'], 'data_processed.csv')
df_processed.to_csv(processed_path, index=False)

# 5. Division train/val/test
from sklearn.model_selection import train_test_split

X_train, X_temp = train_test_split(df_processed, test_size=0.2)
X_val, X_test = train_test_split(X_temp, test_size=0.5)

# 6. Sauvegarder les donnees divisees
X_train.to_csv(os.path.join(dirs['data_train'], 'train.csv'), index=False)
X_val.to_csv(os.path.join(dirs['data_val'], 'val.csv'), index=False)
X_test.to_csv(os.path.join(dirs['data_test'], 'test.csv'), index=False)

# 7. Entrainer et sauvegarder le modele
model = train_model(X_train)
joblib.dump(model, os.path.join(dirs['models'], 'model_v1.pkl'))

print("Workflow complet termine!")
```

## Questions Frequentes

Q: Ou mettre mes donnees brutes?
R: Dans Data/raw/

Q: Comment charger le dataset?
R: Utilisez load_dataset() du script load_data.py

Q: Ou sauvegarder mes modeles?
R: Dans modeles/ avec un nom explicite (ex: model_v1.pkl)

Q: Comment organiser les resultats?
R: Mettez les metriques dans rapports/ et les graphiques dans visualisations/
