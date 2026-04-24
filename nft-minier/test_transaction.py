"""
test_transaction.py - Test de transaction reelle sur Ganache
MineralNFT v2.0 - mintMineralToken() avec tous les parametres

Usage :
    pip install web3==6.15.1
    python test_transaction.py
"""

from pathlib import Path
import sys
import time as tm

from web3 import Web3


BASE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = BASE_DIR.parent / "backend-minier"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from utils.blockchain_config import load_contract_config
from utils.experiment_logger import record_auto_validation_run


CONTRACT_CONFIG = load_contract_config()
GANACHE_URL = CONTRACT_CONFIG["ganache_url"]
CONTRACT_ADDRESS = str(CONTRACT_CONFIG["address"])
ABI = CONTRACT_CONFIG["abi"]
PRIVATE_KEY = ""  # Laisser vide pour utiliser les comptes Ganache deverrouilles


print("=" * 60)
print("  MineralNFT - Test de transaction mintMineralToken()")
print("=" * 60)
print(f"\nConnexion a Ganache : {GANACHE_URL}")

w3 = Web3(Web3.HTTPProvider(GANACHE_URL))

if not w3.is_connected():
    print("ERREUR : Ganache non connecte !")
    print("Verifiez que Ganache est demarre sur le port configure")
    try:
        record_auto_validation_run(
            lot_id="",
            http_status=500,
            success=False,
            result_status="Partiellement conforme",
            message="Test transaction blockchain impossible: Ganache non connecte",
            error="Ganache non connecte",
            test_name="TC-09 Transaction blockchain reelle sur Ganache",
            source="nft-minier.test_transaction",
        )
    except Exception as log_error:
        print(f"WARN export resultats impossible: {log_error}")
    sys.exit(1)

print(f"Connecte ! Block courant : #{w3.eth.block_number}")

accounts = w3.eth.accounts
print(f"\nComptes disponibles : {len(accounts)}")
for i, acc in enumerate(accounts[:4]):
    bal = w3.from_wei(w3.eth.get_balance(acc), 'ether')
    label = ["Owner (minter)", "Producteur", "Regulateur DGMR", "Transporteur"][i] if i < 4 else ""
    print(f"  [{i}] {acc}  {bal:.2f} ETH  <- {label}")

print(f"\nContrat MineralNFT : {CONTRACT_ADDRESS}")
contract = w3.eth.contract(
    address=Web3.to_checksum_address(CONTRACT_ADDRESS),
    abi=ABI
)

try:
    name = contract.functions.name().call()
    symbol = contract.functions.symbol().call()
    total = contract.functions.totalSupply().call()
    print(f"  Nom     : {name}")
    print(f"  Symbole : {symbol}")
    print(f"  NFTs    : {total}")
except Exception as error:
    print(f"ERREUR lecture contrat : {error}")
    print("Le contrat n'est peut-etre pas deploye ou l'adresse est incorrecte.")
    sys.exit(1)

lot_id = f"KAMOA-TEST-{int(tm.time()) % 10000:04d}"
lot_data = {
    "to": accounts[1],
    "lotId": lot_id,
    "site": "KAMOA",
    "mineralType": "copper",
    "impurityLevel": "low",
    "confidence": 9650,
    "iaSignature": "0x7ccffb17ae1da04d",
    "isAuthentic": True,
    "certificateHash": f"sha256:test{lot_id}",
    "ipfsHash": "ipfs://QmTest12345",
    "cuGrade": 324,
    "coGrade": 12,
    "feGrade": 123,
    "weight": 2530,
}

print("\nLot a certifier :")
print(f"  ID          : {lot_data['lotId']}")
print(f"  Site        : {lot_data['site']}")
print(f"  Minerai     : {lot_data['mineralType']}")
print(f"  Confiance   : {lot_data['confidence'] / 100}%")
print(f"  Cu          : {lot_data['cuGrade'] / 100}%")
print(f"  Co          : {lot_data['coGrade'] / 100}%")
print(f"  Poids       : {lot_data['weight'] / 100} t")
print(f"  Authentique : {lot_data['isAuthentic']}")

print("\nEnvoi de la transaction mintMineralToken()...")
owner = accounts[0]

