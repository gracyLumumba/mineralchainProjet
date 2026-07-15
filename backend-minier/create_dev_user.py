import os
from app import app
from database.models import db, User
from werkzeug.security import generate_password_hash


def create_test_user():
    with app.app_context():
        # Coordonnées demandées
        username = "eliel_ao"
        email = "elielao@gmail.com"
        password = os.getenv("CREATE_DEV_USER_PASSWORD")

        if not password:
            raise SystemExit(
                "CREATE_DEV_USER_PASSWORD manquant. Definis un mot de passe de test avant d'executer ce script."
            )
        
        # Vérifier si l'utilisateur existe déjà
        user = User.query.filter((User.username == username) | (User.email == email)).first()
        
        if not user:
            print(f"Création de l'utilisateur {username}...")
            new_user = User(
                full_name="Eliel Ilunga",
                username="eliel_trans",
                email="eliel_trans@mineralchain.cd",
                password=generate_password_hash(password),
                organization="sous traitances",
                role="transporter",  # Rôle Transporteur
                is_approved=True  # Approuvé directement pour éviter de passer par l'admin
            )
            db.session.add(new_user)
            db.session.commit()
            print("Succès : Compte Transporteur créé ! Connectez-vous avec 'eliel_trans'.")
        else:
            print(f"Info : L'utilisateur {username} existe déjà dans la base de données.")

if __name__ == "__main__":
    create_test_user()
