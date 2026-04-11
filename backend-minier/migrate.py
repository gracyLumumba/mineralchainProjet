#!/usr/bin/env python
import os
import sys

# Ajouter le répertoire courant au path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db

def migrate():
    with app.app_context():
        try:
            print("[MIGRATION] Ajout des colonnes de validation régulateur...")
            
            # Créer toutes les tables d'abord
            db.create_all()
            print("[MIGRATION] Tables créées")
            
            # Ajouter les colonnes
            db.session.execute(db.text("""
                ALTER TABLE lots 
                ADD COLUMN IF NOT EXISTS regulator_validated BOOLEAN DEFAULT FALSE
            """))
            print("[MIGRATION] Colonne regulator_validated ajoutée")
            
            db.session.execute(db.text("""
                ALTER TABLE lots 
                ADD COLUMN IF NOT EXISTS regulator_validated_at TIMESTAMP
            """))
            print("[MIGRATION] Colonne regulator_validated_at ajoutée")
            
            db.session.commit()
            print("[MIGRATION] Commit réussi")
            print("[MIGRATION] Migration terminée avec succès!")
            
        except Exception as e:
            db.session.rollback()
            print(f"[MIGRATION] Erreur: {e}")
            import traceback
            traceback.print_exc()

if __name__ == '__main__':
    migrate()
