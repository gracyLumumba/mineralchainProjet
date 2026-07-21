from datetime import datetime
import hashlib
import json

from flask import Blueprint, jsonify as flask_jsonify, request

from database.models import Lot, LotHistory, db
from routes.auth import get_current_user
from routes.lots import database_enabled, get_lot_record
from utils.experiment_logger import record_auto_validation_run
from utils.soap_utils import parse_soap_payload, soap_response
from routes.certify import (
    ACCOUNT,
    CONTRACT_ADDRESS,
    contract,
    extract_token_id_from_receipt,
    send_contract_transaction,
    upload_to_pinata,
    w3,
)

validate_bp = Blueprint('validate', __name__)


def jsonify(payload, *args, **kwargs):
    if request.method in {'POST', 'PUT', 'PATCH', 'DELETE'}:
        status = kwargs.pop('status', 200)
        action = kwargs.pop('soap_action', 'ValidateResponse')
        return soap_response(payload, action=action, status=status)
    return flask_jsonify(payload, *args, **kwargs)

FIELD_SPECS = {
    'cu_grade': {'field': 'cu_grade_percent', 'label': 'Cuivre - Cu (%)', 'tolerance': 0.5},
    'co_grade': {'field': 'co_grade_percent', 'label': 'Cobalt - Co (%)', 'tolerance': 0.3},
    'fe_grade': {'field': 'fe_percent', 'label': 'Fer - Fe (%)', 'tolerance': 1.0},
    's_grade': {'field': 's_percent', 'label': 'Soufre - S (%)', 'tolerance': 0.5},
    'density': {'field': 'density_t_m3', 'label': 'Densite (t/m3)', 'tolerance': 0.15},
    'weight': {'field': 'weight_tonnes', 'label': 'Poids (t)', 'tolerance': 5.0},
}

def _has_lab_values(dgmr_data):
    if not isinstance(dgmr_data, dict):
        return False
    accepted_fields = {spec['field'] for spec in FIELD_SPECS.values()}
    for key, value in dgmr_data.items():
        if key in accepted_fields and value not in (None, ""):
            return True
    return False


def _validate_lab_file_payload(payload, status):
    lab_file = payload.get('lab_file') or {}
    dgmr_data = payload.get('dgmr_data') or {}
    comparison = payload.get('comparison') or []

    if not isinstance(lab_file, dict) or not str(lab_file.get('name') or '').strip():
        return "Fichier laboratoire requis pour la double analyse"

    filename = str(lab_file.get('name') or '').lower()
    if not filename.endswith(('.csv', '.xls', '.xlsx')):
        return "Format fichier labo invalide: CSV, XLS ou XLSX requis"

    if not isinstance(dgmr_data, dict) or not dgmr_data:
        return "Donnees laboratoire importees requises"

    if status == "AUTHENTIQUE":
        if not isinstance(comparison, list) or not comparison:
            return "Comparaison laboratoire requise avant certification"
        if not _has_lab_values(dgmr_data):
            return "Le fichier labo ne contient aucun parametre comparable"

    return None


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


def _lot_certificate_payload(lot, comparison=None, dgmr_data=None, validated_by=""):
    return {
        "version": "2.0",
        "format": "IPFS-CERT-DGMR",
        "certificate_id": f"CERT-{lot.lot_id}-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}",
        "lot_id": lot.lot_id,
        "site": lot.site,
        "extraction_date": lot.extraction_date.isoformat() if lot.extraction_date else None,
        "analyzed_at": lot.analyzed_at.isoformat() if lot.analyzed_at else None,
        "validated_at": datetime.utcnow().isoformat(),
        "validated_by": validated_by,
        "ia_analysis": {
            "mineral_type": lot.mineral_type,
            "confidence": lot.confidence,
            "impurity_level": lot.impurity_level,
            "is_fraud": lot.is_fraud,
            "status": lot.status,
        },
        "composition": {
            "cu": lot.cu_grade,
            "co": lot.co_grade,
            "fe": lot.fe_grade,
            "ni": lot.ni_grade,
            "s": lot.s_grade,
            "silica": lot.silica_grade,
        },
        "physical": {
            "density": lot.density,
            "moisture": lot.moisture,
            "hardness": lot.hardness,
            "weight": lot.weight,
        },
        "dgmr_validation": {
            "data": dgmr_data or {},
            "comparison": comparison or [],
        },
        "blockchain": {
            "contract_address": CONTRACT_ADDRESS,
        },
    }


