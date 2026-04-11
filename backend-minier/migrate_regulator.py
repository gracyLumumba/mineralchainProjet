# Migration script pour ajouter les colonnes de validation régulateur
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app import app, db

with app.app_context():
    try:
        # Ajouter les colonnes si elles n'existent pas
        db.session.execute(db.text("ALTER TABLE lots ADD COLUMN IF NOT EXISTS regulator_validated BOOLEAN DEFAULT FALSE"))
        db.session.execute(db.text("ALTER TABLE lots ADD COLUMN IF NOT EXISTS regulator_validated_at TIMESTAMP"))
        db.session.commit()
        print("Migration réussie: colonnes regulator_validated et regulator_validated_at ajoutées")
    except Exception as e:
        print(f"Erreur migration: {e}")
        db.session.rollback()
