from datetime import datetime
import json
import os

from flask import Blueprint, current_app, jsonify as flask_jsonify, request

from database.models import Lot, LotHistory, db
from routes.auth import get_current_user
from utils.soap_utils import parse_soap_payload, soap_response

lots_bp = Blueprint('lots', __name__)


def jsonify(payload, *args, **kwargs):
    status = kwargs.pop('status', 200)
    action = kwargs.pop('soap_action', 'LotsResponse')
    return soap_response(payload, action=action, status=status)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOTS_JSON_FILE = os.path.join(BASE_DIR, 'lots_data.json')
legacy_lots_db = {}

if os.path.exists(LOTS_JSON_FILE):
    try:
        with open(LOTS_JSON_FILE, 'r', encoding='utf-8') as f:
            legacy_lots_db = json.load(f)
    except Exception:
        legacy_lots_db = {}


def normalize_optional_float(value):
    if value in (None, ''):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def database_enabled():
    return bool(current_app.config.get('DATABASE_ENABLED'))


def database_required_response():
    if request.method in {'POST', 'PUT', 'PATCH', 'DELETE'}:
        return soap_response({"error": "PostgreSQL indisponible ou non configure"}, action="LotsResponse", status=503)
    return jsonify({"error": "PostgreSQL indisponible ou non configure"}), 503


def json_lot_to_database_payload(payload):
    composition = payload.get('composition') or {}
    return {
        "lot_id": payload.get('lot_id'),
        "site": payload.get('site'),
        "extraction_date": payload.get('extraction_date'),
        "status": payload.get('status'),
        "weight": normalize_optional_float(payload.get('weight')),
        "cu_grade": normalize_optional_float(composition.get('cu')),
        "co_grade": normalize_optional_float(composition.get('co')),
        "fe_grade": normalize_optional_float(composition.get('fe')),
        "s_grade": normalize_optional_float(composition.get('s')),
        "ni_grade": normalize_optional_float(composition.get('ni')),
        "silica_grade": normalize_optional_float(composition.get('silica')),
        "token_id": payload.get('token_id'),
        "tx_hash": payload.get('tx_hash'),
        "block_number": payload.get('block_number'),
        "contract_address": payload.get('contract_address'),
        "certificate_id": payload.get('certificate_id'),
        "owner_user_id": payload.get('owner_user_id'),
        "owner_username": payload.get('owner_username'),
        "owner_name": payload.get('owner_name'),
        "geological_origin": payload.get('geological_origin'),
        "texture": payload.get('texture'),
    }


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
    return {
        "lot_id": lot.lot_id,
        "site": lot.site,
        "created_at": lot.created_at.isoformat() if lot.created_at else None,
        "updated_at": lot.updated_at.isoformat() if lot.updated_at else None,
        "extraction_date": lot.extraction_date.isoformat() if lot.extraction_date else None,
        "analyzed_at": lot.analyzed_at.isoformat() if lot.analyzed_at else None,
        "status": lot.status,
        "weight": lot.weight,
        "geological_origin": lot.geological_origin,
        "texture": lot.texture,
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
        "regulator_validated": lot.regulator_validated,
        "regulator_validated_at": lot.regulator_validated_at.isoformat() if lot.regulator_validated_at else None,
        "storage": "postgres",
    }


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

    lot.status = data.get('status', lot.status or 'CREE')
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
    lot.geological_origin = data.get('geological_origin', lot.geological_origin)
    lot.texture = data.get('texture', lot.texture)
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
            details=history_extra or {},
        ))

    db.session.commit()
    return lot


def get_lot_record(lot_id, sync_json_to_db=False):
    if not database_enabled():
        return None

    db_lot = Lot.query.filter_by(lot_id=lot_id).first()
    if db_lot:
        return db_lot

    if not sync_json_to_db:
        return None

    json_lot = legacy_lots_db.get(lot_id)
    if not json_lot:
        return None

    return upsert_database_lot(
        json_lot_to_database_payload(json_lot),
        history_event='SYNCED_FROM_JSON',
        history_extra={"source": "legacy_json_store"},
    )


