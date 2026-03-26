# routes/certify.py
from flask import Blueprint, request, jsonify
from web3 import Web3
import json
import hashlib
from datetime import datetime
import sys
import os
import traceback
import requests
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from models.load_models import model_loader
from routes.lots import upsert_database_lot, database_enabled
from routes.auth import get_current_user
from utils.blockchain_config import load_contract_config, GANACHE_URL, DEFAULT_CONTRACT_ADDRESS

certify_bp = Blueprint('certify', __name__)
AUTO_CERT_THRESHOLD = 0.00  # Demo mode: any non-fraud lot can be certified

# ============================================================
# CONNEXION À LA BLOCKCHAIN (Ganache)
# ============================================================
print("[BLOCKCHAIN] Connexion a la blockchain...")
w3 = Web3(Web3.HTTPProvider(GANACHE_URL))

if w3.is_connected():
    print("[OK] Connecte a Ganache")
    print(f"   • Dernier bloc : {w3.eth.block_number}")
    print(f"   • Comptes : {len(w3.eth.accounts)}")
    for i, account in enumerate(w3.eth.accounts[:3]):
        balance = w3.from_wei(w3.eth.get_balance(account), 'ether')
        print(f"   • Compte {i}: {account} ({balance} ETH)")
else:
    print("[ERROR] Echec connexion Ganache")

# ============================================================
# CONFIGURATION DU CONTRAT
# ============================================================
# Charger l'ABI du contrat
try:
    contract_config = load_contract_config()
    CONTRACT_ABI = contract_config['abi']
    CONTRACT_ADDRESS = contract_config['address']
    print(f"[OK] ABI du contrat chargee ({len(CONTRACT_ABI)} entrees)")
except FileNotFoundError:
    print("[ERROR] Fichier ABI non trouve")
    CONTRACT_ABI = None
    CONTRACT_ADDRESS = DEFAULT_CONTRACT_ADDRESS
except Exception as e:
    print(f"[ERROR] Erreur chargement ABI: {str(e)}")
    CONTRACT_ABI = None
    CONTRACT_ADDRESS = DEFAULT_CONTRACT_ADDRESS

# Initialiser le contrat
if CONTRACT_ABI:
    contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)
    print(f"[OK] Contrat initialise a l'adresse: {CONTRACT_ADDRESS}")
    
    # Vérifier les fonctions disponibles
    if hasattr(contract.functions, 'mintMineralToken'):
        print("   [OK] Fonction mintMineralToken trouvee")
    else:
        print("   [ERROR] Fonction mintMineralToken non trouvee")
else:
    contract = None

# Compte et clé privée pour les transactions
PRIVATE_KEY = (os.getenv('OWNER_PRIVATE_KEY') or '').strip()
if PRIVATE_KEY and not PRIVATE_KEY.startswith('0x'):
    PRIVATE_KEY = f'0x{PRIVATE_KEY}'

if PRIVATE_KEY:
    try:
        ACCOUNT = w3.eth.account.from_key(PRIVATE_KEY).address
    except Exception:
        ACCOUNT = w3.eth.accounts[0] if w3.is_connected() and w3.eth.accounts else None
        PRIVATE_KEY = ''
else:
    ACCOUNT = w3.eth.accounts[0] if w3.is_connected() and w3.eth.accounts else None

print(f"[ACCOUNT] Compte de deploiement : {ACCOUNT}")
if ACCOUNT and w3.is_connected():
    balance = w3.from_wei(w3.eth.get_balance(ACCOUNT), 'ether')
    print(f"   • Balance: {balance} ETH")


