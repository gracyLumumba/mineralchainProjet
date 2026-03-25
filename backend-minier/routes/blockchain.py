# routes/blockchain.py
from flask import Blueprint, request, jsonify
from web3 import Web3
import json
import os

blockchain_bp = Blueprint('blockchain', __name__)

# Connexion à Ganache
w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:7545'))

# Adresse du contrat (À REMPLACER par la vôtre !)
CONTRACT_ADDRESS = '0x3Bff0f7B1f4f3558F83FAd968bF3eAeB82A236A4'

# Charger l'ABI du contrat
contract_path = os.path.join(os.path.dirname(__file__), '..', '..', 'nft-minier', 'build', 'contracts', 'MineralNFT.json')
with open(contract_path, 'r') as f:
    contract_json = json.load(f)
    CONTRACT_ABI = contract_json['abi']

# Initialiser le contrat
contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)

@blockchain_bp.route('/mint', methods=['POST'])
def mint_token():
    """Crée un NFT à partir des résultats IA"""
    try:
        data = request.get_json()
        
        # Comptes disponibles sur Ganache
        account = w3.eth.accounts[0]
        
        # Convertir les valeurs (pour éviter les décimales)
        cu_grade = int(float(data.get('cu_grade_percent', 0)) * 100)
        co_grade = int(float(data.get('co_grade_percent', 0)) * 100)
        fe_grade = int(float(data.get('fe_percent', 0)) * 100)
        weight = int(float(data.get('weight_tonnes', 0)) * 100)
        
        # Appeler le contrat
        tx_hash = contract.functions.mintMineralToken(
            account,
            data.get('lot_id', ''),
            data.get('site', ''),
            data.get('mineral_type', ''),
            data.get('impurity_level', ''),
            int(float(data.get('confidence', 0)) * 100),
            data.get('ia_signature', ''),
            data.get('is_authentic', True),
            data.get('certificate_hash', ''),
            data.get('ipfs_hash', ''),
            cu_grade,
            co_grade,
            fe_grade,
            weight
        ).transact({'from': account})
        
        # Attendre la confirmation
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        
        # Récupérer le tokenId depuis les logs
        logs = contract.events.MineralCertified().process_receipt(receipt)
        token_id = logs[0]['args']['tokenId'] if logs else None
        
        return jsonify({
            "success": True,
            "token_id": token_id,
            "transaction_hash": tx_hash.hex(),
            "block_number": receipt.blockNumber
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@blockchain_bp.route('/token/<int:token_id>', methods=['GET'])
def get_token(token_id):
    """Récupère les données d'un token"""
    try:
        data = contract.functions.getMineralData(token_id).call()
        
        return jsonify({
            "token_id": token_id,
            "lot_id": data[0],
            "site": data[1],
            "mineral_type": data[2],
            "impurity_level": data[3],
            "confidence": data[4] / 100,
            "ia_signature": data[5],
            "timestamp": data[6],
            "is_authentic": data[7],
            "certificate_hash": data[8],
            "ipfs_hash": data[9],
            "cu_grade": data[10] / 100,
            "co_grade": data[11] / 100,
            "fe_grade": data[12] / 100,
            "weight": data[13] / 100
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@blockchain_bp.route('/lot/<lot_id>', methods=['GET'])
def get_token_by_lot(lot_id):
    """Trouve un token par son lotId"""
    try:
        token_id = contract.functions.getTokenByLotId(lot_id).call()
        return get_token(token_id)
    except Exception as e:
        return jsonify({"error": "Lot non trouvé"}), 404

@blockchain_bp.route('/owner/<address>', methods=['GET'])
def get_tokens_of_owner(address):
    """Récupère tous les tokens d'un propriétaire"""
    try:
        tokens = contract.functions.tokensOfOwner(address).call()
        return jsonify({
            "owner": address,
            "tokens": tokens
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
