# routes/analyze.py
from flask import Blueprint, request, jsonify
import hashlib
from datetime import datetime
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models.load_models import model_loader

analyze_bp = Blueprint('analyze', __name__)
AUTO_CERT_THRESHOLD = 0.00  # Demo mode: any non-fraud lot is considered authentic

@analyze_bp.route('/analyze', methods=['POST'])
def analyze_lot():
    """Analyse un lot de minerai avec l'IA"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Données manquantes"}), 400
        
        # Extraire les features
        features = {}
        for col in model_loader.feature_columns:
            features[col] = data.get(col, 0)
        
        # Prédiction IA
        ia_results = model_loader.predict(features)
        
        # Déterminer le statut
        is_fraud = ia_results.get('fraud', {}).get('is_fraud', False)
        mineral_conf = ia_results.get('mineral', {}).get('confidence', 0)
        
        if is_fraud:
            status = "SUSPECT"
            status_code = 1
        else:
            status = "AUTHENTIQUE"
            status_code = 0
        
        # Générer signature
        sig_data = f"{data.get('lot_id', '')}_{ia_results.get('mineral', {}).get('type', '')}_{datetime.now()}"
        ia_signature = hashlib.sha256(sig_data.encode()).hexdigest()[:16]
        
        result = {
            "lot_id": data.get('lot_id', 'inconnu'),
            "site": data.get('site', 'inconnu'),
            "timestamp": datetime.now().isoformat(),
            "ia_analysis": ia_results,
            # Format unifié attendu par le frontend
            "ia_result": {
                "mineral_type": ia_results.get('mineral', {}).get('type', 'unknown'),
                "confidence": ia_results.get('mineral', {}).get('confidence', 0),
                "impurity_level": ia_results.get('impurity', {}).get('level', 'unknown'),
                "is_fraud": ia_results.get('fraud', {}).get('is_fraud', False),
                "status": status
            },
            "status": status,
            "status_code": status_code,
            "ia_signature": ia_signature,
            "recommendation": "Certification automatique" if status == "AUTHENTIQUE" else "Inspection manuelle requise"
        }
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@analyze_bp.route('/health', methods=['GET'])
def health_check():
    """Vérification santé"""
    return jsonify({
        "status": "ok",
        "models_loaded": list(model_loader.models.keys()),
        "features": model_loader.feature_columns,
        "model_dir": model_loader.model_dir
    })
