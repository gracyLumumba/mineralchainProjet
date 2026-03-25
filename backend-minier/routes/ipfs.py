# routes/ipfs.py
from flask import Blueprint, request, jsonify
import requests
import os
import json
from datetime import datetime
import sys
import traceback
import os

ipfs_bp = Blueprint('ipfs', __name__)

# Configuration Pinata (à remplacer par tes vraies clés)
PINATA_JWT = os.getenv('PINATA_JWT', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZSI6InVzZXIifSwiZXhwIjoxNzQ0NjQwMDAwfQ.sample_signature')
PINATA_GATEWAY = 'https://gateway.pinata.cloud'

# Simulation locale pour le développement (sans vrai compte Pinata)
LOCAL_IPFS_STORAGE = {}

@ipfs_bp.route('/ipfs/upload', methods=['POST'])
def upload_to_ipfs():
    """
    Upload un certificat JSON vers IPFS (via Pinata ou simulation locale)
    """
    try:
        data = request.get_json() or {}

        certificate_data = data.get('data') if 'data' in data else data
        lot_id = data.get('lot_id') or certificate_data.get('lot_id', 'unknown')
        name = data.get('name', f'certificate-{lot_id}')
        
        print(f"\n📤 Upload vers IPFS pour le lot: {lot_id}")
        
        # Tentative d'upload vers Pinata (si JWT valide)
        try:
            # Préparer les métadonnées pour Pinata
            pinata_metadata = {
                'name': name,
                'keyvalues': {
                    'lot_id': lot_id,
                    'timestamp': str(datetime.now().timestamp()),
                    'type': 'mineral_certificate'
                }
            }
            
            # Appel à l'API Pinata
            url = 'https://api.pinata.cloud/pinning/pinJSONToIPFS'
            headers = {
                'Authorization': f'Bearer {PINATA_JWT}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'pinataContent': certificate_data,
                'pinataMetadata': pinata_metadata,
                'pinataOptions': {
                    'cidVersion': 1
                }
            }
            
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                ipfs_hash = result['IpfsHash']
                print(f"✅ Upload Pinata réussi: {ipfs_hash}")
                
                return jsonify({
                    'success': True,
                    'ipfs_hash': ipfs_hash,
                    'ipfs_uri': f'ipfs://{ipfs_hash}',
                    'gateway_url': f'{PINATA_GATEWAY}/ipfs/{ipfs_hash}',
                    'timestamp': datetime.now().isoformat()
                }), 200
            else:
                print(f"⚠️ Erreur Pinata: {response.status_code}, fallback local")
                # Fallback vers simulation locale
                raise Exception("Pinata indisponible")
                
        except Exception as e:
            print(f"⚠️ Fallback vers stockage local: {str(e)}")
            
            # Simulation locale (pour développement sans compte Pinata)
            import hashlib
            import json
            
            # Générer un faux hash IPFS (simulé)
            data_str = json.dumps(certificate_data, sort_keys=True)
            fake_hash = hashlib.sha256(data_str.encode()).hexdigest()
            ipfs_hash = f"QmSimulated{fake_hash[:44]}"
            
            # Stocker localement (simulation)
            LOCAL_IPFS_STORAGE[ipfs_hash] = certificate_data
            
            print(f"✅ Simulation locale: {ipfs_hash}")
            
            return jsonify({
                'success': True,
                'ipfs_hash': ipfs_hash,
                'ipfs_uri': f'ipfs://{ipfs_hash}',
                'gateway_url': f'{PINATA_GATEWAY}/ipfs/{ipfs_hash}',
                'timestamp': datetime.now().isoformat(),
                'simulated': True
            }), 200
        
    except Exception as e:
        print(f"❌ Erreur upload IPFS: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@ipfs_bp.route('/ipfs/get/<ipfs_hash>', methods=['GET'])
def get_from_ipfs(ipfs_hash):
    """
    Récupère un certificat depuis IPFS
    """
    try:
        # Nettoyer le hash
        clean_hash = ipfs_hash.replace('ipfs://', '')
        print(f"\n📥 Récupération IPFS: {clean_hash}")
        
        # Vérifier d'abord dans le stockage local (simulation)
        if clean_hash in LOCAL_IPFS_STORAGE:
            print(f"✅ Trouvé en local (simulation)")
            return jsonify({
                'success': True,
                'data': LOCAL_IPFS_STORAGE[clean_hash],
                'content': LOCAL_IPFS_STORAGE[clean_hash],
                'ipfs_hash': clean_hash,
                'source': 'local'
            }), 200
        
        # Sinon, essayer la gateway Pinata
        try:
            url = f'{PINATA_GATEWAY}/ipfs/{clean_hash}'
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                print(f"✅ Récupéré depuis gateway")
                return jsonify({
                    'success': True,
                    'data': response.json(),
                    'content': response.json(),
                    'ipfs_hash': clean_hash,
                    'source': 'gateway'
                }), 200
            else:
                print(f"⚠️ Non trouvé sur gateway")
                return jsonify({'error': 'Fichier non trouvé sur IPFS'}), 404
                
        except Exception as e:
            print(f"⚠️ Erreur gateway: {str(e)}")
            return jsonify({'error': 'Impossible de joindre IPFS'}), 503
        
    except Exception as e:
        print(f"❌ Erreur: {str(e)}")
        return jsonify({'error': str(e)}), 500

@ipfs_bp.route('/ipfs/pin/<ipfs_hash>', methods=['POST'])
def pin_to_ipfs(ipfs_hash):
    """
    Pin un hash existant (simulation)
    """
    try:
        clean_hash = ipfs_hash.replace('ipfs://', '')
        print(f"\n📌 Pin demandé pour: {clean_hash}")
        
        # Simulation - on considère que c'est déjà pinné
        return jsonify({
            'success': True,
            'ipfs_hash': clean_hash,
            'message': 'Hash pinné avec succès (simulation)',
            'simulated': True
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ipfs_bp.route('/ipfs/status', methods=['GET'])
def ipfs_status():
    """Vérifie l'état de la connexion IPFS"""
    return jsonify({
        'status': 'ok',
        'mode': 'simulation' if PINATA_JWT == 'votre_jwt_ici' else 'production',
        'gateway': PINATA_GATEWAY,
        'local_files': len(LOCAL_IPFS_STORAGE),
        'timestamp': datetime.now().isoformat()
    })