def migrate_json_store_to_database():
    if not current_app.config.get('DATABASE_CONFIGURED'):
        return 0

    migrated = 0
    for lot_id, payload in legacy_lots_db.items():
        if Lot.query.filter_by(lot_id=lot_id).first():
            continue
        upsert_database_lot(
            json_lot_to_database_payload(payload),
            history_event='SYNCED_FROM_JSON',
            history_extra={"source": "legacy_json_store"},
        )
        migrated += 1
    return migrated


@lots_bp.route('/lots', methods=['GET'])
def get_all_lots():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentification requise"}), 401
    if not database_enabled():
        return database_required_response()

    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 20))
    site = request.args.get('site')
    status = request.args.get('status')

    lots_list = [db_lot_to_payload(item) for item in Lot.query.order_by(Lot.created_at.desc()).all()]

    if user.get('role') == 'producer':
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
        "lots": lots_list[start:end],
    })


@lots_bp.route('/lots/<lot_id>', methods=['GET'])
def get_lot(lot_id):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentification requise"}), 401
    if not database_enabled():
        return database_required_response()

    lot = Lot.query.filter_by(lot_id=lot_id).first()
    if not lot:
        return jsonify({"error": "Lot non trouve"}), 404

    payload = db_lot_to_payload(lot)
    if not can_access_lot(user, payload):
        return jsonify({"error": "Acces refuse"}), 403
    return jsonify(redact_history_for_user(user, payload))


@lots_bp.route('/lots', methods=['POST'])
def create_lot():
    data = parse_soap_payload("CreateLotRequest")
    user = get_current_user()

    if not user:
        return soap_response({"error": "Authentification requise"}, action="CreateLotResponse", status=401)
    if not database_enabled():
        return database_required_response()
    if 'lot_id' not in data:
        return soap_response({"error": "lot_id requis"}, action="CreateLotResponse", status=400)

    lot_id = data['lot_id']
    if Lot.query.filter_by(lot_id=lot_id).first():
        return soap_response({"error": "Lot existe deja"}, action="CreateLotResponse", status=409)

    created_lot = upsert_database_lot(
        {
            **data,
            "owner_user_id": user.get('id'),
            "owner_username": user.get('username'),
            "owner_name": user.get('name'),
        },
        history_event='CREATED',
        history_extra={"source": "postgres"},
    )

    return soap_response(db_lot_to_payload(created_lot), action="CreateLotResponse", status=201)


@lots_bp.route('/lots/<lot_id>/certify', methods=['POST'])
def certify_lot(lot_id):
    user = get_current_user()
    if not user:
        return soap_response({"error": "Authentification requise"}, action="CertifyLotResponse", status=401)
    if not database_enabled():
        return database_required_response()
    parse_soap_payload("CertifyLotRequest")

    lot = Lot.query.filter_by(lot_id=lot_id).first()
    if not lot:
        return soap_response({"error": "Lot non trouve"}, action="CertifyLotResponse", status=404)

    payload = db_lot_to_payload(lot)
    if user.get('role') == 'producer' and not can_access_lot(user, payload):
        return soap_response({"error": "Acces refuse"}, action="CertifyLotResponse", status=403)

    data = parse_soap_payload("CertifyLotRequest")
    certificate_id = data.get('certificate_id', f"CERT-{lot_id}")

    updated_lot = upsert_database_lot(
        {
            "lot_id": lot_id,
            "site": lot.site,
            "status": "CERTIFIE",
            "certificate_id": certificate_id,
            "owner_user_id": lot.owner_user_id,
            "owner_username": lot.owner_username,
            "owner_name": lot.owner_name,
        },
        history_event='CERTIFIED',
        history_extra={"certificate_id": certificate_id},
    )

    return soap_response(db_lot_to_payload(updated_lot), action="CertifyLotResponse")
