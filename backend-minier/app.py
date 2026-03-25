# app.py

import os
import sys

# Force UTF-8 before importing modules that print Unicode at import time.
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

from flask import Flask, jsonify
from flask_cors import CORS

from routes.analyze import analyze_bp
from routes.lots import lots_bp
from routes.certify import certify_bp
from routes.blockchain import blockchain_bp
from models.load_models import model_loader
from routes.ipfs import ipfs_bp

# Créer l'application Flask
app = Flask(__name__)
CORS(app)  # Permet les requêtes depuis React

# Charger les modèles au démarrage
print("="*60)
print("🚀 DÉMARRAGE DU BACKEND IA MINIER")
print("="*60)

# Chemin vers vos modèles
MODEL_PATH = r"C:\Users\Dr_Denise\Desktop\Gracy\memoire\modele_ia_minier\modeles"
model_loader.model_dir = MODEL_PATH
model_loader.load_all()


# Enregistrer les blueprints
app.register_blueprint(analyze_bp, url_prefix='/api')
app.register_blueprint(lots_bp, url_prefix='/api')
app.register_blueprint(certify_bp, url_prefix='/api')
app.register_blueprint(ipfs_bp, url_prefix='/api')
app.register_blueprint(blockchain_bp, url_prefix='/api/blockchain')
@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "name": "API IA Minière",
        "version": "1.0.0",
        "status": "online",
        "endpoints": [
            "/api/health",
            "/api/analyze (POST)",
            "/api/analyze-and-certify (POST)",
            "/api/lots (GET, POST)",
            "/api/lots/<lot_id> (GET)",
            "/api/lots/<lot_id>/certify (POST)"
        ]
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"\n✅ Serveur démarré sur http://localhost:{port}")
    print("🔍 Pour tester: http://localhost:5000/api/health")
    print("="*60)
    app.run(host='0.0.0.0', port=port, debug=False, use_reloader=False)
