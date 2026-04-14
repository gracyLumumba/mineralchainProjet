from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
import json
import os

from database.models import db, Lot, LotHistory
from routes.auth import get_current_user

lots_bp = Blueprint('lots', __name__)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
lots_db_file = os.path.join(BASE_DIR, 'lots_data.json')
lots_db = {}

if os.path.exists(lots_db_file):
    try:
        with open(lots_db_file, 'r', encoding='utf-8') as f:
            lots_db = json.load(f)
    except Exception:
        lots_db = {}


def json_history_entry(event, extra=None):
    payload = {
        "event": event,
        "timestamp": datetime.now().isoformat(),
        "user": "system"
    }
    if extra:
        payload.update(extra)
    return payload


def save_json_store():
    with open(lots_db_file, 'w', encoding='utf-8') as f:
        json.dump(lots_db, f, indent=2, ensure_ascii=False)


def database_enabled():
    return bool(current_app.config.get('DATABASE_ENABLED'))


def json_lot_to_database_payload(payload):
    composition = payload.get('composition') or {}
    return {
        "lot_id": payload.get('lot_id'),
        "site": payload.get('site'),
        "extraction_date": payload.get('extraction_date'),
        "status": payload.get('status'),
        "weight": payload.get('weight'),
        "cu_grade": composition.get('cu'),
        "co_grade": composition.get('co'),
        "fe_grade": composition.get('fe'),
        "s_grade": composition.get('s'),
        "ni_grade": composition.get('ni'),
        "silica_grade": composition.get('silica'),
        "token_id": payload.get('token_id'),
        "tx_hash": payload.get('tx_hash'),
        "block_number": payload.get('block_number'),
        "contract_address": payload.get('contract_address'),
        "certificate_id": payload.get('certificate_id'),
        "owner_user_id": payload.get('owner_user_id'),
        "owner_username": payload.get('owner_username'),
        "owner_name": payload.get('owner_name'),
    }


def get_lot_record(lot_id, sync_json_to_db=False):
    db_lot = Lot.query.filter_by(lot_id=lot_id).first() if database_enabled() else None
    if db_lot:
        return db_lot

    json_lot = lots_db.get(lot_id)
    if not json_lot or not database_enabled() or not sync_json_to_db:
        return None

    synced = upsert_database_lot(
        json_lot_to_database_payload(json_lot),
        history_event='SYNCED_FROM_JSON',
        history_extra={"source": "json_store"},
    )
    return synced


def parse_date(value):
    if not value:
        return None
    if isinstance(value, datetime):
        return value.date()
    return datetime.fromisoformat(str(value)).date()


def can_access_lot(user, payload):
    if not user:
        return False
    if user.get('role') != 'producer':
        return True
    return (
        payload.get('owner_user_id') == user.get('id')
        or payload.get('owner_username') == user.get('username')
    )


def can_view_history(user, payload):
    if not user:
        return False
    if user.get('role') == 'admin':
        return True
    return (
        payload.get('owner_user_id') == user.get('id')
        or payload.get('owner_username') == user.get('username')
    )


def redact_history_for_user(user, payload):
    if not can_view_history(user, payload):
        copy = dict(payload)
        copy['history'] = []
        return copy
    return payload


def db_lot_to_payload(lot):
    payload = {
        "lot_id": lot.lot_id,
        "site": lot.site,
        "created_at": lot.created_at.isoformat() if lot.created_at else None,
        "updated_at": lot.updated_at.isoformat() if lot.updated_at else None,
        "extraction_date": lot.extraction_date.isoformat() if lot.extraction_date else None,
        "analyzed_at": lot.analyzed_at.isoformat() if lot.analyzed_at else None,
        "status": lot.status,
        "weight": lot.weight,
        "composition": {
            "cu": lot.cu_grade,
            "co": lot.co_grade,
            "fe": lot.fe_grade,
            "s": lot.s_grade,
            "ni": lot.ni_grade,
            "silica": lot.silica_grade,
        },
        "history": [
            {
                "event": item.event,
                "status": item.status,
                "details": item.details,
                "timestamp": item.timestamp.isoformat() if item.timestamp else None,
            }
            for item in sorted(lot.history, key=lambda entry: entry.timestamp or datetime.min)
        ],
        "certificate_id": lot.certificate_id,
        "token_id": lot.token_id,
        "tx_hash": lot.tx_hash,
        "block_number": lot.block_number,
        "contract_address": lot.contract_address,
        "owner_user_id": lot.owner_user_id,
        "owner_username": lot.owner_username,
        "owner_name": lot.owner_name,
        "storage": "postgres"
    }
    return payload


