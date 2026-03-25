# database/models.py
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Lot(db.Model):
    __tablename__ = 'lots'
    
    id = db.Column(db.Integer, primary_key=True)
    lot_id = db.Column(db.String(50), unique=True, nullable=False, index=True)
    site = db.Column(db.String(20), nullable=False)
    extraction_date = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    analyzed_at = db.Column(db.DateTime)
    
    # Composition chimique
    cu_grade = db.Column(db.Float)
    co_grade = db.Column(db.Float)
    fe_grade = db.Column(db.Float)
    ni_grade = db.Column(db.Float)
    s_grade = db.Column(db.Float)
    silica_grade = db.Column(db.Float)
    
    # Propriétés physiques
    density = db.Column(db.Float)
    moisture = db.Column(db.Float)
    hardness = db.Column(db.Float)
    weight = db.Column(db.Float)
    
    # Résultats IA
    mineral_type = db.Column(db.String(20))
    confidence = db.Column(db.Float)
    impurity_level = db.Column(db.String(20))
    is_fraud = db.Column(db.Boolean, default=False)
    status = db.Column(db.String(20))
    
    # Blockchain (peut être NULL si non certifié)
    token_id = db.Column(db.Integer, unique=True)
    tx_hash = db.Column(db.String(100), unique=True)
    block_number = db.Column(db.Integer)
    contract_address = db.Column(db.String(100))
    
    # Relations
    history = db.relationship('LotHistory', backref='lot', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'lot_id': self.lot_id,
            'site': self.site,
            'extraction_date': self.extraction_date.isoformat() if self.extraction_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'analyzed_at': self.analyzed_at.isoformat() if self.analyzed_at else None,
            'cu_grade': self.cu_grade,
            'co_grade': self.co_grade,
            'mineral_type': self.mineral_type,
            'confidence': self.confidence,
            'status': self.status,
            'is_fraud': self.is_fraud,
            'token_id': self.token_id,
            'tx_hash': self.tx_hash
        }

class LotHistory(db.Model):
    __tablename__ = 'lot_history'
    
    id = db.Column(db.Integer, primary_key=True)
    lot_id = db.Column(db.Integer, db.ForeignKey('lots.id'), nullable=False)
    event = db.Column(db.String(50), nullable=False)  # 'CREATED', 'ANALYZED', 'CERTIFIED', 'TRANSFERRED'
    status = db.Column(db.String(20))
    details = db.Column(db.JSON)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'event': self.event,
            'status': self.status,
            'details': self.details,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }

class Alert(db.Model):
    __tablename__ = 'alerts'
    
    id = db.Column(db.Integer, primary_key=True)
    lot_id = db.Column(db.Integer, db.ForeignKey('lots.id'))
    type = db.Column(db.String(50))  # 'FRAUD', 'SUSPECT', 'ANOMALY'
    message = db.Column(db.String(200))
    severity = db.Column(db.String(20))  # 'HIGH', 'MEDIUM', 'LOW'
    resolved = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    resolved_at = db.Column(db.DateTime)
