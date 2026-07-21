from flask import Blueprint, request, jsonify
from web3 import Web3
import traceback

from routes.auth import get_current_user
from utils.blockchain_config import load_contract_config
from utils.request_security import verify_signed_request
from utils.transaction_manager import send_contract_transaction


blockchain_bp = Blueprint('blockchain', __name__)

contract_config = load_contract_config()
w3 = Web3(Web3.HTTPProvider(contract_config['ganache_url']))
CONTRACT_ADDRESS = contract_config['address']
CONTRACT_ABI = contract_config['abi']
contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI) if CONTRACT_ABI else None


def _account():
    return w3.eth.accounts[0] if w3.is_connected() and w3.eth.accounts else None


def _contract_ready():
    if contract is None:
        return False
    try:
        contract.functions.name().call()
        return True
    except Exception:
        return False


def _require_role(*allowed_roles, allow_admin=True):
    user = get_current_user()
    if not user:
        return None, (jsonify({"error": "Authentification requise"}), 401)

    role = str(user.get("role") or "").strip().lower()
    allowed = {str(item).strip().lower() for item in allowed_roles if str(item).strip()}
    if role not in allowed and not (allow_admin and role == "admin"):
        return None, (jsonify({
            "error": "Acces refuse",
            "required_roles": sorted(allowed) if allowed else [],
        }), 403)

    return user, None


def _require_blockchain_ready():
    if not w3.is_connected():
        return jsonify({"error": "Ganache indisponible"}), 503
    if contract is None:
        return jsonify({"error": "Contrat non charge"}), 503
    return None


@blockchain_bp.route('/status', methods=['GET'])
def blockchain_status():
    account = _account()
    return jsonify({
        "connected": w3.is_connected(),
        "ganache_url": contract_config['ganache_url'],
        "contract_address": CONTRACT_ADDRESS,
        "contract_loaded": _contract_ready(),
        "account": account,
        "block_number": w3.eth.block_number if w3.is_connected() else None,
        "account_balance": float(w3.from_wei(w3.eth.get_balance(account), 'ether')) if account else None,
    })