def _mint_validated_lot(lot, certificate_hash, ipfs_hash):
    if contract is None:
        raise RuntimeError("Contrat NFT non charge")
    if not w3.is_connected():
        raise RuntimeError("Ganache indisponible sur http://127.0.0.1:7545")

    already_certified = contract.functions.isLotCertified(lot.lot_id).call()
    if already_certified:
        token_id = int(contract.functions.getTokenByLot(lot.lot_id).call())
        return {
            "token_id": token_id,
            "transaction_hash": lot.tx_hash,
            "block_number": lot.block_number,
            "contract_address": CONTRACT_ADDRESS,
            "gas_used": None,
            "simulated": False,
            "already_certified": True,
        }

    tx_builder = contract.functions.mintMineralToken(
        ACCOUNT,
        lot.lot_id,
        lot.site or "KAMOA",
        lot.mineral_type or "",
        lot.impurity_level or "",
        int(float(lot.confidence or 0) * 100),
        f"0x{certificate_hash[:16]}",
        True,
        certificate_hash,
        ipfs_hash or "",
        int(float(lot.cu_grade or 0) * 100),
        int(float(lot.co_grade or 0) * 100),
        int(float(lot.fe_grade or 0) * 100),
        int(float(lot.weight or 0) * 100),
    )
    tx_hash = send_contract_transaction(tx_builder)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
    token_id = extract_token_id_from_receipt(receipt, lot.lot_id)

    return {
        "token_id": token_id,
        "transaction_hash": tx_hash.hex(),
        "block_number": receipt.blockNumber,
        "contract_address": CONTRACT_ADDRESS,
        "gas_used": receipt.gasUsed,
        "simulated": False,
        "already_certified": False,
    }


