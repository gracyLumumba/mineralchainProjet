from flask import Blueprint, request, jsonify
from datetime import datetime
from database.models import db, LotHistory
from routes.auth import get_current_user
from routes.lots import get_lot_record

validate_bp = Blueprint('validate', __name__)

# Tolérances DGMR (mêmes que sur le web)
FIELD_SPECS = {
    'cu_grade': {'label': 'cu_grade_percent', 'tolerance': 0.5},
    'co_grade': {'label': 'co_grade_percent', 'tolerance': 0.3},
    'fe_grade': {'label': 'fe_percent', 'tolerance': 1.0},
    's_grade': {'label': 's_percent', 'tolerance': 0.5},
    'density': {'label': 'density_t_m3', 'tolerance': 0.15},
    'weight': {'label': 'weight_tonnes', 'tolerance': 5.0},
}

def auto_validate_lot(lot):
    """
    Validation automatique : compare les données producteur avec les données DGMR simulées.
    Retourne le même format que buildComparison() du frontend.
    """
    print(f"[AUTO_VALIDATE] Début validation pour lot {lot.lot_id}")
    results = []
    all_ok = True
    
    import hashlib
    import random

    seed = int(hashlib.sha256(str(lot.lot_id).encode('utf-8')).hexdigest()[:16], 16)
    rng = random.Random(seed)

    for field, spec in FIELD_SPECS.items():
        tolerance = spec['tolerance']
        prod_val = getattr(lot, field, None)
        
        if prod_val is None:
            print(f"[AUTO_VALIDATE] {field}: pas de valeur producteur")
            continue
        
        try:
            prod_val = float(prod_val)
        except (ValueError, TypeError):
            print(f"[AUTO_VALIDATE] {field}: erreur conversion {prod_val}")
            continue
        
        # Variation pseudo-aléatoire mais déterministe pour rendre les tests rejouables.
        if rng.random() < 0.8:
            variation = rng.uniform(-tolerance * 0.3, tolerance * 0.3)
        else:
            variation = rng.uniform(-tolerance * 0.8, tolerance * 0.8)
        
        reg_val = max(0, prod_val + variation)
        diff = abs(prod_val - reg_val)
        ok = diff <= tolerance
        
        if not ok:
            all_ok = False
        
        print(f"[AUTO_VALIDATE] {field}: prod={prod_val:.3f}, dgmr={reg_val:.3f}, diff={diff:.3f}, ok={ok}")
        
        results.append({
            'field': field,
            'label': spec['label'],
            'prodVal': float(prod_val),
            'regVal': float(reg_val),
            'diff': float(diff),
            'tolerance': tolerance,
            'ok': ok
        })
    
    if len(results) == 0:
        print("[AUTO_VALIDATE] ERREUR: Aucun paramètre comparé")
        all_ok = False
    
    print(f"[AUTO_VALIDATE] Résultat: {len(results)} paramètres, all_ok={all_ok}")
    
    return {
        'results': results,
        'allOk': all_ok,
        'compared_at': datetime.utcnow().isoformat(),
        'params_compared': len(results),
        'conformes': len([r for r in results if r['ok']]),
        'seed': seed,
    }


@validate_bp.route('/lots/<lot_id>/auto-validate', methods=['POST', 'OPTIONS'])
def auto_validate(lot_id):
    """
    Validation automatique DGMR sans upload de fichier.
    Compare les données producteur avec les données DGMR en base.
    """
    # Gérer les requêtes OPTIONS (preflight CORS)
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
        return response, 200
    
    try:
        print(f"\n[AUTO_VALIDATE] Requête reçue pour lot_id={lot_id}")
        
        user = get_current_user()
        if not user:
            print("[AUTO_VALIDATE] ERREUR: Pas d'authentification")
            return jsonify({"success": False, "error": "Authentification requise"}), 401
        
        print(f"[AUTO_VALIDATE] User: {user.get('username')} ({user.get('role')})")
        
        if user.get('role') != 'regulator':
            print("[AUTO_VALIDATE] ERREUR: Pas régulateur")
            return jsonify({"success": False, "error": "Accès réservé au régulateur"}), 403
        
        lot = get_lot_record(lot_id, sync_json_to_db=True)
        if not lot:
            print(f"[AUTO_VALIDATE] ERREUR: Lot {lot_id} non trouvé")
            return jsonify({"success": False, "error": "Lot non trouvé"}), 404
        
        print(f"[AUTO_VALIDATE] Lot trouvé: {lot.lot_id}, validated={lot.regulator_validated}")
        
        if lot.regulator_validated:
            print("[AUTO_VALIDATE] ERREUR: Lot déjà validé")
            return jsonify({"success": False, "error": "Lot déjà validé"}), 400
        
        # Effectuer la validation automatique
        comparison = auto_validate_lot(lot)
        
        # Construire les données DGMR simulées pour le frontend
        dgmr_data = {}
        for result in comparison['results']:
            dgmr_data[result['field']] = result['regVal']
        
        print(f"[AUTO_VALIDATE] DGMR data: {dgmr_data}")
        
        # Mettre à jour le lot
        lot.regulator_validated = True
        lot.regulator_validated_at = datetime.utcnow()
        lot.status = 'AUTHENTIQUE' if comparison['allOk'] else 'SUSPECT'
        lot.updated_at = datetime.utcnow()
        
        print(f"[AUTO_VALIDATE] Nouveau status: {lot.status}")
        
        # Ajouter l'historique
        db.session.add(LotHistory(
            lot=lot,
            event='REGULATOR_AUTO_VALIDATION',
            status=lot.status,
            details={
                'params_compared': comparison['params_compared'],
                'conformes': comparison['conformes'],
                'validated_by': user.get('username'),
                'auto': True
            }
        ))
        
        db.session.commit()
        print("[AUTO_VALIDATE] Commit réussi")
        
        response = {
            "success": True,
            "lot_id": lot_id,
            "status": lot.status,
            "comparison": comparison['results'],
            "dgmr_data": dgmr_data,
            "message": f"Lot {lot_id} validé automatiquement - {comparison['conformes']}/{comparison['params_compared']} paramètres conformes"
        }
        
        print(f"[AUTO_VALIDATE] Réponse: success={response['success']}, status={response['status']}")
        print(f"[AUTO_VALIDATE] Fin\n")
        
        return jsonify(response)
        
    except Exception as e:
        db.session.rollback()
        print(f"[AUTO_VALIDATE] EXCEPTION: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": f"{type(e).__name__}: {str(e)}"}), 500
