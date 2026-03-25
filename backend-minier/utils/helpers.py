# utils/helpers.py
import hashlib
from datetime import datetime

def generate_ia_signature(lot_id, mineral_type, confidence):
    """Génère une signature unique pour l'IA"""
    data = f"{lot_id}_{mineral_type}_{confidence}_{datetime.now().timestamp()}"
    return hashlib.sha256(data.encode()).hexdigest()[:16]

def format_lot_for_blockchain(lot_data, ia_results):
    """Formate les données pour la blockchain"""
    return {
        "lotId": lot_data.get('lot_id'),
        "mineralType": ia_results.get('mineral', {}).get('type', 'unknown'),
        "purity": ia_results.get('impurity', {}).get('level', 'medium'),
        "confidence": int(ia_results.get('mineral', {}).get('confidence', 0.5) * 100),
        "iaSignature": generate_ia_signature(
            lot_data.get('lot_id', ''),
            ia_results.get('mineral', {}).get('type', ''),
            ia_results.get('mineral', {}).get('confidence', 0)
        )
    }