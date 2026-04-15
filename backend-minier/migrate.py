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
            
            # Ajouter les colonnes (compatible SQLite et PostgreSQL)
            import sqlalchemy
            dialect = db.engine.dialect.name
            
            for col_name, col_def in [
                ('regulator_validated', 'BOOLEAN DEFAULT FALSE'),
                ('regulator_validated_at', 'TIMESTAMP'),
            ]:
                try:
                    if dialect == 'sqlite':
                        db.session.execute(db.text(f'ALTER TABLE lots ADD COLUMN {col_name} {col_def}'))
                    else:
                        db.session.execute(db.text(f'ALTER TABLE lots ADD COLUMN IF NOT EXISTS {col_name} {col_def}'))
                    print(f"[MIGRATION] Colonne {col_name} ajoutée")
                except Exception as col_err:
                    if 'duplicate column' in str(col_err).lower() or 'already exists' in str(col_err).lower():
                        print(f"[MIGRATION] Colonne {col_name} existe déjà")
                    else:
                        raise
            
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