@validate_bp.route('/lots/<lot_id>/regulator-certify', methods=['POST'])
def regulator_certify(lot_id):
    user = get_current_user()
    if not user:
        return jsonify({"success": False, "error": "Authentification requise"}), 401
    if user.get('role') != 'regulator':
        return jsonify({"success": False, "error": "Acces reserve au regulateur"}), 403
    if not database_enabled():
        return jsonify({"success": False, "error": "PostgreSQL indisponible ou non configure"}), 503
    payload = parse_soap_payload("RegulatorCertifyRequest")
    status = str(payload.get('status') or '').strip().upper()
    if status not in {"AUTHENTIQUE", "SUSPECT"}:
        return jsonify({"success": False, "error": "status doit etre AUTHENTIQUE ou SUSPECT"}), 400

    lab_error = _validate_lab_file_payload(payload, status)
    if lab_error:
        return jsonify({"success": False, "error": lab_error}), 400

    try:
        lot = Lot.query.filter_by(lot_id=lot_id).with_for_update().first()
        if not lot:
            return jsonify({"success": False, "error": "Lot non trouve"}), 404

        comparison = payload.get('comparison') or []
        dgmr_data = payload.get('dgmr_data') or {}
        lab_file = payload.get('lab_file') or {}
        forced = bool(payload.get('forced'))

        lot.regulator_validated = True
        lot.regulator_validated_at = datetime.utcnow()
        lot.status = status
        lot.updated_at = datetime.utcnow()

        certificate = None
        certificate_hash = None
        ipfs_hash = None
        gateway_url = None
        ipfs_error = None
        blockchain_result = None
        blockchain_error = None

        if status == "AUTHENTIQUE":
            certificate = _lot_certificate_payload(
                lot,
                comparison=comparison,
                dgmr_data=dgmr_data,
                validated_by=user.get('username', ''),
            )
            certificate_hash = hashlib.sha256(
                json.dumps(certificate, sort_keys=True, default=str).encode('utf-8')
            ).hexdigest()

            try:
                ipfs_hash = upload_to_pinata(certificate, lot_id)
                gateway_url = f"https://gateway.pinata.cloud/ipfs/{ipfs_hash}"
            except Exception as error:
                ipfs_error = str(error)

            try:
                blockchain_result = _mint_validated_lot(lot, certificate_hash, ipfs_hash)
                lot.token_id = blockchain_result.get("token_id")
                lot.tx_hash = blockchain_result.get("transaction_hash") or lot.tx_hash
                lot.block_number = blockchain_result.get("block_number") or lot.block_number
                lot.contract_address = blockchain_result.get("contract_address") or CONTRACT_ADDRESS
                lot.certificate_id = certificate["certificate_id"]
            except Exception as error:
                blockchain_error = str(error)

        db.session.add(LotHistory(
            lot=lot,
            event='REGULATOR_LAB_VALIDATION',
            status=lot.status,
            details={
                "validated_by": user.get('username'),
                "forced": forced,
                "lab_file": lab_file,
                "comparison": comparison,
                "dgmr_data": dgmr_data,
                "certificate_hash": certificate_hash,
                "ipfs_hash": ipfs_hash,
                "token_id": blockchain_result.get("token_id") if blockchain_result else None,
                "ipfs_error": ipfs_error,
                "blockchain_error": blockchain_error,
            },
        ))
        db.session.commit()

        return jsonify({
            "success": True,
            "lot_id": lot_id,
            "status": lot.status,
            "regulator_validated": lot.regulator_validated,
            "regulator_validated_at": lot.regulator_validated_at.isoformat() if lot.regulator_validated_at else None,
            "certificate": {
                "id": certificate["certificate_id"] if certificate else None,
                "hash": certificate_hash,
                "ipfs_hash": ipfs_hash,
                "gateway_url": gateway_url,
            },
            "blockchain": blockchain_result,
            "ipfs_error": ipfs_error,
            "blockchain_error": blockchain_error,
        })
    except Exception as error:
        db.session.rollback()
        return jsonify({"success": False, "error": f"{type(error).__name__}: {str(error)}"}), 500


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
            try:
                record_auto_validation_run(
                    lot_id=lot_id,
                    site="",
                    mineral_type="",
                    http_status=401,
                    success=False,
                    result_status="NON_AUTHENTIFIE",
                    validated_by="",
                    message="Authentification requise",
                    error="Authentification requise",
                    comparison=[],
                )
            except Exception as log_error:
                print(f"[AUTO_VALIDATE] WARN export resultats impossible: {log_error}")
            return jsonify({"success": False, "error": "Authentification requise"}), 401

        print(f"[AUTO_VALIDATE] User: {user.get('username')} ({user.get('role')})")
        parse_soap_payload("AutoValidateRequest")

        if user.get('role') != 'regulator':
            print("[AUTO_VALIDATE] ERREUR: Pas regulateur")
            try:
                record_auto_validation_run(
                    lot_id=lot_id,
                    site="",
                    mineral_type="",
                    http_status=403,
                    success=False,
                    result_status="ACCES_REFUSE",
                    validated_by=user.get('username', ''),
                    message="Acces reserve au regulateur",
                    error="Acces reserve au regulateur",
                    comparison=[],
                )
            except Exception as log_error:
                print(f"[AUTO_VALIDATE] WARN export resultats impossible: {log_error}")
            return jsonify({"success": False, "error": "Acces reserve au regulateur"}), 403

        message = "Auto-validation desactivee: importez le fichier laboratoire DGMR pour lancer la double analyse"
        try:
            record_auto_validation_run(
                lot_id=lot_id,
                site="",
                mineral_type="",
                http_status=400,
                success=False,
                result_status="FICHIER_LABO_REQUIS",
                validated_by=user.get('username', ''),
                message=message,
                error=message,
                comparison=[],
            )
        except Exception as log_error:
            print(f"[AUTO_VALIDATE] WARN export resultats impossible: {log_error}")
        return jsonify({"success": False, "error": message}), 400

        if database_enabled():
            lot = Lot.query.filter_by(lot_id=lot_id).with_for_update().first()
        else:
            lot = get_lot_record(lot_id, sync_json_to_db=True)

        if not lot:
            print(f"[AUTO_VALIDATE] ERREUR: Lot {lot_id} non trouve")
            try:
                record_auto_validation_run(
                    lot_id=lot_id,
                    site="",
                    mineral_type="",
                    http_status=404,
                    success=False,
                    result_status="LOT_INTROUVABLE",
                    validated_by=user.get('username', ''),
                    message="Lot non trouve",
                    error="Lot non trouve",
                    comparison=[],
                )
            except Exception as log_error:
                print(f"[AUTO_VALIDATE] WARN export resultats impossible: {log_error}")
            return jsonify({"success": False, "error": "Lot non trouve"}), 404

        already_validated = getattr(lot, 'regulator_validated', False)
        print(f"[AUTO_VALIDATE] Lot trouve: {lot.lot_id}, validated={already_validated}")

        if already_validated:
            print("[AUTO_VALIDATE] IGNORE: Lot deja valide")
            response_payload = {
                "success": True,
                "lot_id": lot_id,
                "status": lot.status,
                "comparison": [],
                "dgmr_data": {},
                "message": f"Lot {lot_id} deja valide",
                "already_validated": True,
            }
            try:
                record_auto_validation_run(
                    lot_id=lot_id,
                    site=getattr(lot, 'site', ''),
                    mineral_type=getattr(lot, 'mineral_type', ''),
                    http_status=200,
                    success=True,
                    result_status=lot.status,
                    already_validated=True,
                    params_compared=0,
                    conformes=0,
                    validated_by=user.get('username', ''),
                    message=response_payload["message"],
                    comparison=[],
                )
            except Exception as log_error:
                print(f"[AUTO_VALIDATE] WARN export resultats impossible: {log_error}")
            return jsonify(response_payload), 200

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

        try:
            record_auto_validation_run(
                lot_id=lot_id,
                site=getattr(lot, 'site', ''),
                mineral_type=getattr(lot, 'mineral_type', ''),
                http_status=200,
                success=True,
                result_status=lot.status,
                already_validated=False,
                params_compared=comparison['params_compared'],
                conformes=comparison['conformes'],
                validated_by=user.get('username', ''),
                message=response["message"],
                comparison=comparison['results'],
            )
        except Exception as log_error:
            print(f"[AUTO_VALIDATE] WARN export resultats impossible: {log_error}")

        return jsonify(response)

    except Exception as e:
        db.session.rollback()
        print(f"[AUTO_VALIDATE] EXCEPTION: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        try:
            record_auto_validation_run(
                lot_id=lot_id,
                site="",
                mineral_type="",
                http_status=500,
                success=False,
                result_status="ERREUR",
                already_validated=False,
                params_compared=0,
                conformes=0,
                validated_by="",
                message="Echec auto-validation",
                error=f"{type(e).__name__}: {str(e)}",
                comparison=[],
            )
        except Exception as log_error:
            print(f"[AUTO_VALIDATE] WARN export resultats impossible: {log_error}")
        return jsonify({"success": False, "error": f"{type(e).__name__}: {str(e)}"}), 500
