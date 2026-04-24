import argparse
import sys

import requests


if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


BASE_URL = "http://localhost:5000/api"
DEFAULT_LOT_ID = "KAMOA-2604-432"
EXPORT_DIR = "experiments"


def parse_args():
    parser = argparse.ArgumentParser(description="Teste l'auto-validation DGMR et alimente les exports d'experimentation.")
    parser.add_argument("--lot-id", default=DEFAULT_LOT_ID, help="Identifiant du lot a valider")
    parser.add_argument("--user", default="regulateur", help="Identifiant du compte regulateur")
    parser.add_argument("--password", default="Demo2025!", help="Mot de passe du compte")
    parser.add_argument("--base-url", default=BASE_URL, help="Base URL de l'API backend")
    return parser.parse_args()


def main():
    args = parse_args()

    print("1. Login...")
    login_response = requests.post(f"{args.base_url}/auth/login", json={
        "identifier": args.user,
        "password": args.password,
    })

    if login_response.status_code != 200:
        print(f"Erreur login: {login_response.status_code}")
        print(login_response.text)
        raise SystemExit(1)

    token = login_response.json()["token"]
    print(f"OK Token obtenu: {token[:50]}...")

    print(f"\n2. Validation automatique du lot {args.lot_id}...")
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    validate_response = requests.post(
        f"{args.base_url}/lots/{args.lot_id}/auto-validate",
        headers=headers,
    )

    print(f"Status: {validate_response.status_code}")
    print(f"Response: {validate_response.text[:700]}")

    if validate_response.status_code == 200:
        result = validate_response.json()
        print("\nOK Validation reussie!")
        print(f"  - Status: {result.get('status')}")
        print(f"  - Message: {result.get('message')}")
        print(f"  - Parametres compares: {len(result.get('comparison', []))}")
        print(f"  - Export auto maj: {EXPORT_DIR}\\experimentation_results.xlsx")
        print(f"  - Export auto maj: {EXPORT_DIR}\\experimentation_summary.csv")
        print(f"  - Export auto maj: {EXPORT_DIR}\\experimentation_details.csv")
    else:
        print(f"\nERREUR {validate_response.status_code}")
        print(f"Les exports d'experimentation sont aussi mis a jour dans {EXPORT_DIR}\\")


if __name__ == "__main__":
    main()
