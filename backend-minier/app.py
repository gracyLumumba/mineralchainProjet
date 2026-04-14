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

from routes.analyze import analyze_bp
from routes.lots import lots_bp
from routes.certify import certify_bp
from routes.blockchain import blockchain_bp
from routes.auth import auth_bp
from routes.validate import validate_bp
from routes.cache import cache_bp
from models.load_models import model_loader
from routes.ipfs import ipfs_bp
from database.models import db

load_dotenv()

# Créer l'application Flask
app = Flask(__name__)
CORS(app)  # Permet les requêtes depuis React

BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent
DEFAULT_SQLITE_PATH = BASE_DIR / 'instance' / 'mineralchain.sqlite'
DEFAULT_SQLITE_PATH.parent.mkdir(parents=True, exist_ok=True)

database_url = (os.environ.get('DATABASE_URL') or os.environ.get('SQLALCHEMY_DATABASE_URI') or '').strip()
fallback_database_url = f"sqlite:///{DEFAULT_SQLITE_PATH.as_posix()}"
app.config['SQLALCHEMY_DATABASE_URI'] = database_url or fallback_database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['DATABASE_ENABLED'] = True
app.config['DATABASE_URL_MASKED'] = (
    database_url.rsplit('@', 1)[-1] if database_url and '@' in database_url else app.config['SQLALCHEMY_DATABASE_URI']
)

db.init_app(app)

# Charger les modèles au démarrage
print("="*60)
print("🚀 DÉMARRAGE DU BACKEND IA MINIER")
print("="*60)

# Chemin vers vos modèles
DEFAULT_MODEL_PATH = PROJECT_DIR / 'modele_ia_minier' / 'modeles'
MODEL_PATH = Path(os.environ.get('MODEL_PATH', str(DEFAULT_MODEL_PATH))).expanduser()
print(f"[IA] Model path: {MODEL_PATH}")
model_loader.model_dir = str(MODEL_PATH)
model_loader.load_all()

try:
    with app.app_context():
        db.create_all()
        db.session.execute(db.text("ALTER TABLE lots ADD COLUMN IF NOT EXISTS owner_user_id VARCHAR(80)"))
        db.session.execute(db.text("ALTER TABLE lots ADD COLUMN IF NOT EXISTS owner_username VARCHAR(80)"))
        db.session.execute(db.text("ALTER TABLE lots ADD COLUMN IF NOT EXISTS owner_name VARCHAR(120)"))
        db.session.commit()
    if database_url:
        print(f"[DB] PostgreSQL actif: {app.config['DATABASE_URL_MASKED']}")
    else:
        print(f"[DB] SQLite local actif: {DEFAULT_SQLITE_PATH}")
except Exception as error:
    app.config['DATABASE_ENABLED'] = False
    print(f"[DB] Connexion base impossible: {error}")


# Enregistrer les blueprints
app.register_blueprint(analyze_bp, url_prefix='/api')
app.register_blueprint(lots_bp, url_prefix='/api')
app.register_blueprint(certify_bp, url_prefix='/api')
app.register_blueprint(ipfs_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(validate_bp, url_prefix='/api')
app.register_blueprint(cache_bp, url_prefix='/api')
app.register_blueprint(blockchain_bp, url_prefix='/api/blockchain')

@app.route('/api/health', methods=['GET'])
def health():
    database_status = {
        "enabled": app.config.get('DATABASE_ENABLED', False),
        "configured": bool(database_url),
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
    return jsonify({
        "name": "API IA Minière",
        "version": "1.0.0",
        "status": "online",
        "endpoints": [
            "/",
            "/api/health",
            "/api/auth/login (POST)",
            "/api/auth/register (POST)",
            "/api/analyze (POST)",
            "/api/analyze-and-certify (POST)",
            "/api/lots (GET, POST)",
            "/api/lots/<lot_id> (GET)",
            "/api/lots/<lot_id>/certify (POST)",
            "/api/lots/<lot_id>/auto-validate (POST)",
            "/api/status (GET)",
            "/api/contract-info (GET)",
            "/api/ipfs-status (GET)",
            "/api/token/<token_id> (GET)",
            "/api/verify (GET)",
            "/api/blockchain/status (GET)"
        ]
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"\n✅ Serveur démarré sur http://localhost:{port}")
    print("🔍 Pour tester: http://localhost:5000/api/health")
    print("="*60)
    app.run(host='0.0.0.0', port=port, debug=False, use_reloader=False)
