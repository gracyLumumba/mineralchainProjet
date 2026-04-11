#!/usr/bin/env python
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db
from database.models import Lot

lots_to_delete = [
    'KANSOKO-2603-805',
    'KAMOA-2603-482',
    'KAMOA-2603-755',
    'KAMOA-2603-810',
    'KAMOA-2603-523',
    'KANSOKO-2603-142',
]

with app.app_context():
    try:
        for lot_id in lots_to_delete:
            lot = Lot.query.filter_by(lot_id=lot_id).first()
            if lot:
                db.session.delete(lot)
                print(f"[DELETE] {lot_id} supprimé")
            else:
                print(f"[DELETE] {lot_id} non trouvé")
        
        db.session.commit()
        print(f"\n[DELETE] {len(lots_to_delete)} lots supprimés avec succès!")
        
    except Exception as e:
        db.session.rollback()
        print(f"[DELETE] Erreur: {e}")
        import traceback
        traceback.print_exc()