def send_contract_transaction(tx_builder):
    """
    Send a contract transaction using either:
    - a local unlocked Ganache account via `transact`, or
    - an explicit private key via `sign_transaction`.
    """
    if not ACCOUNT:
        raise RuntimeError("Aucun compte blockchain disponible")

    if PRIVATE_KEY:
        nonce = w3.eth.get_transaction_count(ACCOUNT)
        transaction = tx_builder.build_transaction({
            'from': ACCOUNT,
            'gas': 3000000,
            'gasPrice': w3.eth.gas_price,
            'nonce': nonce,
            'chainId': 1337
        })
        print(f"   • Nonce: {nonce}")
        print("\n   [TX] Signature de la transaction...")
        signed_txn = w3.eth.account.sign_transaction(transaction, PRIVATE_KEY)
        print("   [OK] Transaction signee")
        print("\n   [TX] Envoi de la transaction...")
        tx_hash = w3.eth.send_raw_transaction(signed_txn.raw_transaction)
    else:
        print("   • Mode Ganache local: envoi sans clé privée explicite")
        print("\n   [TX] Envoi de la transaction...")
        tx_hash = tx_builder.transact({
            'from': ACCOUNT,
            'gas': 3000000,
            'gasPrice': w3.eth.gas_price
        })

    return tx_hash


def extract_token_id_from_receipt(receipt, lot_id=None):
    """
    Resolve the minted token id as reliably as possible.
    Priority:
    1. Ask the contract for the token bound to the lot id.
    2. Parse ERC-721 Transfer event logs (topic[3] = tokenId).
    """
    if contract is not None and lot_id:
        try:
            resolved_token_id = contract.functions.getTokenByLot(lot_id).call()
            if resolved_token_id is not None:
                print(f"   [OK] Token ID resolu via contrat: {resolved_token_id}")
                return int(resolved_token_id)
        except Exception as error:
            print(f"   [WARN] Resolution via getTokenByLot impossible: {str(error)}")

    if receipt and receipt.logs:
        for log in receipt.logs:
            try:
                topics = log.get('topics', [])
                if len(topics) >= 4:
                    token_id_hex = topics[3].hex()
                    resolved_token_id = int(token_id_hex, 16)
                    print(f"   [OK] Token ID resolu via event Transfer: {resolved_token_id}")
                    return resolved_token_id
            except Exception:
                continue

    return None


def build_simulated_blockchain_result(lot_id, cert_hash, reason=None):
    """
    Build a deterministic fallback NFT payload when Ganache is unavailable.
    This keeps the demo flow usable without claiming a real on-chain mint.
    """
    token_seed = hashlib.sha256(f"{lot_id}:{cert_hash}".encode()).hexdigest()
    token_id = int(token_seed[:8], 16) % 900000 + 1000
    tx_hash = f"0x{token_seed[:64]}"
    return {
        "contract_address": CONTRACT_ADDRESS,
        "token_id": token_id,
        "transaction_hash": tx_hash,
        "block_number": None,
        "gas_used": None,
        "simulated": True,
        "reason": reason or "Ganache indisponible"
    }


def is_unknown_mineral(value):
    return str(value).strip().lower() in {'', 'unknown', 'inconnu', 'none', 'null'}


def infer_mineral_type_from_payload(data):
    """
    Domain fallback when the IA mineral model is absent or inconclusive.
    The project mostly handles copper/cobalt ore, so prefer that vocabulary.
    """
    cu = float(data.get('cu_grade_percent', 0) or 0)
    co = float(data.get('co_grade_percent', 0) or 0)
    fe = float(data.get('fe_percent', 0) or 0)
    sulfur = float(data.get('s_percent', 0) or 0)

    if cu >= 1.0 and co >= 0.1:
        return "Cuivre-Cobalt", 0.55
    if cu >= 1.0:
        return "Cuivre", 0.45
    if co >= 0.1:
        return "Cobalt", 0.45
    if fe >= 20:
        return "Fer", 0.35
    if sulfur >= 5:
        return "Sulfure", 0.30

    return "Non determine", 0.0

# ============================================================
# CONFIGURATION IPFS (Pinata) - AVEC TES VRAIES CLÉS
# ============================================================
PINATA_JWT = os.getenv('PINATA_JWT')
PINATA_API_KEY = os.getenv('PINATA_API_KEY')
PINATA_API_SECRET = os.getenv('PINATA_API_SECRET')
PINATA_GATEWAY = os.getenv('PINATA_GATEWAY', 'https://gateway.pinata.cloud')

