# routes/lots.py
from flask import Blueprint, request, jsonify
from datetime import datetime
import json
import os

lots_bp = Blueprint('lots', __name__)

# Base de données
lots_db_file = 'lots_data.json'
lots_db = {}

# Charger données existantes
if os.path.exists(lots_db_file):
    try:
        with open(lots_db_file, 'r', encoding='utf-8') as f:
            lots_db = json.load(f)
    except:
        lots_db = {}

@lots_bp.route('/lots', methods=['GET'])
def get_all_lots():
    """Liste tous les lots"""
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 20))
    site = request.args.get('site')
    status = request.args.get('status')
    
    # Filtrer
    lots_list = list(lots_db.values())
    if site:
        lots_list = [l for l in lots_list if l.get('site') == site]
    if status:
        lots_list = [l for l in lots_list if l.get('status') == status]
    
    # Paginer
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
    """Détail d'un lot"""
    lot = lots_db.get(lot_id)
    if lot:
        return jsonify(lot)
    return jsonify({"error": "Lot non trouvé"}), 404

@lots_bp.route('/lots', methods=['POST'])
def create_lot():
    """Crée un nouveau lot"""
    data = request.get_json()
    
    if not data or 'lot_id' not in data:
        return jsonify({"error": "lot_id requis"}), 400
    
    lot_id = data['lot_id']
    
    if lot_id in lots_db:
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
        "history": [{
            "event": "Création du lot",
            "timestamp": datetime.now().isoformat(),
            "user": "system"
        }]
    }
    
    lots_db[lot_id] = new_lot
    
    with open(lots_db_file, 'w', encoding='utf-8') as f:
        json.dump(lots_db, f, indent=2, ensure_ascii=False)
    
    return jsonify(new_lot), 201

@lots_bp.route('/lots/<lot_id>/certify', methods=['POST'])
def certify_lot(lot_id):
    """Certifie un lot"""
    if lot_id not in lots_db:
        return jsonify({"error": "Lot non trouvé"}), 404
    
    data = request.get_json() or {}
    
    lots_db[lot_id]['status'] = "CERTIFIÉ"
    lots_db[lot_id]['certificate_id'] = data.get('certificate_id', f"CERT-{lot_id}")
    lots_db[lot_id]['updated_at'] = datetime.now().isoformat()
    lots_db[lot_id]['history'].append({
        "event": "Certification",
        "timestamp": datetime.now().isoformat(),
        "certificate_id": lots_db[lot_id]['certificate_id']
    })
    
    with open(lots_db_file, 'w', encoding='utf-8') as f:
        json.dump(lots_db, f, indent=2, ensure_ascii=False)
    
    return jsonify(lots_db[lot_id])