def upsert_database_lot(data, history_event=None, history_extra=None):
    if not database_enabled():
        return None

    lot = Lot.query.filter_by(lot_id=data['lot_id']).first()
    is_new = lot is None
    if is_new:
        lot = Lot(lot_id=data['lot_id'])
        db.session.add(lot)

    lot.site = data.get('site', lot.site or 'inconnu')
    lot.extraction_date = parse_date(data.get('extraction_date')) or lot.extraction_date or datetime.utcnow().date()
    lot.updated_at = datetime.utcnow()
    if is_new:
        lot.created_at = datetime.utcnow()

    lot.status = data.get('status', lot.status or 'CRÉÉ')
    lot.weight = data.get('weight_tonnes', data.get('weight', lot.weight))
    lot.cu_grade = data.get('cu_grade_percent', data.get('cu_grade', lot.cu_grade))
    lot.co_grade = data.get('co_grade_percent', data.get('co_grade', lot.co_grade))
    lot.fe_grade = data.get('fe_percent', data.get('fe_grade', lot.fe_grade))
    lot.ni_grade = data.get('ni_percent', data.get('ni_grade', lot.ni_grade))
    lot.s_grade = data.get('s_percent', data.get('s_grade', lot.s_grade))
    lot.silica_grade = data.get('silica_percent', data.get('silica_grade', lot.silica_grade))
    lot.density = data.get('density_t_m3', data.get('density', lot.density))
    lot.moisture = data.get('moisture_percent', data.get('moisture', lot.moisture))
    lot.hardness = data.get('hardness_mohs', data.get('hardness', lot.hardness))
    lot.analyzed_at = data.get('analyzed_at', lot.analyzed_at)
    lot.mineral_type = data.get('mineral_type', lot.mineral_type)
    lot.confidence = data.get('confidence', lot.confidence)
    lot.impurity_level = data.get('impurity_level', lot.impurity_level)
    lot.is_fraud = data.get('is_fraud', lot.is_fraud)
    lot.token_id = data.get('token_id', lot.token_id)
    lot.tx_hash = data.get('tx_hash', lot.tx_hash)
    lot.block_number = data.get('block_number', lot.block_number)
    lot.contract_address = data.get('contract_address', lot.contract_address)
    lot.certificate_id = data.get('certificate_id', lot.certificate_id)
    lot.owner_user_id = data.get('owner_user_id', lot.owner_user_id)
    lot.owner_username = data.get('owner_username', lot.owner_username)
    lot.owner_name = data.get('owner_name', lot.owner_name)

    if isinstance(lot.analyzed_at, str):
        lot.analyzed_at = datetime.fromisoformat(lot.analyzed_at)

    if history_event:
        db.session.add(LotHistory(
            lot=lot,
            event=history_event,
            status=lot.status,
            details=history_extra or {}
        ))

    db.session.commit()
    return lot


@lots_bp.route('/lots', methods=['GET'])
def get_all_lots():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentification requise"}), 401
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 20))
    site = request.args.get('site')
    status = request.args.get('status')

    lots_list = list(lots_db.values())
    if database_enabled():
        db_lots = [db_lot_to_payload(item) for item in Lot.query.order_by(Lot.created_at.desc()).all()]
        merged = {lot['lot_id']: lot for lot in lots_list}
        for lot in db_lots:
            merged[lot['lot_id']] = lot
        lots_list = list(merged.values())

    if user and user.get('role') == 'producer':
        lots_list = [l for l in lots_list if can_access_lot(user, l)]

    if site:
        lots_list = [l for l in lots_list if l.get('site') == site]
    if status:
        lots_list = [l for l in lots_list if l.get('status') == status]

    lots_list = [redact_history_for_user(user, lot) for lot in lots_list]

    start = (page - 1) * limit
    end = start + limit

    return jsonify({
        "total": len(lots_list),
        "page": page,
        "limit": limit,
        "lots": lots_list[start:end]
    })


