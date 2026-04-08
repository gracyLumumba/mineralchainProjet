import base64
import hashlib
import hmac
import json
import os
import uuid
from datetime import datetime

from flask import Blueprint, jsonify, request

auth_bp = Blueprint('auth', __name__)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
USERS_FILE = os.path.join(BASE_DIR, 'users_data.json')
AUTH_SECRET = os.getenv('AUTH_SECRET', 'mineralchain-mobile-secret').encode('utf-8')


def hash_password(password):
    value = 0
    for char in password:
        value = ((value * 31) + ord(char)) & 0xFFFFFFFF
    return f"mc_{abs(value):x}_{len(password)}"


DEMO_USERS = [
    {
        "id": "demo-admin-001",
        "username": "admin",
        "email": "admin@mineralchain.cd",
        "password": hash_password("Admin2025!"),
        "full_name": "Administrateur Systeme",
        "role": "admin",
        "organization": "MineralChain",
        "site": "Kamoa-Kansoko",
        "account_status": "approved",
        "created_at": "2025-01-01T00:00:00",
    },
    {
        "id": "demo-producer-001",
        "username": "producteur",
        "email": "producteur@kamoa.cd",
        "password": hash_password("Demo2025!"),
        "full_name": "Jean-Baptiste Mutombo",
        "role": "producer",
        "organization": "KAMOA-KANSOKO Mining",
        "site": "Kamoa-Kansoko",
        "account_status": "approved",
        "created_at": "2025-01-01T00:00:00",
    },
    {
        "id": "demo-regulator-001",
        "username": "regulateur",
        "email": "regulateur@dgmr.gouv.cd",
        "password": hash_password("Demo2025!"),
        "full_name": "Marie-Claire Kabongo",
        "role": "regulator",
        "organization": "DGMR",
        "site": "Kamoa-Kansoko",
        "account_status": "approved",
        "created_at": "2025-01-01T00:00:00",
    },
    {
        "id": "demo-transporter-001",
        "username": "transporteur",
        "email": "transport@mininglogistics.cd",
        "password": hash_password("Demo2025!"),
        "full_name": "Pierre Lukusa",
        "role": "transporter",
        "organization": "Katanga Mineral Transit",
        "site": "Kamoa-Kansoko",
        "account_status": "approved",
        "created_at": "2025-01-01T00:00:00",
    },
]


def load_registered_users():
    if not os.path.exists(USERS_FILE):
        return []
    try:
        with open(USERS_FILE, 'r', encoding='utf-8') as handle:
            data = json.load(handle)
            return data if isinstance(data, list) else []
    except Exception:
        return []


def save_registered_users(users):
    with open(USERS_FILE, 'w', encoding='utf-8') as handle:
        json.dump(users, handle, ensure_ascii=False, indent=2)


def get_all_users():
    return [*DEMO_USERS, *load_registered_users()]


def serialize_user(user):
    return {
        "id": user["id"],
        "username": user["username"],
        "email": user["email"],
        "name": user["full_name"],
        "role": user["role"],
        "organization": user["organization"],
        "site": user["site"],
        "account_status": user.get("account_status", "approved"),
    }


def create_token(user):
    payload = json.dumps({
        "id": user["id"],
        "username": user["username"],
        "role": user["role"],
        "site": user["site"],
        "ts": datetime.utcnow().isoformat(),
    }, separators=(',', ':')).encode('utf-8')
    signature = hmac.new(AUTH_SECRET, payload, hashlib.sha256).hexdigest().encode('utf-8')
    return f"{base64.urlsafe_b64encode(payload).decode('utf-8')}.{signature.decode('utf-8')}"


def verify_token(token):
    try:
        encoded_payload, signature = token.split('.', 1)
        payload = base64.urlsafe_b64decode(encoded_payload.encode('utf-8'))
        expected = hmac.new(AUTH_SECRET, payload, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected):
            return None
        return json.loads(payload.decode('utf-8'))
    except Exception:
        return None


def get_current_user():
    auth_header = request.headers.get('Authorization', '').strip()
    if not auth_header.startswith('Bearer '):
        return None

    token = auth_header.split(' ', 1)[1].strip()
    payload = verify_token(token)
    if not payload:
        return None

    user = next((item for item in get_all_users() if item["id"] == payload.get("id")), None)
    if not user or user.get("account_status") != "approved":
        return None
    return serialize_user(user)


def ensure_admin_user():
    current_user = get_current_user()
    if not current_user:
        return None, (jsonify({"error": "Authentification requise"}), 401)
    if current_user.get("role") != "admin":
        return None, (jsonify({"error": "Acces admin requis"}), 403)
    return current_user, None


