from datetime import datetime, timezone

from database.models import Lot, LotHistory, db
from app import app
from routes.blockchain import CONTRACT_ADDRESS, contract, w3


def find_contract_transaction(block_number):
    if block_number is None or not w3.is_connected():
        return None

    block = w3.eth.get_block(block_number, full_transactions=True)
    for tx in block.transactions:
        if tx.to and tx.to.lower() == CONTRACT_ADDRESS.lower():
            return tx.hash.hex()
    return None


def main():
    if not app.config.get("DATABASE_ENABLED"):
        raise RuntimeError("PostgreSQL indisponible ou non configure")

    synced = 0
    now = datetime.now(timezone.utc)
    total_supply = int(contract.functions.totalSupply().call())

    with app.app_context():
        for token_id in range(1, total_supply + 1):
            data = contract.functions.getMineralData(token_id).call()
            lot_id = data[0]
            if not lot_id:
                continue

            block_number = None
            tx_hash = None
            for block_no in range(max(0, w3.eth.block_number - 500), w3.eth.block_number + 1):
                candidate = find_contract_transaction(block_no)
                if candidate:
                    block_number = block_no
                    tx_hash = candidate

            lot = Lot.query.filter_by(lot_id=lot_id).first()
            if not lot:
                lot = Lot(
                    lot_id=lot_id,
                    site=data[1] or "KAMOA",
                    extraction_date=now.date(),
                    created_at=now,
                    owner_user_id="demo-producer-001",
                    owner_username="producteur",
                    owner_name="Jean-Baptiste Mutombo",
                )
                db.session.add(lot)

            lot.site = data[1] or lot.site or "KAMOA"
            lot.status = "AUTHENTIQUE" if data[6] else "SUSPECT"
            lot.mineral_type = data[2] or lot.mineral_type
            lot.impurity_level = data[3] or lot.impurity_level
            lot.confidence = (data[4] or 0) / 100
            lot.token_id = token_id
            lot.tx_hash = tx_hash
            lot.block_number = block_number
            lot.contract_address = CONTRACT_ADDRESS
            lot.cu_grade = (data[8] or 0) / 100
            lot.co_grade = (data[9] or 0) / 100
            lot.fe_grade = (data[10] or 0) / 100
            lot.weight = (data[11] or 0) / 100
            lot.analyzed_at = lot.analyzed_at or now
            lot.updated_at = now
            lot.regulator_validated = bool(data[13])
            if lot.regulator_validated and not lot.regulator_validated_at:
                lot.regulator_validated_at = now

            db.session.add(LotHistory(
                lot=lot,
                event="SYNCED_FROM_BLOCKCHAIN",
                status=lot.status,
                details={
                    "token_id": token_id,
                    "tx_hash": tx_hash,
                    "contract_address": CONTRACT_ADDRESS,
                },
                timestamp=now,
            ))
            synced += 1

        db.session.commit()

    print(f"total_supply={total_supply}")
    print(f"synced_tokens={synced}")


if __name__ == "__main__":
    main()