@lots_bp.route('/lots/<lot_id>', methods=['GET'])
def get_lot(lot_id):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentification requise"}), 401
    if database_enabled():
        db_lot = Lot.query.filter_by(lot_id=lot_id).first()
        if db_lot:
            payload = db_lot_to_payload(db_lot)
            if user and not can_access_lot(user, payload):
                return jsonify({"error": "Accès refusé"}), 403
            return jsonify(redact_history_for_user(user, payload))

    lot = lots_db.get(lot_id)
    if lot:
        if user and not can_access_lot(user, lot):
            return jsonify({"error": "Accès refusé"}), 403
        return jsonify(redact_history_for_user(user, lot))
    return jsonify({"error": "Lot non trouvé"}), 404


@lots_bp.route('/lots', methods=['POST'])
def create_lot():
    data = request.get_json() or {}
    user = get_current_user()

    if not user:
        return jsonify({"error": "Authentification requise"}), 401
    if not data or 'lot_id' not in data:
        return jsonify({"error": "lot_id requis"}), 400

    lot_id = data['lot_id']

    if lot_id in lots_db or (database_enabled() and Lot.query.filter_by(lot_id=lot_id).first()):
        return jsonify({"error": "Lot existe déjà"}), 409

    new_lot = {
        "lot_id": lot_id,
        "site": data.get('site', 'inconnu'),
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "status": "CRÉÉ",
        "weight": data.get('weight_tonnes', 0),
        "composition": {
            "cu": data.get('cu_grade_percent', 0),
            "co": data.get('co_grade_percent', 0),
            "fe": data.get('fe_percent', 0),
            "s": data.get('s_percent', 0)
        },
        "owner_user_id": user.get('id'),
        "owner_username": user.get('username'),
        "owner_name": user.get('name'),
        "history": [json_history_entry("Création du lot", {
            "owner_username": user.get('username')
        })]
    }

    lots_db[lot_id] = new_lot
    save_json_store()

    if database_enabled():
        upsert_database_lot({
            **data,
            "owner_user_id": user.get('id'),
            "owner_username": user.get('username'),
            "owner_name": user.get('name'),
        }, history_event='CREATED', history_extra={"source": "json_route"})

    new_lot["storage"] = "json+postgres" if database_enabled() else "json"
    return jsonify(new_lot), 201


@lots_bp.route('/lots/<lot_id>/certify', methods=['POST'])
def certify_lot(lot_id):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentification requise"}), 401
    if lot_id not in lots_db:
        return jsonify({"error": "Lot non trouvé"}), 404
    if user.get('role') == 'producer' and not can_access_lot(user, lots_db[lot_id]):
        return jsonify({"error": "Accès refusé"}), 403

    data = request.get_json() or {}

    lots_db[lot_id]['status'] = "CERTIFIÉ"
    lots_db[lot_id]['certificate_id'] = data.get('certificate_id', f"CERT-{lot_id}")
    lots_db[lot_id]['updated_at'] = datetime.now().isoformat()
    lots_db[lot_id]['history'].append(json_history_entry("Certification", {
        "certificate_id": lots_db[lot_id]['certificate_id']
    }))
    save_json_store()

    if database_enabled():
        upsert_database_lot({
            "lot_id": lot_id,
            "site": lots_db[lot_id].get('site'),
            "status": "CERTIFIÉ",
            "certificate_id": lots_db[lot_id]['certificate_id'],
            "owner_user_id": lots_db[lot_id].get('owner_user_id'),
            "owner_username": lots_db[lot_id].get('owner_username'),
            "owner_name": lots_db[lot_id].get('owner_name'),
        }, history_event='CERTIFIED', history_extra={
            "certificate_id": lots_db[lot_id]['certificate_id']
        })

    lots_db[lot_id]['storage'] = "json+postgres" if database_enabled() else "json"
    return jsonify(lots_db[lot_id])
