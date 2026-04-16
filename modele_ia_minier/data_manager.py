"""
Module de gestion des données pour le projet d'IA minière
"""
import pandas as pd
import numpy as np
from pathlib import Path
from config import (
    DATASET_RAW, DATASET_PROCESSED, 
    DATA_TRAIN_DIR, DATA_VAL_DIR, DATA_TEST_DIR,
    create_directories
)


class DataManager:
    """Gestionnaire centralisé pour les opérations sur les données"""
    
    def __init__(self):
        """Initialise le gestionnaire de données"""
        create_directories()
    
    def load_raw_dataset(self):
        """
        Charge le dataset brut depuis Data/raw/
        
        Returns:
            pd.DataFrame: Le dataset chargé
        """
        if not DATASET_RAW.exists():
            raise FileNotFoundError(f"Dataset non trouvé: {DATASET_RAW}")
        
        df = pd.read_csv(DATASET_RAW)
        print(f"Dataset charge: {df.shape[0]} lignes, {df.shape[1]} colonnes")
        return df
    
    def load_processed_dataset(self):
        """
        Charge le dataset traité depuis Data/processed/
        
        Returns:
            pd.DataFrame: Le dataset traité
        """
        if not DATASET_PROCESSED.exists():
            raise FileNotFoundError(f"Dataset traite non trouve: {DATASET_PROCESSED}")
        
        df = pd.read_csv(DATASET_PROCESSED)
        print(f"Dataset traite charge: {df.shape[0]} lignes, {df.shape[1]} colonnes")
        return df
    
    def save_processed_dataset(self, df):
        """
        Sauvegarde le dataset traité dans Data/processed/
        
        Args:
            df (pd.DataFrame): Le dataset à sauvegarder
        """
        DATASET_PROCESSED.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(DATASET_PROCESSED, index=False)
        print(f"Dataset traite sauvegarde: {DATASET_PROCESSED}")
    
    def save_train_val_test(self, X_train, X_val, X_test):
        """
        Sauvegarde les ensembles train, validation et test
        
        Args:
            X_train (pd.DataFrame): Ensemble d'entraînement
            X_val (pd.DataFrame): Ensemble de validation
            X_test (pd.DataFrame): Ensemble de test
        """
        DATA_TRAIN_DIR.mkdir(parents=True, exist_ok=True)
        DATA_VAL_DIR.mkdir(parents=True, exist_ok=True)
        DATA_TEST_DIR.mkdir(parents=True, exist_ok=True)
        
        X_train.to_csv(DATA_TRAIN_DIR / "train.csv", index=False)
        X_val.to_csv(DATA_VAL_DIR / "val.csv", index=False)
        X_test.to_csv(DATA_TEST_DIR / "test.csv", index=False)
        
        print(f"Donnees divisees sauvegardees:")
        print(f"  Train: {X_train.shape[0]} echantillons")
        print(f"  Val: {X_val.shape[0]} echantillons")
        print(f"  Test: {X_test.shape[0]} echantillons")
    
    def load_train_val_test(self):
        """
        Charge les ensembles train, validation et test
        
        Returns:
            tuple: (X_train, X_val, X_test)
        """
        X_train = pd.read_csv(DATA_TRAIN_DIR / "train.csv")
        X_val = pd.read_csv(DATA_VAL_DIR / "val.csv")
        X_test = pd.read_csv(DATA_TEST_DIR / "test.csv")
        
        print(f"Donnees divisees chargees:")
        print(f"  Train: {X_train.shape[0]} echantillons")
        print(f"  Val: {X_val.shape[0]} echantillons")
        print(f"  Test: {X_test.shape[0]} echantillons")
        
        return X_train, X_val, X_test
    
    def get_data_info(self):
        """
        Affiche les informations sur les données disponibles
        """
        print("Etat des donnees:")
        print(f"  Raw: {'Existe' if DATASET_RAW.exists() else 'Manquant'}")
        print(f"  Processed: {'Existe' if DATASET_PROCESSED.exists() else 'Manquant'}")
        print(f"  Train: {'Existe' if (DATA_TRAIN_DIR / 'train.csv').exists() else 'Manquant'}")
        print(f"  Val: {'Existe' if (DATA_VAL_DIR / 'val.csv').exists() else 'Manquant'}")
        print(f"  Test: {'Existe' if (DATA_TEST_DIR / 'test.csv').exists() else 'Manquant'}")


if __name__ == "__main__":
    manager = DataManager()
    manager.get_data_info()
