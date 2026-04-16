"""
Configuration des chemins et répertoires pour le projet d'IA minière
"""
import os
from pathlib import Path

# Répertoire de base du projet
PROJECT_ROOT = Path(__file__).parent.absolute()

# Structure des répertoires de données
DATA_DIR = PROJECT_ROOT / "Data"
DATA_RAW_DIR = DATA_DIR / "raw"
DATA_PROCESSED_DIR = DATA_DIR / "processed"
DATA_TRAIN_DIR = DATA_DIR / "train"
DATA_VAL_DIR = DATA_DIR / "val"
DATA_TEST_DIR = DATA_DIR / "test"

# Répertoires de modèles et résultats
MODELS_DIR = PROJECT_ROOT / "modeles"
VISUALIZATIONS_DIR = PROJECT_ROOT / "visualisations"
REPORTS_DIR = PROJECT_ROOT / "rapports"

# Fichiers de données
DATASET_RAW = DATA_RAW_DIR / "dataset_minier_complet_50000.csv"
DATASET_PROCESSED = DATA_PROCESSED_DIR / "dataset_processed.csv"

# Fichiers de modèles
MODEL_MINERAL = MODELS_DIR / "model_mineral_type.pkl"
MODEL_IMPURITY = MODELS_DIR / "model_impurity_level.pkl"
MODEL_FRAUD = MODELS_DIR / "model_fraud_detection.pkl"
SCALER = MODELS_DIR / "scaler.pkl"
FEATURE_COLUMNS = MODELS_DIR / "feature_columns.pkl"
LABEL_ENCODER_MINERAL = MODELS_DIR / "label_encoder_mineral.pkl"
LABEL_ENCODER_IMPURITY = MODELS_DIR / "label_encoder_impurity.pkl"

# Fichiers de rapports
METRICS_FILE = REPORTS_DIR / "metrics.json"
BLOCKCHAIN_MAPPING = REPORTS_DIR / "blockchain_mapping.json"


def create_directories():
    """Crée tous les répertoires nécessaires s'ils n'existent pas"""
    directories = [
        DATA_DIR,
        DATA_RAW_DIR,
        DATA_PROCESSED_DIR,
        DATA_TRAIN_DIR,
        DATA_VAL_DIR,
        DATA_TEST_DIR,
        MODELS_DIR,
        VISUALIZATIONS_DIR,
        REPORTS_DIR
    ]
    
    for directory in directories:
        directory.mkdir(parents=True, exist_ok=True)
    
    return True


def get_all_paths():
    """Retourne un dictionnaire avec tous les chemins"""
    return {
        'project_root': PROJECT_ROOT,
        'data': DATA_DIR,
        'data_raw': DATA_RAW_DIR,
        'data_processed': DATA_PROCESSED_DIR,
        'data_train': DATA_TRAIN_DIR,
        'data_val': DATA_VAL_DIR,
        'data_test': DATA_TEST_DIR,
        'models': MODELS_DIR,
        'visualizations': VISUALIZATIONS_DIR,
        'reports': REPORTS_DIR,
        'dataset_raw': DATASET_RAW,
        'dataset_processed': DATASET_PROCESSED,
        'model_mineral': MODEL_MINERAL,
        'model_impurity': MODEL_IMPURITY,
        'model_fraud': MODEL_FRAUD,
        'scaler': SCALER,
        'feature_columns': FEATURE_COLUMNS,
        'label_encoder_mineral': LABEL_ENCODER_MINERAL,
        'label_encoder_impurity': LABEL_ENCODER_IMPURITY,
        'metrics': METRICS_FILE,
        'blockchain_mapping': BLOCKCHAIN_MAPPING
    }


if __name__ == "__main__":
    create_directories()
    paths = get_all_paths()
    print("Configuration des chemins:")
    for key, path in paths.items():
        print(f"  {key}: {path}")