@auth_bp.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    identifier = str(data.get('identifier', '')).strip().lower()
    password = str(data.get('password', ''))

    if not identifier or not password:
        return jsonify({"error": "identifier et password requis"}), 400

    user = next(
        (
            item for item in get_all_users()
            if item["account_status"] == "approved"
            and (item["email"] == identifier or item["username"] == identifier)
            and item["password"] == hash_password(password)
        ),
        None,
    )

    if not user:
        return jsonify({"error": "Identifiants invalides"}), 401

    return jsonify({
        "success": True,
        "token": create_token(user),
        "user": serialize_user(user),
    })


@auth_bp.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    full_name = str(data.get('full_name', '')).strip()
    username = str(data.get('username', '')).strip().lower()
    email = str(data.get('email', '')).strip().lower()
    password = str(data.get('password', ''))
    role = str(data.get('role', 'producer')).strip().lower()
    organization = str(data.get('organization', '')).strip()
    site = str(data.get('site', 'Kamoa-Kansoko')).strip() or 'Kamoa-Kansoko'

    if not full_name or len(username) < 3 or '@' not in email or len(password) < 6 or not organization:
        return jsonify({"error": "Données d'inscription invalides"}), 400

    if role not in {'producer', 'regulator', 'transporter'}:
        return jsonify({"error": "Rôle invalide"}), 400

    existing_users = get_all_users()
    if any(user["email"] == email for user in existing_users):
        return jsonify({"error": "Cet email est déjà utilisé"}), 409
    if any(user["username"] == username for user in existing_users):
        return jsonify({"error": "Ce nom d'utilisateur est déjà utilisé"}), 409

    new_user = {
        "id": f"user-{uuid.uuid4().hex[:10]}",
        "username": username,
        "email": email,
        "password": hash_password(password),
        "full_name": full_name,
        "role": role,
        "organization": organization,
        "site": site,
        "account_status": "pending",
        "created_at": datetime.utcnow().isoformat(),
    }

    registered_users = load_registered_users()
    registered_users.append(new_user)
    save_registered_users(registered_users)

    return jsonify({
        "success": True,
        "message": "Compte créé. En attente d'approbation.",
        "user": serialize_user(new_user),
    }), 201


@auth_bp.route('/auth/users', methods=['GET'])
def list_users():
    current_user, error_response = ensure_admin_user()
    if error_response:
        return error_response

    users = sorted(
        get_all_users(),
        key=lambda user: user.get("created_at") or "",
        reverse=True,
    )
    return jsonify({
        "success": True,
        "requested_by": current_user["id"],
        "users": [serialize_user(user) for user in users],
    })


def update_registered_user(user_id, transform):
    registered_users = load_registered_users()
    target_user = None

    for user in registered_users:
        if user["id"] == user_id:
            transform(user)
            target_user = user
            break

    if not target_user:
        return None

    save_registered_users(registered_users)
    return target_user


@auth_bp.route('/auth/users/<user_id>/approve', methods=['POST'])
def approve_user(user_id):
    current_user, error_response = ensure_admin_user()
    if error_response:
        return error_response

    user = update_registered_user(
        user_id,
        lambda item: item.update({
            "account_status": "approved",
            "approved_at": datetime.utcnow().isoformat(),
            "approved_by": current_user["id"],
            "rejection_reason": None,
        }),
    )
    if not user:
        return jsonify({"error": "Utilisateur introuvable ou non modifiable"}), 404

    return jsonify({"success": True, "user": serialize_user(user)})


@auth_bp.route('/auth/users/<user_id>/reject', methods=['POST'])
def reject_user(user_id):
    current_user, error_response = ensure_admin_user()
    if error_response:
        return error_response

    payload = request.get_json() or {}
    reason = str(payload.get("reason", "")).strip() or "Demande refusee"
    user = update_registered_user(
        user_id,
        lambda item: item.update({
            "account_status": "rejected",
            "approved_at": datetime.utcnow().isoformat(),
            "approved_by": current_user["id"],
            "rejection_reason": reason,
        }),
    )
    if not user:
        return jsonify({"error": "Utilisateur introuvable ou non modifiable"}), 404

    return jsonify({"success": True, "user": serialize_user(user)})


@auth_bp.route('/auth/users/<user_id>/revoke', methods=['POST'])
def revoke_user(user_id):
    current_user, error_response = ensure_admin_user()
    if error_response:
        return error_response

    user = update_registered_user(
        user_id,
        lambda item: item.update({
            "account_status": "pending",
            "approved_at": None,
            "approved_by": None,
        }),
    )
    if not user:
        return jsonify({"error": "Utilisateur introuvable ou non modifiable"}), 404

    return jsonify({"success": True, "user": serialize_user(user)})
