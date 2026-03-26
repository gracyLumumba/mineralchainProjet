from flask import Blueprint, jsonify, request

auth_bp = Blueprint('auth', __name__)


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
    },
]


def serialize_user(user):
    return {
        "id": user["id"],
        "username": user["username"],
        "email": user["email"],
        "name": user["full_name"],
        "role": user["role"],
        "organization": user["organization"],
        "site": user["site"],
    }


@auth_bp.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    identifier = str(data.get('identifier', '')).strip().lower()
    password = str(data.get('password', ''))

    if not identifier or not password:
        return jsonify({"error": "identifier et password requis"}), 400

    user = next(
        (
            item for item in DEMO_USERS
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
        "user": serialize_user(user),
    })
