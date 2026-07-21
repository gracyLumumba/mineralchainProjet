# routes/analyze.py
from flask import Blueprint, request, jsonify, current_app
import hashlib
from datetime import datetime
import sys
import os
from sqlalchemy import text

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models.load_models import model_loader
from database.models import db
from utils.analysis_rules import evaluate_consistency_rules
from utils.request_security import verify_signed_request

analyze_bp = Blueprint('analyze', __name__)
AUTO_CERT_THRESHOLD = 0.00  # Demo mode: any non-fraud lot is considered authentic


@analyze_bp.route('/analyze', methods=['POST'])
def analyze_lot():
    """Analyse un lot de minerai avec l'IA."""
    try:
        integrity_error = verify_signed_request()
        if integrity_error:
            return integrity_error

        data = request.get_json(silent=True)

        if not data:
            return jsonify({"error": "Donnees manquantes"}), 400

        features = {}
        for col in model_loader.feature_columns:
            features[col] = data.get(col, 0)

        ia_results = model_loader.predict(features)
        shap_results = model_loader.explain(features, ia_results, top_n=5)
        rule_check = evaluate_consistency_rules(data)
        model_fraud = ia_results.get('fraud', {}).get('is_fraud', False)
        is_fraud = bool(model_fraud or rule_check['is_suspect'])

        fingerprint = {
            "chemical_composition": {
                "cu": data.get('cu_grade_percent', data.get('cu_grade', 0)),
                "co": data.get('co_grade_percent', data.get('co_grade', 0)),
                "fe": data.get('fe_percent', data.get('fe_grade', 0)),
                "ni": data.get('ni_percent', data.get('ni_grade', 0)),
                "s": data.get('s_percent', data.get('s_grade', 0)),
                "silica": data.get('silica_percent', data.get('silica_grade', 0)),
            },
            "geological_origin": data.get('geological_origin') or "non renseignee",
            "texture": data.get('texture') or "non renseignee",
            "completeness_score": int(
                (
                    bool(data.get('geological_origin')) +
                    bool(data.get('texture')) +
                    any(data.get(k) not in (None, '') for k in [
                        'cu_grade_percent', 'co_grade_percent', 'fe_percent', 'ni_percent',
                        's_percent', 'silica_percent'
                    ])
                ) / 3 * 100
            ),
        }

        if is_fraud:
            status = "SUSPECT"
            status_code = 1
        else:
            status = "AUTHENTIQUE"
            status_code = 0

        sig_data = f"{data.get('lot_id', '')}_{ia_results.get('mineral', {}).get('type', '')}_{datetime.now()}"
        ia_signature = hashlib.sha256(sig_data.encode()).hexdigest()[:16]

        result = {
            "lot_id": data.get('lot_id', 'inconnu'),
            "site": data.get('site', 'inconnu'),
            "timestamp": datetime.now().isoformat(),
            "ia_analysis": ia_results,
            "ai_explanations": shap_results,
            "mineral_fingerprint": fingerprint,
            "ia_result": {
                "mineral_type": ia_results.get('mineral', {}).get('type', 'unknown'),
                "confidence": ia_results.get('mineral', {}).get('confidence', 0),
                "impurity_level": ia_results.get('impurity', {}).get('level', 'unknown'),
                "is_fraud": is_fraud,
                "fraud_reasons": rule_check['reasons'],
                "status": status,
                "fingerprint": fingerprint,
            },
            "status": status,
            "status_code": status_code,
            "ia_signature": ia_signature,
            "recommendation": "Certification automatique" if status == "AUTHENTIQUE" else "Inspection manuelle requise",
            "validation": rule_check,
        }

        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@analyze_bp.route('/health', methods=['GET'])
def health_check():
    """Verification sante."""
    database_status = {
        "enabled": current_app.config.get('DATABASE_ENABLED', False),
        "configured": bool(current_app.config.get('DATABASE_URL_MASKED')),
        "url": current_app.config.get('DATABASE_URL_MASKED') or None,
    }
    if database_status["enabled"]:
        try:
            db.session.execute(text('SELECT 1'))
            database_status["connected"] = True
        except Exception as error:
            database_status["connected"] = False
            database_status["error"] = str(error)
    else:
        database_status["connected"] = False

    return jsonify({
        "status": "ok",
        "models_loaded": list(model_loader.models.keys()),
        "features": model_loader.feature_columns,
        "model_dir": model_loader.model_dir,
        "shap_available": model_loader.shap_available,
        "database": database_status,
    })
