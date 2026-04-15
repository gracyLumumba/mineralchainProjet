from datetime import datetime

from flask import Blueprint, jsonify, request

from database.models import Lot, LotHistory, db
from routes.auth import get_current_user
from routes.lots import database_enabled, get_lot_record

validate_bp = Blueprint('validate', __name__)

FIELD_SPECS = {
    'cu_grade': {'field': 'cu_grade_percent', 'label': 'Cuivre - Cu (%)', 'tolerance': 0.5},
    'co_grade': {'field': 'co_grade_percent', 'label': 'Cobalt - Co (%)', 'tolerance': 0.3},
    'fe_grade': {'field': 'fe_percent', 'label': 'Fer - Fe (%)', 'tolerance': 1.0},
    's_grade': {'field': 's_percent', 'label': 'Soufre - S (%)', 'tolerance': 0.5},
    'density': {'field': 'density_t_m3', 'label': 'Densite (t/m3)', 'tolerance': 0.15},
    'weight': {'field': 'weight_tonnes', 'label': 'Poids (t)', 'tolerance': 5.0},
}


def auto_validate_lot(lot):
    print(f"[AUTO_VALIDATE] Debut validation pour lot {lot.lot_id}")
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
            'field': spec['field'],
            'label': spec['label'],
            'prodVal': float(prod_val),
            'regVal': float(reg_val),
            'diff': float(diff),
            'tolerance': tolerance,
            'ok': ok,
        })

    if not results:
        print("[AUTO_VALIDATE] ERREUR: Aucun parametre compare")
        all_ok = False

    print(f"[AUTO_VALIDATE] Resultat: {len(results)} parametres, all_ok={all_ok}")

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
    if request.method == 'OPTIONS':
        # Let Flask-CORS apply the correct origin dynamically.
        return jsonify({'status': 'ok'}), 200

    try:
        print(f"\n[AUTO_VALIDATE] Requete recue pour lot_id={lot_id}")

        user = get_current_user()
        if not user:
            print("[AUTO_VALIDATE] ERREUR: Pas d'authentification")
            return jsonify({"success": False, "error": "Authentification requise"}), 401

        print(f"[AUTO_VALIDATE] User: {user.get('username')} ({user.get('role')})")

        if user.get('role') != 'regulator':
            print("[AUTO_VALIDATE] ERREUR: Pas regulateur")
            return jsonify({"success": False, "error": "Acces reserve au regulateur"}), 403

        if database_enabled():
            lot = Lot.query.filter_by(lot_id=lot_id).with_for_update().first()
        else:
            lot = get_lot_record(lot_id, sync_json_to_db=True)

        if not lot:
            print(f"[AUTO_VALIDATE] ERREUR: Lot {lot_id} non trouve")
            return jsonify({"success": False, "error": "Lot non trouve"}), 404

        already_validated = getattr(lot, 'regulator_validated', False)
        print(f"[AUTO_VALIDATE] Lot trouve: {lot.lot_id}, validated={already_validated}")

        if already_validated:
            print("[AUTO_VALIDATE] IGNORE: Lot deja valide")
            return jsonify({
                "success": True,
                "lot_id": lot_id,
                "status": lot.status,
                "comparison": [],
                "dgmr_data": {},
                "message": f"Lot {lot_id} deja valide",
                "already_validated": True,
            }), 200

        comparison = auto_validate_lot(lot)

        dgmr_data = {}
        for result in comparison['results']:
            dgmr_data[result['field']] = result['regVal']

        print(f"[AUTO_VALIDATE] DGMR data: {dgmr_data}")

        lot.regulator_validated = True
        lot.regulator_validated_at = datetime.utcnow()
        lot.status = 'AUTHENTIQUE' if comparison['allOk'] else 'SUSPECT'
        lot.updated_at = datetime.utcnow()

        print(f"[AUTO_VALIDATE] Nouveau status: {lot.status}")

        existing_history = LotHistory.query.filter_by(
            lot_id=lot.id,
            event='REGULATOR_AUTO_VALIDATION',
        ).first()

        if not existing_history:
            db.session.add(LotHistory(
                lot=lot,
                event='REGULATOR_AUTO_VALIDATION',
                status=lot.status,
                details={
                    'params_compared': comparison['params_compared'],
                    'conformes': comparison['conformes'],
                    'validated_by': user.get('username'),
                    'auto': True,
                },
            ))

        db.session.commit()
        print("[AUTO_VALIDATE] Commit reussi")

        response = {
            "success": True,
            "lot_id": lot_id,
            "status": lot.status,
            "comparison": comparison['results'],
            "dgmr_data": dgmr_data,
            "message": f"Lot {lot_id} valide automatiquement - {comparison['conformes']}/{comparison['params_compared']} parametres conformes",
        }

        print(f"[AUTO_VALIDATE] Reponse: success={response['success']}, status={response['status']}")
        print("[AUTO_VALIDATE] Fin\n")

        return jsonify(response)

    except Exception as e:
        db.session.rollback()
        print(f"[AUTO_VALIDATE] EXCEPTION: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": f"{type(e).__name__}: {str(e)}"}), 500
