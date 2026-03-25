import json
import os
from pathlib import Path

from web3 import Web3


BASE_DIR = Path(__file__).resolve().parents[1]
PROJECT_DIR = BASE_DIR.parent
CONTRACT_JSON_PATH = PROJECT_DIR / 'nft-minier' / 'build' / 'contracts' / 'MineralNFT.json'
GANACHE_URL = os.getenv('GANACHE_URL', 'http://127.0.0.1:7545')
DEFAULT_CONTRACT_ADDRESS = '0x3Bff0f7B1f4f3558F83FAd968bF3eAeB82A236A4'


def load_contract_config():
    contract_json = json.loads(CONTRACT_JSON_PATH.read_text(encoding='utf-8'))
    contract_address = (
        (os.getenv('CONTRACT_ADDRESS') or '').strip()
        or contract_json.get('networks', {}).get('5777', {}).get('address')
        or DEFAULT_CONTRACT_ADDRESS
    )
    return {
        'artifact': contract_json,
        'abi': contract_json['abi'],
        'address': Web3.to_checksum_address(contract_address),
        'ganache_url': GANACHE_URL,
    }

