from flask import Blueprint, request, jsonify
import os
import traceback
from datetime import datetime

from utils.ipfs_client import fetch_json_from_gateway, request_with_backoff, upload_json_to_pinata
from utils.request_security import verify_signed_request


ipfs_bp = Blueprint('ipfs', __name__)

PINATA_JWT = os.getenv('PINATA_JWT')
PINATA_GATEWAY = os.getenv('PINATA_GATEWAY', 'https://gateway.pinata.cloud')
PINATA_PIN_JSON_URL = 'https://api.pinata.cloud/pinning/pinJSONToIPFS'


@ipfs_bp.route('/ipfs/upload', methods=['POST'])
def upload_to_ipfs():
    """
    Upload un certificat JSON vers IPFS via Pinata uniquement.
    """
    try:
        integrity_error = verify_signed_request()
        if integrity_error:
            return integrity_error
        data = request.get_json() or {}
        certificate_data = data.get('data') if 'data' in data else data
        lot_id = data.get('lot_id') or certificate_data.get('lot_id', 'unknown')
        name = data.get('name', f'certificate-{lot_id}')

        print(f"\n[IPFS] Upload vers Pinata pour le lot: {lot_id}")

        result = upload_json_to_pinata(
            certificate_data,
            lot_id=lot_id,
            jwt=PINATA_JWT,
            pin_json_url=PINATA_PIN_JSON_URL,
            gateway_url=PINATA_GATEWAY,
            name=name,
            timeout=10,
            max_attempts=4,
            backoff_factor=1.0,
        )
        ipfs_hash = result['ipfs_hash']
        print(f"[IPFS] Upload reussi: {ipfs_hash}")

        return jsonify({
            'success': True,
            'ipfs_hash': ipfs_hash,
            'ipfs_uri': result['ipfs_uri'],
            'gateway_url': result['gateway_url'],
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
        payload = fetch_json_from_gateway(PINATA_GATEWAY, clean_hash, timeout=10)
        return jsonify({
            'success': True,
            **payload,
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
        integrity_error = verify_signed_request()
        if integrity_error:
            return integrity_error
        clean_hash = ipfs_hash.replace('ipfs://', '')
        print(f"\n[IPFS] Verification pin: {clean_hash}")
        response = request_with_backoff(
            "GET",
            f'{PINATA_GATEWAY}/ipfs/{clean_hash}',
            timeout=10,
            max_attempts=3,
            backoff_factor=0.8,
        )
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
