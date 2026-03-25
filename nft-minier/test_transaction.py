"""
test_transaction.py — Test de transaction réelle sur Ganache
MineralNFT v2.0 — mintMineralToken() avec tous les paramètres

Usage :
    pip install web3==6.15.1
    python test_transaction.py
"""

from web3 import Web3
import json, sys, time

# ── Config ────────────────────────────────────────────────────────────────────
GANACHE_URL      = "http://127.0.0.1:7545"
CONTRACT_ADDRESS = "0xE7A51a1136968A33fE06bAc07B5794757E349Fbb"
PRIVATE_KEY      = ""  # Laisser vide pour utiliser les comptes Ganache déverrouillés

# ABI minimal pour le test
ABI = [
    {"inputs":[],"name":"name","outputs":[{"type":"string"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"symbol","outputs":[{"type":"string"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"totalSupply","outputs":[{"type":"uint256"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"type":"address"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"name":"lotId","type":"string"}],"name":"getTokenByLot","outputs":[{"type":"uint256"}],"stateMutability":"view","type":"function"},
    {
        "inputs":[
            {"name":"to","type":"address"},{"name":"lotId","type":"string"},
            {"name":"site","type":"string"},{"name":"mineralType","type":"string"},
            {"name":"impurityLevel","type":"string"},{"name":"confidence","type":"uint256"},
            {"name":"iaSignature","type":"string"},{"name":"isAuthentic","type":"bool"},
            {"name":"certificateHash","type":"string"},{"name":"ipfsHash","type":"string"},
            {"name":"cuGrade","type":"uint256"},{"name":"coGrade","type":"uint256"},
            {"name":"feGrade","type":"uint256"},{"name":"weight","type":"uint256"}
        ],
        "name":"mintMineralToken","outputs":[{"type":"uint256"}],"stateMutability":"nonpayable","type":"function"
    },
    {
        "inputs":[{"name":"tokenId","type":"uint256"}],
        "name":"getMineralData",
        "outputs":[
            {"name":"lotId","type":"string"},{"name":"site","type":"string"},
            {"name":"mineralType","type":"string"},{"name":"impurityLevel","type":"string"},
            {"name":"confidence","type":"uint256"},{"name":"iaSignature","type":"string"},
            {"name":"isAuthentic","type":"bool"},{"name":"ipfsHash","type":"string"},
            {"name":"cuGrade","type":"uint256"},{"name":"coGrade","type":"uint256"},
            {"name":"feGrade","type":"uint256"},{"name":"weight","type":"uint256"},
            {"name":"mintedAt","type":"uint256"},{"name":"dgmrValidated","type":"bool"},
            {"name":"dgmrStatus","type":"string"}
        ],
        "stateMutability":"view","type":"function"
    },
    {
        "anonymous":False,"inputs":[
            {"indexed":True,"name":"tokenId","type":"uint256"},
            {"indexed":True,"name":"to","type":"address"},
            {"indexed":False,"name":"lotId","type":"string"},
            {"indexed":False,"name":"site","type":"string"},
            {"indexed":False,"name":"mineralType","type":"string"},
            {"indexed":False,"name":"isAuthentic","type":"bool"},
            {"indexed":False,"name":"confidence","type":"uint256"}
        ],"name":"MineralMinted","type":"event"
    }
]

# ── Connexion ─────────────────────────────────────────────────────────────────
print("=" * 60)
print("  MineralNFT — Test de transaction mintMineralToken()")
print("=" * 60)
print(f"\nConnexion a Ganache : {GANACHE_URL}")

w3 = Web3(Web3.HTTPProvider(GANACHE_URL))

if not w3.is_connected():
    print("ERREUR : Ganache non connecte !")
    print("Verifiez que Ganache est démarré sur le port 7545")
    sys.exit(1)

print(f"Connecte ! Block courant : #{w3.eth.block_number}")

accounts = w3.eth.accounts
print(f"\nComptes disponibles : {len(accounts)}")
for i, acc in enumerate(accounts[:4]):
    bal = w3.from_wei(w3.eth.get_balance(acc), 'ether')
    label = ["Owner (minter)", "Producteur", "Regulateur DGMR", "Transporteur"][i] if i < 4 else ""
    print(f"  [{i}] {acc}  {bal:.2f} ETH  <- {label}")

# ── Contrat ───────────────────────────────────────────────────────────────────
print(f"\nContrat MineralNFT : {CONTRACT_ADDRESS}")
contract = w3.eth.contract(
    address=Web3.to_checksum_address(CONTRACT_ADDRESS),
    abi=ABI
)

try:
    name   = contract.functions.name().call()
    symbol = contract.functions.symbol().call()
    total  = contract.functions.totalSupply().call()
    print(f"  Nom     : {name}")
    print(f"  Symbole : {symbol}")
    print(f"  NFTs    : {total}")
except Exception as e:
    print(f"ERREUR lecture contrat : {e}")
    print("Le contrat n'est peut-être pas déployé. Lancez : truffle migrate --reset")
    sys.exit(1)

# ── Données du lot de test ────────────────────────────────────────────────────
import random, time as tm
LOT_ID = f"KAMOA-TEST-{int(tm.time()) % 10000:04d}"

lot_data = {
    "to":              accounts[1],   # Producteur
    "lotId":           LOT_ID,
    "site":            "KAMOA",
    "mineralType":     "copper",
    "impurityLevel":   "low",
    "confidence":      9650,          # 96.50%
    "iaSignature":     "0x7ccffb17ae1da04d",
    "isAuthentic":     True,
    "certificateHash": f"sha256:test{LOT_ID}",
    "ipfsHash":        "ipfs://QmTest12345",
    "cuGrade":         324,           # 3.24%
    "coGrade":         12,            # 0.12%
    "feGrade":         123,           # 1.23%
    "weight":          2530,          # 25.30 t
}

print(f"\nLot a certifier :")
print(f"  ID          : {lot_data['lotId']}")
print(f"  Site        : {lot_data['site']}")
print(f"  Minerai     : {lot_data['mineralType']}")
print(f"  Confiance   : {lot_data['confidence']/100}%")
print(f"  Cu          : {lot_data['cuGrade']/100}%")
print(f"  Co          : {lot_data['coGrade']/100}%")
print(f"  Poids       : {lot_data['weight']/100} t")
print(f"  Authentique : {lot_data['isAuthentic']}")

# ── Transaction ───────────────────────────────────────────────────────────────
print("\nEnvoi de la transaction mintMineralToken()...")

owner = accounts[0]

try:
    # Build transaction
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

    tx = func.build_transaction({
        'from':     owner,
        'gas':      350000,
        'gasPrice': w3.eth.gas_price,
        'nonce':    w3.eth.get_transaction_count(owner),
    })

    if PRIVATE_KEY:
        # Signer avec clé privée
        signed = w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
    else:
        # Ganache dev — comptes déverrouillés
        tx_hash = w3.eth.send_transaction(tx)

    print(f"Transaction envoyee !")
    print(f"  Hash : {tx_hash.hex()}")

    print("Attente de confirmation...")
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=30)

    if receipt.status != 1:
        print(f"ERREUR : Transaction revertee (status={receipt.status})")
        sys.exit(1)

    print(f"\nTransaction confirmee !")
    print(f"  Hash         : {tx_hash.hex()}")
    print(f"  Block        : #{receipt.blockNumber}")
    print(f"  Gas utilise  : {receipt.gasUsed}")
    print(f"  Status       : {'OK' if receipt.status == 1 else 'ECHEC'}")

    # Extraire tokenId depuis l'event
    try:
        events = contract.events.MineralMinted().process_receipt(receipt)
        if events:
            token_id = events[0]['args']['tokenId']
            print(f"\n  Token NFT cree : #{token_id}")
            print(f"  LotId          : {events[0]['args']['lotId']}")
            print(f"  Site           : {events[0]['args']['site']}")
            print(f"  Recipient      : {events[0]['args']['to']}")
        else:
            # Fallback : lire depuis le mapping
            token_id = contract.functions.getTokenByLot(LOT_ID).call()
            print(f"\n  Token NFT cree (via mapping) : #{token_id}")
    except Exception as e:
        print(f"  (Impossible de lire l'event : {e})")
        token_id = contract.functions.getTokenByLot(LOT_ID).call()
        print(f"  Token ID (via mapping) : #{token_id}")

    # Lire les données du token
    try:
        data = contract.functions.getMineralData(token_id).call()
        print(f"\nDonnees du token #{token_id} :")
        print(f"  lotId          : {data[0]}")
        print(f"  site           : {data[1]}")
        print(f"  mineralType    : {data[2]}")
        print(f"  impurityLevel  : {data[3]}")
        print(f"  confidence     : {data[4]/100}%")
        print(f"  isAuthentic    : {data[6]}")
        print(f"  cuGrade        : {data[8]/100}%")
        print(f"  coGrade        : {data[9]/100}%")
        print(f"  feGrade        : {data[10]/100}%")
        print(f"  weight         : {data[11]/100} t")
        print(f"  dgmrValidated  : {data[13]}")
        print(f"  dgmrStatus     : {data[14]}")
    except Exception as e:
        print(f"  Erreur lecture donnees : {e}")

    # totalSupply final
    total_after = contract.functions.totalSupply().call()
    print(f"\ntotalSupply apres mint : {total_after}")
    print(f"(Visible dans Ganache UI > TRANSACTIONS)\n")

    print("=" * 60)
    print("  TEST REUSSI - La transaction est visible dans Ganache !")
    print("=" * 60)

except Exception as e:
    print(f"\nERREUR lors de la transaction : {e}")
    print("\nVerifiez :")
    print("  1. Ganache est démarré sur le port 7545")
    print("  2. Le contrat est déployé : truffle migrate --reset")
    print("  3. L'adresse du contrat est correcte dans ce fichier")
    sys.exit(1)
