import os
from datetime import datetime, timezone, timedelta
from app import app, db
from database.models import Lot

def seed_lots():
    with app.app_context():
        # Coordonnées du producteur démo (pour que les lots lui appartiennent)
        owner_id = "demo-producer-001"
        owner_un = "producteur"
        owner_name = "Jean-Baptiste Mutombo"
        
        print("Initialisation des lots de test...")

        # 1. Un lot tout neuf (Prêt à être certifié)
        lot1_id = "KAMOA-DEMO-001"
        if not Lot.query.filter_by(lot_id=lot1_id).first():
            lot1 = Lot(
                lot_id=lot1_id,
                site="KAMOA",
                extraction_date=datetime.now(timezone.utc).date(),
                status="À VÉRIFIER",
                mineral_type="copper",
                weight=25.0,
                cu_grade=3.8,
                co_grade=0.15,
                owner_user_id=owner_id,
                owner_username=owner_un,
                owner_name=owner_name,
                created_at=datetime.now(timezone.utc) - timedelta(hours=12)
            )
            db.session.add(lot1)
            print(f"  [+] {lot1_id} créé (Flux Producteur)")

        # 2. Un lot certifié (Prêt pour la validation DGMR)
        lot2_id = "KANSOKO-DEMO-002"
        if not Lot.query.filter_by(lot_id=lot2_id).first():
            lot2 = Lot(
                lot_id=lot2_id,
                site="KANSOKO",
                extraction_date=datetime.now(timezone.utc).date() - timedelta(days=1),
                status="AUTHENTIQUE",
                mineral_type="cobalt",
                weight=12.4,
                co_grade=2.5,
                token_id=999,
                regulator_validated=False, # En attente DGMR
                owner_user_id=owner_id,
                owner_username=owner_un,
                owner_name=owner_name,
                created_at=datetime.now(timezone.utc) - timedelta(days=1)
            )
            db.session.add(lot2)
            print(f"  [+] {lot2_id} créé (Flux Régulateur)")

        # 3. Un lot validé (Prêt pour le Transporteur Eliel Ilunga)
        lot3_id = "KCC-DEMO-003"
        if not Lot.query.filter_by(lot_id=lot3_id).first():
            lot3 = Lot(
                lot_id=lot3_id,
                site="KCC",
                extraction_date=datetime.now(timezone.utc).date() - timedelta(days=2),
                status="AUTHENTIQUE",
                mineral_type="mixed",
                weight=30.0,
                token_id=1000,
                regulator_validated=True, # Validé par DGMR
                regulator_validated_at=datetime.now(timezone.utc) - timedelta(hours=2),
                owner_user_id=owner_id,
                owner_username=owner_un,
                owner_name=owner_name,
                created_at=datetime.now(timezone.utc) - timedelta(days=2)
            )
            db.session.add(lot3)
            print(f"  [+] {lot3_id} créé (Flux Transporteur)")

        db.session.commit()
        print("\nSeed terminé avec succès !")

if __name__ == "__main__":
    seed_lots()