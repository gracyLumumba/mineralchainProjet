import requests
import json
import sys

# Force UTF-8
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Configuration
BASE_URL = "http://localhost:5000/api"
LOT_ID = "KAMOA-2604-432"  # Remplacez par un vrai lot_id

# 1. Login en tant que régulateur
print("1. Login...")
login_response = requests.post(f"{BASE_URL}/auth/login", json={
    "identifier": "regulateur",
    "password": "Demo2025!"
})

if login_response.status_code != 200:
    print(f"Erreur login: {login_response.status_code}")
    print(login_response.text)
    exit(1)

token = login_response.json()["token"]
print(f"OK Token obtenu: {token[:50]}...")

# 2. Tester l'endpoint auto-validate
print(f"\n2. Validation automatique du lot {LOT_ID}...")
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

validate_response = requests.post(
    f"{BASE_URL}/lots/{LOT_ID}/auto-validate",
    headers=headers
)

print(f"Status: {validate_response.status_code}")
print(f"Response: {validate_response.text[:500]}")

if validate_response.status_code == 200:
    result = validate_response.json()
    print(f"\nOK Validation reussie!")
    print(f"  - Status: {result.get('status')}")
    print(f"  - Parametres compares: {result.get('comparison', [])[:2]}")
else:
    print(f"\nERREUR {validate_response.status_code}")
