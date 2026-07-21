# routes/database.py
from flask import Blueprint, request, jsonify as flask_jsonify
from database.models import db, Lot, LotHistory, Alert
from datetime import datetime
import sys
import os
from utils.soap_utils import soap_response

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

database_bp = Blueprint('database', __name__)


def jsonify(payload, *args, **kwargs):
    status = kwargs.pop('status', 200)
    action = kwargs.pop('soap_action', 'DatabaseResponse')
    return soap_response(payload, action=action, status=status)

@database_bp.route('/lots', methods=['GET'])
def get_all_lots():
    """Récupère tous les lots avec pagination"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    site = request.args.get('site')
    status = request.args.get('status')
    
    query = Lot.query
    
    if site:
        query = query.filter_by(site=site)
    if status:
        query = query.filter_by(status=status)
    
    lots = query.order_by(Lot.created_at.desc()).paginate(page=page, per_page=per_page)
    
    return jsonify({
        'total': lots.total,
        'page': lots.page,
        'pages': lots.pages,
        'lots': [lot.to_dict() for lot in lots.items]
    })

@database_bp.route('/lot/<lot_id>', methods=['GET'])
def get_lot(lot_id):
    """Récupère un lot par son ID"""
    lot = Lot.query.filter_by(lot_id=lot_id).first()
    if not lot:
        return jsonify({'error': 'Lot non trouvé'}), 404
    
    history = LotHistory.query.filter_by(lot_id=lot.id).order_by(LotHistory.timestamp).all()
    alerts = Alert.query.filter_by(lot_id=lot.id, resolved=False).all()
    
    return jsonify({
        'lot': lot.to_dict(),
        'history': [h.to_dict() for h in history],
        'alerts': [{'type': a.type, 'message': a.message} for a in alerts]
    })

@database_bp.route('/history/<lot_id>', methods=['GET'])
def get_lot_history(lot_id):
    """Récupère l'historique d'un lot"""
    lot = Lot.query.filter_by(lot_id=lot_id).first()
    if not lot:
        return jsonify({'error': 'Lot non trouvé'}), 404
    
    history = LotHistory.query.filter_by(lot_id=lot.id).order_by(LotHistory.timestamp).all()
    return jsonify([h.to_dict() for h in history])

@database_bp.route('/alerts', methods=['GET'])
def get_alerts():
    """Récupère toutes les alertes non résolues"""
    resolved = request.args.get('resolved', 'false').lower() == 'true'
    alerts = Alert.query.filter_by(resolved=resolved).order_by(Alert.created_at.desc()).all()
    
    return jsonify([{
        'id': a.id,
        'lot_id': Lot.query.get(a.lot_id).lot_id if a.lot_id else None,
        'type': a.type,
        'message': a.message,
        'severity': a.severity,
        'created_at': a.created_at.isoformat(),
        'resolved': a.resolved
    } for a in alerts])

@database_bp.route('/stats', methods=['GET'])
def get_stats():
    """Récupère les statistiques globales"""
    total_lots = Lot.query.count()
    certified = Lot.query.filter(Lot.token_id.isnot(None)).count()
    suspects = Lot.query.filter_by(status='SUSPECT').count()
    to_verify = Lot.query.filter_by(status='À VÉRIFIER').count()
    frauds = Lot.query.filter_by(is_fraud=True).count()
    
    return jsonify({
        'total_lots': total_lots,
        'certified': certified,
        'suspects': suspects,
        'to_verify': to_verify,
        'frauds': frauds,
        'auth_rate': round((certified / total_lots * 100), 1) if total_lots > 0 else 0
    })
