from flask import Blueprint, request, jsonify
import os
import traceback
from datetime import datetime

import requests


ipfs_bp = Blueprint('ipfs', __name__)

PINATA_JWT = os.getenv('PINATA_JWT')
PINATA_GATEWAY = os.getenv('PINATA_GATEWAY', 'https://gateway.pinata.cloud')
PINATA_PIN_JSON_URL = 'https://api.pinata.cloud/pinning/pinJSONToIPFS'


def _pinata_headers():
    if not PINATA_JWT:
        raise RuntimeError('PINATA_JWT manquant')
    return {
        'Authorization': f'Bearer {PINATA_JWT}',
        'Content-Type': 'application/json'
    }


@ipfs_bp.route('/ipfs/upload', methods=['POST'])
def upload_to_ipfs():
    """
    Upload un certificat JSON vers IPFS via Pinata uniquement.
    """
    try:
        data = request.get_json() or {}
        certificate_data = data.get('data') if 'data' in data else data
        lot_id = data.get('lot_id') or certificate_data.get('lot_id', 'unknown')
        name = data.get('name', f'certificate-{lot_id}')

        print(f"\n[IPFS] Upload vers Pinata pour le lot: {lot_id}")

        pinata_metadata = {
            'name': name,
            'keyvalues': {
                'lot_id': lot_id,
                'timestamp': str(datetime.now().timestamp()),
                'type': 'mineral_certificate',
            },
        }
        payload = {
            'pinataContent': certificate_data,
            'pinataMetadata': pinata_metadata,
            'pinataOptions': {
                'cidVersion': 1,
            },
        }

        response = requests.post(
            PINATA_PIN_JSON_URL,
            json=payload,
            headers=_pinata_headers(),
            timeout=10,
        )

        if response.status_code != 200:
            print(f"[IPFS] Erreur Pinata: {response.status_code}")
            return jsonify({
                'error': 'Upload Pinata impossible',
                'details': response.text[:200],
            }), 502

        result = response.json()
        ipfs_hash = result['IpfsHash']
        print(f"[IPFS] Upload reussi: {ipfs_hash}")

        return jsonify({
            'success': True,
            'ipfs_hash': ipfs_hash,
            'ipfs_uri': f'ipfs://{ipfs_hash}',
            'gateway_url': f'{PINATA_GATEWAY}/ipfs/{ipfs_hash}',
            'timestamp': datetime.now().isoformat(),
            'simulated': False,
        }), 200

    except Exception as e:
        print(f"[IPFS] Erreur upload: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@ipfs_bp.route('/ipfs/get/<ipfs_hash>', methods=['GET'])
def get_from_ipfs(ipfs_hash):
    """
    Recupere un certificat depuis la gateway IPFS configuree.
    """
    try:
        clean_hash = ipfs_hash.replace('ipfs://', '')
        print(f"\n[IPFS] Recuperation: {clean_hash}")

        response = requests.get(f'{PINATA_GATEWAY}/ipfs/{clean_hash}', timeout=10)
        if response.status_code != 200:
            return jsonify({'error': 'Fichier non trouve sur IPFS'}), 404

        payload = response.json()
        return jsonify({
            'success': True,
            'data': payload,
            'content': payload,
            'ipfs_hash': clean_hash,
            'source': 'gateway',
        }), 200

    except Exception as e:
        print(f"[IPFS] Erreur lecture: {str(e)}")
        return jsonify({'error': str(e)}), 500


@ipfs_bp.route('/ipfs/pin/<ipfs_hash>', methods=['POST'])
def pin_to_ipfs(ipfs_hash):
    """
    Verifie qu'un hash IPFS est accessible via la gateway configuree.
    """
    try:
        clean_hash = ipfs_hash.replace('ipfs://', '')
        print(f"\n[IPFS] Verification pin: {clean_hash}")

        response = requests.get(f'{PINATA_GATEWAY}/ipfs/{clean_hash}', timeout=10)
        if response.status_code != 200:
            return jsonify({
                'error': 'Hash non accessible via la gateway',
                'status_code': response.status_code,
            }), 404

        return jsonify({
            'success': True,
            'ipfs_hash': clean_hash,
            'message': 'Hash accessible via la gateway',
            'simulated': False,
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@ipfs_bp.route('/ipfs/status', methods=['GET'])
def ipfs_status():
    """Verifie l'etat de la configuration IPFS."""
    return jsonify({
        'status': 'ok',
        'mode': 'production' if PINATA_JWT else 'unconfigured',
        'gateway': PINATA_GATEWAY,
        'pinata_configured': bool(PINATA_JWT),
        'timestamp': datetime.now().isoformat(),
    })