print(f"\n[IPFS] Configuration IPFS:")
print(f"   • JWT charge: {'Oui' if PINATA_JWT else 'Non'}")
print(f"   • API Key: {'Oui' if PINATA_API_KEY else 'Non'}")
print(f"   • Gateway: {PINATA_GATEWAY}")

def upload_to_pinata(certificate_data, lot_id):
    """
    Upload un certificat vers Pinata IPFS avec les vraies clés
    """
    try:
        print(f"   [IPFS] Upload vers IPFS pour le lot {lot_id}...")
        
        # Vérifier que le JWT est présent
        if not PINATA_JWT:
            print(f"   [WARN] JWT manquant - upload impossible")
            return None
        
        # Préparer les métadonnées
        pinata_metadata = {
            'name': f'certificate-{lot_id}-{datetime.now().strftime("%Y%m%d-%H%M%S")}',
            'keyvalues': {
                'lot_id': lot_id,
                'timestamp': str(datetime.now().timestamp()),
                'type': 'mineral_certificate'
            }
        }
        
        # Appel à l'API Pinata avec JWT
        url = 'https://api.pinata.cloud/pinning/pinJSONToIPFS'
        headers = {
            'Authorization': f'Bearer {PINATA_JWT}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'pinataContent': certificate_data,
            'pinataMetadata': pinata_metadata,
            'pinataOptions': {
                'cidVersion': 1,
                'wrapWithDirectory': False
            }
        }
        
        print(f"   [IPFS] Envoi a Pinata...")
        response = requests.post(url, json=payload, headers=headers, timeout=8)
        
        if response.status_code == 200:
            result = response.json()
            ipfs_hash = result['IpfsHash']
            print(f"   [OK] Upload reussi")
            print(f"   • CID: {ipfs_hash}")
            print(f"   • Lien: {PINATA_GATEWAY}/ipfs/{ipfs_hash}")
            return ipfs_hash
        else:
            print(f"   [WARN] Erreur Pinata: {response.status_code}")
            print(f"   • Réponse: {response.text[:200]}")
            return None
            
    except Exception as e:
        print(f"   [WARN] Erreur upload IPFS: {str(e)}")
        return None

