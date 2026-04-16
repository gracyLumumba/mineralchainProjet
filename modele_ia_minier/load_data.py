"""
Script pour charger le dataset depuis la structure Data/raw/
"""
import os
import pandas as pd

def load_dataset(base_dir=None):
    """
    Charge le dataset depuis Data/raw/
    
    Args:
        base_dir: Répertoire de base (par défaut le répertoire courant)
    
    Returns:
        DataFrame contenant le dataset
    """
    if base_dir is None:
        base_dir = os.path.dirname(os.path.abspath(__file__))
    
    dataset_path = os.path.join(base_dir, "Data", "raw", "dataset_minier_complet_50000.csv")
    
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Dataset non trouvé à: {dataset_path}")
    
    df = pd.read_csv(dataset_path)
    print(f"Dataset charge depuis: {dataset_path}")
    print(f"  Dimensions: {df.shape[0]} lignes x {df.shape[1]} colonnes")
    
    return df

def setup_directories(base_dir=None):
    """
    Crée la structure de répertoires nécessaire
    
    Args:
        base_dir: Répertoire de base (par défaut le répertoire courant)
    
    Returns:
        Dictionnaire avec les chemins des répertoires
    """
    if base_dir is None:
        base_dir = os.path.dirname(os.path.abspath(__file__))
    
    dirs = {
        'base': base_dir,
        'data': os.path.join(base_dir, 'Data'),
        'data_raw': os.path.join(base_dir, 'Data', 'raw'),
        'data_processed': os.path.join(base_dir, 'Data', 'processed'),
        'data_train': os.path.join(base_dir, 'Data', 'train'),
        'data_val': os.path.join(base_dir, 'Data', 'val'),
        'data_test': os.path.join(base_dir, 'Data', 'test'),
        'models': os.path.join(base_dir, 'modeles'),
        'visualizations': os.path.join(base_dir, 'visualisations'),
        'reports': os.path.join(base_dir, 'rapports')
    }
    
    for key, path in dirs.items():
        if key != 'base':
            os.makedirs(path, exist_ok=True)
    
    print("Structure de repertoires creee/verifiee:")
    for key, path in dirs.items():
        if key != 'base':
            print(f"  - {key}: {path}")
    
    return dirs

if __name__ == "__main__":
    # Exemple d'utilisation
    dirs = setup_directories()
    df = load_dataset()
    print(f"\nPret a utiliser! Dataset: {df.shape}")
