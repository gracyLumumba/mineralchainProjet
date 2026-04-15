# app.py

import os
import sys
from pathlib import Path

# Force UTF-8 before importing modules that print Unicode at import time.
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from sqlalchemy import inspect

from routes.analyze import analyze_bp
from routes.lots import lots_bp, migrate_json_store_to_database
from routes.auth import auth_bp
from routes.validate import validate_bp
from routes.cache import cache_bp
from models.load_models import model_loader
from database.models import db

# Imports optionnels (blockchain)
try:
    from routes.certify import certify_bp
    CERTIFY_AVAILABLE = True
except ImportError as e:
    print(f"[WARN] Module certify non disponible: {e}")
    CERTIFY_AVAILABLE = False
    certify_bp = None

try:
    from routes.blockchain import blockchain_bp
    BLOCKCHAIN_AVAILABLE = True
except ImportError as e:
    print(f"[WARN] Module blockchain non disponible: {e}")
    BLOCKCHAIN_AVAILABLE = False
    blockchain_bp = None

try:
    from routes.ipfs import ipfs_bp
    IPFS_AVAILABLE = True
except ImportError as e:
    print(f"[WARN] Module IPFS non disponible: {e}")
    IPFS_AVAILABLE = False
    ipfs_bp = None

load_dotenv()

app = Flask(__name__)

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
        }
    },
)

BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent

database_url = (os.environ.get('DATABASE_URL') or os.environ.get('SQLALCHEMY_DATABASE_URI') or '').strip()
if database_url.startswith('postgres://'):
    database_url = f"postgresql://{database_url[len('postgres://'):]}"

app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['DATABASE_ENABLED'] = False
app.config['DATABASE_CONFIGURED'] = bool(database_url)
app.config['DATABASE_URL_MASKED'] = (
    database_url.rsplit('@', 1)[-1] if database_url and '@' in database_url else (database_url or None)
)

db.init_app(app)

print("=" * 60)
print("DEMARRAGE DU BACKEND IA MINIER")
print("=" * 60)

DEFAULT_MODEL_PATH = PROJECT_DIR / 'modele_ia_minier' / 'modeles'
MODEL_PATH = Path(os.environ.get('MODEL_PATH', str(DEFAULT_MODEL_PATH))).expanduser()
print(f"[IA] Model path: {MODEL_PATH}")
model_loader.model_dir = str(MODEL_PATH)
model_loader.load_all()

if not database_url:
    print("[DB] DATABASE_URL manquant. Configurez PostgreSQL dans le fichier .env.")
else:
    try:
        with app.app_context():
            db.create_all()
            inspector = inspect(db.engine)
            existing_tables = set(inspector.get_table_names())
            if 'lots' in existing_tables:
                existing_columns = {column['name'] for column in inspector.get_columns('lots')}
                pending_columns = [
                    ('owner_user_id', "ALTER TABLE lots ADD COLUMN owner_user_id VARCHAR(80)"),
                    ('owner_username', "ALTER TABLE lots ADD COLUMN owner_username VARCHAR(80)"),
                    ('owner_name', "ALTER TABLE lots ADD COLUMN owner_name VARCHAR(120)"),
                    ('regulator_validated', "ALTER TABLE lots ADD COLUMN regulator_validated BOOLEAN DEFAULT FALSE"),
                    ('regulator_validated_at', "ALTER TABLE lots ADD COLUMN regulator_validated_at TIMESTAMP"),
                ]
                for column_name, statement in pending_columns:
                    if column_name not in existing_columns:
                        db.session.execute(db.text(statement))
                db.session.commit()

            migrated = migrate_json_store_to_database()
            app.config['DATABASE_ENABLED'] = True

        print(f"[DB] PostgreSQL actif: {app.config['DATABASE_URL_MASKED']}")
        if migrated:
            print(f"[DB] Migration JSON -> PostgreSQL terminee: {migrated} lot(s)")
    except Exception as error:
        app.config['DATABASE_ENABLED'] = False
        print(f"[DB] Connexion PostgreSQL impossible: {error}")


app.register_blueprint(analyze_bp, url_prefix='/api')
app.register_blueprint(lots_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(validate_bp, url_prefix='/api')
app.register_blueprint(cache_bp, url_prefix='/api')

if CERTIFY_AVAILABLE and certify_bp:
    app.register_blueprint(certify_bp, url_prefix='/api')
if IPFS_AVAILABLE and ipfs_bp:
    app.register_blueprint(ipfs_bp, url_prefix='/api')
if BLOCKCHAIN_AVAILABLE and blockchain_bp:
    app.register_blueprint(blockchain_bp, url_prefix='/api/blockchain')


@app.route('/api/health', methods=['GET'])
def health():
    database_status = {
        "enabled": app.config.get('DATABASE_ENABLED', False),
        "configured": app.config.get('DATABASE_CONFIGURED', False),
    }
    if app.config.get('DATABASE_ENABLED'):
        try:
            db.session.execute(db.text('SELECT 1'))
            database_status["connected"] = True
        except Exception as error:
            database_status["connected"] = False
            database_status["error"] = str(error)
    else:
        database_status["connected"] = False

    return jsonify({
        "status": "ok",
        "database": database_status,
        "models_loaded": True,
    })


@app.route('/', methods=['GET'])
def home():
    endpoints = [
        "/",
        "/api/health",
        "/api/auth/login (POST)",
        "/api/auth/register (POST)",
        "/api/analyze (POST)",
        "/api/lots (GET, POST)",
        "/api/lots/<lot_id> (GET)",
        "/api/lots/<lot_id>/auto-validate (POST)",
        "/api/status (GET)",
    ]

    if CERTIFY_AVAILABLE:
        endpoints.append("/api/analyze-and-certify (POST)")
        endpoints.append("/api/lots/<lot_id>/certify (POST)")

    if BLOCKCHAIN_AVAILABLE:
        endpoints.append("/api/contract-info (GET)")
        endpoints.append("/api/blockchain/status (GET)")

    if IPFS_AVAILABLE:
        endpoints.append("/api/ipfs-status (GET)")
        endpoints.append("/api/token/<token_id> (GET)")
        endpoints.append("/api/verify (GET)")

    return jsonify({
        "name": "API IA Miniere",
        "version": "1.0.0",
        "status": "online",
        "certify_available": CERTIFY_AVAILABLE,
        "blockchain_available": BLOCKCHAIN_AVAILABLE,
        "ipfs_available": IPFS_AVAILABLE,
        "endpoints": endpoints,
    })


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"\n[OK] Serveur demarre sur http://localhost:{port}")
    print("[INFO] Pour tester: http://localhost:5000/api/health")
    print("[MODULES] Disponibles:")
    print(f"   - Certify: {'OK' if CERTIFY_AVAILABLE else 'INDISPONIBLE'}")
    print(f"   - Blockchain: {'OK' if BLOCKCHAIN_AVAILABLE else 'INDISPONIBLE'}")
    print(f"   - IPFS: {'OK' if IPFS_AVAILABLE else 'INDISPONIBLE'}")
    print("=" * 60)
    try:
        app.run(host='0.0.0.0', port=port, debug=False, use_reloader=False, threaded=True)
    except OSError as e:
        if 'Address already in use' in str(e):
            print(f"\n[ERROR] Le port {port} est deja utilise!")
            print("   Tuez le processus ou changez le PORT dans .env")
        else:
            print(f"\n[ERROR] {e}")
        sys.exit(1)