try:
    func = contract.functions.mintMineralToken(
        Web3.to_checksum_address(lot_data["to"]),
        lot_data["lotId"],
        lot_data["site"],
        lot_data["mineralType"],
        lot_data["impurityLevel"],
        lot_data["confidence"],
        lot_data["iaSignature"],
        lot_data["isAuthentic"],
        lot_data["certificateHash"],
        lot_data["ipfsHash"],
        lot_data["cuGrade"],
        lot_data["coGrade"],
        lot_data["feGrade"],
        lot_data["weight"],
    )

    estimated_gas = func.estimate_gas({"from": owner})
    gas_limit = max(int(estimated_gas * 1.2), 500000)
    print(f"Gas estime      : {estimated_gas}")
    print(f"Gas retenu      : {gas_limit}")

    tx = func.build_transaction({
        "from": owner,
        "gas": gas_limit,
        "gasPrice": w3.eth.gas_price,
        "nonce": w3.eth.get_transaction_count(owner),
    })

    if PRIVATE_KEY:
        signed = w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
    else:
        tx_hash = w3.eth.send_transaction(tx)

    print("Transaction envoyee !")
    print(f"  Hash : {tx_hash.hex()}")

    print("Attente de confirmation...")
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=30)

    if receipt.status != 1:
        print(f"ERREUR : Transaction revertee (status={receipt.status})")
        sys.exit(1)

    print("\nTransaction confirmee !")
    print(f"  Hash         : {tx_hash.hex()}")
    print(f"  Block        : #{receipt.blockNumber}")
    print(f"  Gas utilise  : {receipt.gasUsed}")
    print(f"  Status       : {'OK' if receipt.status == 1 else 'ECHEC'}")

    try:
        events = contract.events.MineralMinted().process_receipt(receipt)
        if events:
            token_id = events[0]["args"]["tokenId"]
            print(f"\n  Token NFT cree : #{token_id}")
            print(f"  LotId          : {events[0]['args']['lotId']}")
            print(f"  Site           : {events[0]['args']['site']}")
            print(f"  Recipient      : {events[0]['args']['to']}")
        else:
            token_id = contract.functions.getTokenByLot(lot_id).call()
            print(f"\n  Token NFT cree (via mapping) : #{token_id}")
    except Exception as error:
        print(f"  (Impossible de lire l'event : {error})")
        token_id = contract.functions.getTokenByLot(lot_id).call()
        print(f"  Token ID (via mapping) : #{token_id}")

    try:
        data = contract.functions.getMineralData(token_id).call()
        print(f"\nDonnees du token #{token_id} :")
        print(f"  lotId          : {data[0]}")
        print(f"  site           : {data[1]}")
        print(f"  mineralType    : {data[2]}")
        print(f"  impurityLevel  : {data[3]}")
        print(f"  confidence     : {data[4] / 100}%")
        print(f"  isAuthentic    : {data[6]}")
        print(f"  cuGrade        : {data[8] / 100}%")
        print(f"  coGrade        : {data[9] / 100}%")
        print(f"  feGrade        : {data[10] / 100}%")
        print(f"  weight         : {data[11] / 100} t")
        print(f"  dgmrValidated  : {data[13]}")
        print(f"  dgmrStatus     : {data[14]}")
    except Exception as error:
        print(f"  Erreur lecture donnees : {error}")

    total_after = contract.functions.totalSupply().call()
    print(f"\ntotalSupply apres mint : {total_after}")
    print("(Visible dans Ganache UI > TRANSACTIONS)\n")

    print("=" * 60)
    print("  TEST REUSSI - La transaction est visible dans Ganache !")
    print("=" * 60)
    try:
        record_auto_validation_run(
            lot_id=lot_data["lotId"],
            site=lot_data["site"],
            mineral_type=lot_data["mineralType"],
            http_status=200,
            success=True,
            result_status="Partiellement conforme",
            params_compared=0,
            conformes=0,
            validated_by="ganache",
            message=f"Transaction confirmee, token cree #{token_id}",
            comparison=[],
            test_name="TC-09 Transaction blockchain reelle sur Ganache",
            source="nft-minier.test_transaction",
        )
    except Exception as log_error:
        print(f"WARN export resultats impossible: {log_error}")

except Exception as error:
    print(f"\nERREUR lors de la transaction : {error}")
    print("\nVerifiez :")
    print("  1. Ganache est demarre sur le port configure")
    print("  2. Le contrat est deploye")
    print("  3. L'adresse du contrat active est correcte")
    try:
        record_auto_validation_run(
            lot_id=lot_data.get("lotId", ""),
            site=lot_data.get("site", ""),
            mineral_type=lot_data.get("mineralType", ""),
            http_status=500,
            success=False,
            result_status="Partiellement conforme",
            params_compared=0,
            conformes=0,
            validated_by="ganache",
            message="Echec de la transaction blockchain reelle",
            error=str(error),
            comparison=[],
            test_name="TC-09 Transaction blockchain reelle sur Ganache",
            source="nft-minier.test_transaction",
        )
    except Exception as log_error:
        print(f"WARN export resultats impossible: {log_error}")
    sys.exit(1)