# ============================================================
# FONCTION PRINCIPALE : ANALYSE + CERTIFICATION + BLOCKCHAIN
# ============================================================
@certify_bp.route('/analyze-and-certify', methods=['POST'])
def analyze_and_certify():
    """
    Étape 1: Analyse IA du lot
    Étape 2: Création du certificat
    Étape 3: Upload IPFS
    Étape 4: Mint du NFT sur la blockchain
    """
    try:
        user = get_current_user()
        if not user:
            return jsonify({"error": "Authentification requise"}), 401

        data = request.get_json() or {}
        
        required_fields = ['lot_id']
        missing = [f for f in required_fields if not data.get(f)]
        if missing:
            return jsonify({"error": f"Champs manquants: {', '.join(missing)}"}), 400
        
        lot_id = data.get('lot_id', 'inconnu')
        print(f"\n{'='*60}")
        print(f"[ANALYSE] LOT: {lot_id}")
        print(f"{'='*60}")
        
        # -------------------------------------------------
        # ÉTAPE 1: ANALYSE IA
        # -------------------------------------------------
        print("\n[ETAPE 1/4] Analyse IA...")
        
        features = {}
        for col in model_loader.feature_columns:
            features[col] = data.get(col, 0)
        
        ia_results = model_loader.predict(features)
        
        mineral_type = ia_results.get('mineral', {}).get('type', 'unknown')
        mineral_conf = ia_results.get('mineral', {}).get('confidence', 0)
        impurity_level = ia_results.get('impurity', {}).get('level', 'unknown')

        if is_unknown_mineral(mineral_type):
            inferred_type, inferred_conf = infer_mineral_type_from_payload(data)
            mineral_type = inferred_type
            mineral_conf = max(mineral_conf, inferred_conf)
        
        # Vérifier la fraude
        if 'fraud' in ia_results:
            is_fraud = ia_results['fraud'].get('is_fraud', False)
            fraud_prob = ia_results['fraud'].get('probability', 0)
            print(f"   [FRAUD] Modele fraude: prob={fraud_prob:.2f}")
        else:
            is_fraud = False
            # Règles heuristiques
            cu = float(data.get('cu_grade_percent', 0))
            density = float(data.get('density_t_m3', 0))
            moisture = float(data.get('moisture_percent', 0))
            
            if cu > 15 and density < 2.0:
                is_fraud = True
                print(f"   [ALERT] REGLE 1: Cu > 15% & densite < 2.0")
            elif moisture > 40:
                is_fraud = True
                print(f"   [ALERT] REGLE 2: Humidite > 40%")
            elif cu > 25:
                is_fraud = True
                print(f"   [ALERT] REGLE 3: Cu > 25%")
        
        # Déterminer le statut
        mineral_unknown = is_unknown_mineral(mineral_type) or mineral_type == "Non determine"
        if is_fraud:
            status = "SUSPECT"
        elif mineral_unknown:
            status = "A_VERIFIER"
        else:
            status = "AUTHENTIQUE"
        
        print(f"\n   [OK] Resultat IA:")
        print(f"      • Type: {mineral_type.upper()}")
        print(f"      • Confiance: {mineral_conf:.1%}")
        print(f"      • Impuretés: {impurity_level}")
        print(f"      • Statut: {status}")
        
        # -------------------------------------------------
        # ÉTAPE 2: CRÉATION DU CERTIFICAT
        # -------------------------------------------------
        print("\n[ETAPE 2/4] Creation du certificat...")
        
        certificate = {
            "version": "2.0",
            "format": "IPFS-CERT",
            "certificate_id": f"CERT-{lot_id}-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
            "lot_id": lot_id,
            "site": data.get('site', 'inconnu'),
            "extraction_date": data.get('extraction_date'),
            "analyzed_at": datetime.now().isoformat(),
            "ia_analysis": {
                "mineral_type": mineral_type,
                "confidence": mineral_conf,
                "impurity_level": impurity_level,
                "is_fraud": is_fraud,
                "status": status
            },
            "composition": {
                "cu": data.get('cu_grade_percent', 0),
                "co": data.get('co_grade_percent', 0),
                "fe": data.get('fe_percent', 0),
                "ni": data.get('ni_percent', 0),
                "s": data.get('s_percent', 0),
                "silica": data.get('silica_percent', 0)
            },
            "physical": {
                "density": data.get('density_t_m3', 0),
                "moisture": data.get('moisture_percent', 0),
                "hardness": data.get('hardness_mohs', 0),
                "weight": data.get('weight_tonnes', 0)
            },
            "blockchain": {
                "contract_address": CONTRACT_ADDRESS
            }
        }
        
        cert_hash = hashlib.sha256(json.dumps(certificate, sort_keys=True).encode()).hexdigest()
        print(f"   [OK] Certificat cree")
        print(f"   • Hash SHA256: {cert_hash[:16]}...")
        
        # -------------------------------------------------
        # ÉTAPE 3: UPLOAD VERS IPFS
        # -------------------------------------------------
        print("\n[ETAPE 3/4] Upload vers IPFS...")
        
        ipfs_hash = upload_to_pinata(certificate, lot_id)
        
        if ipfs_hash:
            ipfs_uri = f"ipfs://{ipfs_hash}"
            gateway_url = f"{PINATA_GATEWAY}/ipfs/{ipfs_hash}"
            print(f"   [OK] Certificat sur IPFS")
            print(f"   • CID: {ipfs_hash}")
            print(f"   • URL: {gateway_url}")
        else:
            # Fallback local (simulation)
            ipfs_hash = f"QmSimulated{hashlib.sha256(lot_id.encode()).hexdigest()[:44]}"
            ipfs_uri = f"ipfs://{ipfs_hash}"
            gateway_url = f"{PINATA_GATEWAY}/ipfs/{ipfs_hash}"
            print(f"   [WARN] Fallback local (simulation)")
            print(f"   • CID simulé: {ipfs_hash}")
        
        # -------------------------------------------------
        # ÉTAPE 4: MINT DU NFT (seulement si authentique)
        # -------------------------------------------------
        token_id = None
        tx_hash = None
        receipt = None
        blockchain_error = None

        if status == "AUTHENTIQUE" and contract is not None and not is_fraud:
            print("\n[ETAPE 4/4] Creation du NFT sur la blockchain...")
            
            try:
                if not w3.is_connected():
                    raise RuntimeError("Ganache est indisponible sur http://127.0.0.1:7545")

                # Vérifier si le lot est déjà certifié
                already_certified = contract.functions.isLotCertified(lot_id).call()
                if already_certified:
                    existing_token_id = contract.functions.getTokenByLot(lot_id).call()
                    print(f"   [INFO] Lot deja certifie, token existant: #{existing_token_id}")
                    token_id = existing_token_id
                else:
                    # Convertir les valeurs (multiplier par 100 pour éviter les décimales)
                    confidence_int = int(mineral_conf * 100)
                    cu_int = int(float(data.get('cu_grade_percent', 0)) * 100)
                    co_int = int(float(data.get('co_grade_percent', 0)) * 100)
                    fe_int = int(float(data.get('fe_percent', 0)) * 100)
                    weight_int = int(float(data.get('weight_tonnes', 0)) * 100)

                    print(f"\n   [TX] Parametres de la transaction:")
                    print(f"   • Lot: {lot_id}")
                    print(f"   • Type: {mineral_type}")
                    print(f"   • Confiance: {confidence_int}%")
                    print(f"   • Cu: {cu_int/100}% | Co: {co_int/100}%")
                    print(f"   • IPFS CID: {ipfs_hash[:20]}...")

                    tx_builder = contract.functions.mintMineralToken(
                        ACCOUNT,
                        lot_id,
                        data.get('site', 'KAMOA'),
                        mineral_type,
                        impurity_level,
                        confidence_int,
                        f"0x{cert_hash[:16]}",  # iaSignature
                        True,                   # isAuthentic
                        cert_hash,              # certificateHash
                        ipfs_hash,              # ipfsHash
                        cu_int,
                        co_int,
                        fe_int,
                        weight_int
                    )

                    tx_hash = send_contract_transaction(tx_builder)
                    print(f"   [OK] Transaction envoyee: {tx_hash.hex()}")

                    print(f"\n   [TX] Attente de confirmation...")
                    receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
                    print(f"   [OK] Transaction confirmee")
                    print(f"   • Bloc: {receipt.blockNumber}")
                    print(f"   • Gas utilisé: {receipt.gasUsed}")
                    print(f"   • Status: {'Succes' if receipt.status == 1 else 'Echec'}")

                    token_id = extract_token_id_from_receipt(receipt, lot_id)
                    if token_id is None:
                        print("   [WARN] Token ID introuvable apres le mint")
                
            except Exception as e:
                blockchain_error = str(e)
                print(f"\n   [ERROR] Erreur blockchain: {str(e)}")
                traceback.print_exc()
        else:
            if status != "AUTHENTIQUE":
                print(f"\n[INFO] Pas de NFT (statut: {status})")
            elif is_fraud:
                print(f"\n[INFO] Pas de NFT (fraude detectee)")
            elif contract is None:
                print(f"\n[INFO] Pas de NFT (contrat non charge)")
        
        # -------------------------------------------------
        # RÉSULTAT FINAL
        # -------------------------------------------------
        blockchain_result = None
        if token_id is not None:
            blockchain_result = {
                "contract_address": CONTRACT_ADDRESS,
                "token_id": token_id,
                "transaction_hash": tx_hash.hex() if tx_hash else None,
                "block_number": receipt.blockNumber if receipt else None,
                "gas_used": receipt.gasUsed if receipt else None,
                "simulated": False
            }
        elif status == "AUTHENTIQUE":
            blockchain_result = build_simulated_blockchain_result(lot_id, cert_hash, blockchain_error)
            token_id = blockchain_result["token_id"]
            print(f"   [WARN] Fallback NFT simule: #{token_id}")

        result = {
            "success": True,
            "lot_id": lot_id,
            "ia_result": {
                "mineral_type": mineral_type,
                "confidence": mineral_conf,
                "impurity_level": impurity_level,
                "is_fraud": is_fraud,
                "status": status
            },
            "certificate": {
                "hash": cert_hash,
                "ipfs_hash": ipfs_hash,
                "ipfs_uri": ipfs_uri,
                "gateway_url": gateway_url if ipfs_hash else None
            },
            "blockchain": blockchain_result,
            "blockchain_error": blockchain_error
        }

        if database_enabled():
            try:
                upsert_database_lot({
                    "lot_id": lot_id,
                    "site": data.get('site', 'inconnu'),
                    "extraction_date": data.get('extraction_date'),
                    "status": status,
                    "weight_tonnes": data.get('weight_tonnes', 0),
                    "cu_grade_percent": data.get('cu_grade_percent', 0),
                    "co_grade_percent": data.get('co_grade_percent', 0),
                    "fe_percent": data.get('fe_percent', 0),
                    "ni_percent": data.get('ni_percent', 0),
                    "s_percent": data.get('s_percent', 0),
                    "silica_percent": data.get('silica_percent', 0),
                    "density_t_m3": data.get('density_t_m3', 0),
                    "moisture_percent": data.get('moisture_percent', 0),
                    "hardness_mohs": data.get('hardness_mohs', 0),
                    "analyzed_at": datetime.now().isoformat(),
                    "mineral_type": mineral_type,
                    "confidence": mineral_conf,
                    "impurity_level": impurity_level,
                    "is_fraud": is_fraud,
                    "token_id": blockchain_result.get("token_id") if blockchain_result else None,
                    "tx_hash": blockchain_result.get("transaction_hash") if blockchain_result else None,
                    "block_number": blockchain_result.get("block_number") if blockchain_result else None,
                    "contract_address": blockchain_result.get("contract_address") if blockchain_result else CONTRACT_ADDRESS,
                    "certificate_id": certificate["certificate_id"],
                    "owner_user_id": user.get('id'),
                    "owner_username": user.get('username'),
                    "owner_name": user.get('name'),
                }, history_event='CERTIFIED', history_extra={
                    "certificate_hash": cert_hash,
                    "ipfs_hash": ipfs_hash,
                    "token_id": blockchain_result.get("token_id") if blockchain_result else None,
                    "simulated_blockchain": blockchain_result.get("simulated") if blockchain_result else None,
                })
            except Exception as db_error:
                print(f"   [WARN] Persistance PostgreSQL impossible: {db_error}")
        
        print(f"\n{'='*60}")
        print(f"[DONE] ANALYSE ET CERTIFICATION TERMINEES")
        print(f"{'='*60}")
        print(f"[LOT] {lot_id}")
        print(f"[STATUS] {status}")
        print(f"[TOKEN] {token_id if token_id else 'Non cree'}")
        print(f"[IPFS] CID: {ipfs_hash[:20]}...")
        if ipfs_hash and not ipfs_hash.startswith('QmSimulated'):
            print(f"[LINK] Voir certificat: {gateway_url}")
        
        return jsonify(result), 200
        
    except Exception as e:
        print(f"\n[ERROR] ERREUR GENERALE: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# ============================================================
# ROUTES SUPPLÉMENTAIRES
# ============================================================
@certify_bp.route('/status', methods=['GET'])
def blockchain_status():
    """Vérifie l'état de la connexion blockchain"""
    if not w3 or not w3.is_connected():
        return jsonify({"error": "Non connecté à Ganache"}), 500
    
    return jsonify({
        "status": "ok",
        "ganache_connected": w3.is_connected(),
        "contract_loaded": contract is not None,
        "contract_address": CONTRACT_ADDRESS,
        "account": ACCOUNT,
        "account_balance": float(w3.from_wei(w3.eth.get_balance(ACCOUNT), 'ether')),
        "block_number": w3.eth.block_number,
        "ipfs_configured": PINATA_JWT is not None
    })

@certify_bp.route('/contract-info', methods=['GET'])
def contract_info():
    """Affiche les informations du contrat"""
    if not contract:
        return jsonify({"error": "Contrat non chargé"}), 404
    
    # Compter le nombre total de tokens
    try:
        total_supply = contract.functions.totalSupply().call()
    except:
        total_supply = 0
    
    return jsonify({
        "address": CONTRACT_ADDRESS,
        "has_mint_function": hasattr(contract.functions, 'mintMineralToken'),
        "total_supply": total_supply,
        "ipfs_configured": PINATA_JWT is not None
    })

@certify_bp.route('/ipfs-status', methods=['GET'])
def ipfs_status():
    """Vérifie l'état de la connexion IPFS"""
    return jsonify({
        "configured": PINATA_JWT is not None,
        "gateway": PINATA_GATEWAY,
        "api_key_present": PINATA_API_KEY is not None,
        "jwt_present": PINATA_JWT is not None
    })

@certify_bp.route('/token/<token_id>', methods=['GET'])
def get_token(token_id):
    """Récupère les infos d'un token NFT depuis la blockchain"""
    if not contract:
        return jsonify({"error": "Contrat non chargé"}), 503
    try:
        tid = int(token_id)
        owner = contract.functions.ownerOf(tid).call()
        token_uri = ''
        try:
            token_uri = contract.functions.tokenURI(tid).call()
        except:
            pass
        return jsonify({
            "token_id": tid,
            "owner": owner,
            "token_uri": token_uri,
            "contract": CONTRACT_ADDRESS,
            "network": "Ganache · localhost:7545"
        })
    except Exception as e:
        return jsonify({"error": f"Token {token_id} non trouvé: {str(e)}"}), 404

@certify_bp.route('/token/<token_id>/sync-certificate', methods=['POST'])
def sync_token_certificate(token_id):
    """Synchronise le certificat IPFS dans le smart contract."""
    if not contract:
        return jsonify({"error": "Contrat non charge"}), 503
    if not ACCOUNT or not PRIVATE_KEY:
        return jsonify({"error": "Compte blockchain non configure"}), 503

    try:
        tid = int(token_id)
        payload = request.get_json() or {}
        ipfs_hash = (payload.get('ipfs_hash') or '').replace('ipfs://', '').strip()
        certificate_hash = (payload.get('certificate_hash') or '').strip()

        if not ipfs_hash:
            return jsonify({"error": "ipfs_hash requis"}), 400
        if not certificate_hash:
            return jsonify({"error": "certificate_hash requis"}), 400

        tx_builder = contract.functions.updateCertificate(
            tid,
            certificate_hash,
            ipfs_hash
        )
        tx_hash = send_contract_transaction(tx_builder)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)

        if receipt.status != 1:
            return jsonify({"error": "La transaction de synchronisation a echoue"}), 500

        return jsonify({
            "success": True,
            "token_id": tid,
            "transaction_hash": tx_hash.hex(),
            "block_number": receipt.blockNumber,
            "ipfs_hash": ipfs_hash,
            "certificate_hash": certificate_hash
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Synchronisation blockchain impossible: {str(e)}"}), 500

@certify_bp.route('/verify', methods=['GET'])
def verify_lot():
    """Vérifie un lot via QR code (lot_id en query param)"""
    lot_id = request.args.get('lot')
    token_id = request.args.get('token')
    if not lot_id:
        return jsonify({"error": "Paramètre 'lot' manquant"}), 400
    result = {
        "lot_id": lot_id,
        "contract": CONTRACT_ADDRESS,
        "verified": False
    }
    if token_id and contract:
        try:
            tid = int(token_id)
            owner = contract.functions.ownerOf(tid).call()
            result["verified"] = True
            result["token_id"] = tid
            result["owner"] = owner
        except:
            pass
    return jsonify(result)