@blockchain_bp.route('/mint', methods=['POST'])
def mint_token():
    try:
        readiness_error = _require_blockchain_ready()
        if readiness_error:
            return readiness_error
        user, auth_error = _require_role("producer")
        if auth_error:
            return auth_error
        integrity_error = verify_signed_request()
        if integrity_error:
            return integrity_error
        data = request.get_json() or {}
        account = _account()
        if not account:
            return jsonify({"error": "Aucun compte Ganache disponible"}), 503

        recipient = data.get('recipient') or account
        tx_builder = contract.functions.mintMineralToken(
            Web3.to_checksum_address(recipient),
            data.get('lot_id', ''),
            data.get('site', ''),
            data.get('mineral_type', ''),
            data.get('impurity_level', ''),
            int(float(data.get('confidence', 0)) * 100 if float(data.get('confidence', 0)) <= 1 else float(data.get('confidence', 0))),
            data.get('ia_signature', ''),
            bool(data.get('is_authentic', True)),
            data.get('certificate_hash', ''),
            data.get('ipfs_hash', ''),
            int(float(data.get('cu_grade', 0)) * 100),
            int(float(data.get('co_grade', 0)) * 100),
            int(float(data.get('fe_grade', 0)) * 100),
            int(float(data.get('weight', 0)) * 100),
        )
        tx_hash = send_contract_transaction(w3, tx_builder, account)

        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
        token_id = contract.functions.getTokenByLot(data.get('lot_id', '')).call()

        return jsonify({
            "success": True,
            "token_id": token_id,
            "transaction_hash": tx_hash.hex(),
            "block_number": receipt.blockNumber,
            "gas_used": receipt.gasUsed,
            "contract_address": CONTRACT_ADDRESS,
            "timestamp": w3.eth.get_block(receipt.blockNumber).timestamp,
            "simulated": False,
            "actor": user.get("username"),
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@blockchain_bp.route('/token/<int:token_id>', methods=['GET'])
def get_token(token_id):
    try:
        readiness_error = _require_blockchain_ready()
        if readiness_error:
            return readiness_error
        data = contract.functions.getMineralData(token_id).call()
        owner = contract.functions.ownerOf(token_id).call()
        token_uri = contract.functions.tokenURI(token_id).call()
        return jsonify({
            "token_id": token_id,
            "lot_id": data[0],
            "site": data[1],
            "mineral_type": data[2],
            "impurity_level": data[3],
            "confidence": data[4] / 100,
            "ia_signature": data[5],
            "is_authentic": data[6],
            "ipfs_hash": data[7],
            "cu_grade": data[8] / 100,
            "co_grade": data[9] / 100,
            "fe_grade": data[10] / 100,
            "weight": data[11] / 100,
            "timestamp": data[12],
            "dgmr_validated": data[13],
            "dgmr_status": data[14],
            "owner": owner,
            "token_uri": token_uri,
            "contract": CONTRACT_ADDRESS,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 404


@blockchain_bp.route('/lot/<lot_id>', methods=['GET'])
def get_token_by_lot(lot_id):
    try:
        readiness_error = _require_blockchain_ready()
        if readiness_error:
            return readiness_error
        token_id = contract.functions.getTokenByLot(lot_id).call()
        if not token_id:
            return jsonify({"error": "Lot non trouve"}), 404
        return get_token(int(token_id))
    except Exception as e:
        return jsonify({"error": str(e)}), 404


@blockchain_bp.route('/validate-dgmr', methods=['POST'])
def validate_dgmr():
    try:
        readiness_error = _require_blockchain_ready()
        if readiness_error:
            return readiness_error
        user, auth_error = _require_role("regulator")
        if auth_error:
            return auth_error
        integrity_error = verify_signed_request()
        if integrity_error:
            return integrity_error
        payload = request.get_json() or {}
        account = _account()
        tx_builder = contract.functions.validateByDGMR(
            int(payload.get('token_id')),
            payload.get('status', 'AUTHENTIQUE'),
            Web3.to_checksum_address(payload.get('validator_address') or account),
        )
        tx_hash = send_contract_transaction(w3, tx_builder, account, fallback_gas=500000)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
        return jsonify({
            "success": receipt.status == 1,
            "transaction_hash": tx_hash.hex(),
            "block_number": receipt.blockNumber,
            "actor": user.get("username"),
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@blockchain_bp.route('/update-ipfs', methods=['POST'])
def update_ipfs():
    try:
        readiness_error = _require_blockchain_ready()
        if readiness_error:
            return readiness_error
        user, auth_error = _require_role("producer")
        if auth_error:
            return auth_error
        integrity_error = verify_signed_request()
        if integrity_error:
            return integrity_error
        payload = request.get_json() or {}
        account = _account()
        tx_builder = contract.functions.updateIPFSHash(
            int(payload.get('token_id')),
            payload.get('ipfs_hash', ''),
            payload.get('certificate_hash', ''),
        )
        tx_hash = send_contract_transaction(w3, tx_builder, account, fallback_gas=500000)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
        return jsonify({
            "success": receipt.status == 1,
            "transaction_hash": tx_hash.hex(),
            "block_number": receipt.blockNumber,
            "actor": user.get("username"),
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@blockchain_bp.route('/transactions', methods=['GET'])
def get_transactions():
    try:
        readiness_error = _require_blockchain_ready()
        if readiness_error:
            return readiness_error
        user, auth_error = _require_role("admin", allow_admin=True)
        if auth_error:
            return auth_error
        latest = w3.eth.block_number
        start = max(0, latest - 20)
        txs = []
        for block_no in range(start, latest + 1):
            block = w3.eth.get_block(block_no, full_transactions=True)
            for tx in block.transactions:
                if tx.to and tx.to.lower() == CONTRACT_ADDRESS.lower():
                    txs.append({
                        "hash": tx.hash.hex(),
                        "block_number": block_no,
                        "from": tx["from"],
                        "to": tx.to,
                        "value": str(tx.value),
                    })
        return jsonify({"connected": True, "transactions": txs, "actor": user.get("username")})
    except Exception as e:
        return jsonify({"connected": False, "transactions": [], "error": str(e)})
