import threading
import time
from typing import Any, Dict, Optional


_ACCOUNT_LOCKS: Dict[str, threading.Lock] = {}
_ACCOUNT_LOCKS_GUARD = threading.Lock()


def _get_account_lock(account: str) -> threading.Lock:
    with _ACCOUNT_LOCKS_GUARD:
        lock = _ACCOUNT_LOCKS.get(account)
        if lock is None:
            lock = threading.Lock()
            _ACCOUNT_LOCKS[account] = lock
        return lock


def _is_nonce_error(error: Exception) -> bool:
    message = str(error).lower()
    return any(
        phrase in message
        for phrase in (
            "nonce too low",
            "replacement transaction underpriced",
            "already known",
            "known transaction",
        )
    )


def _gas_limit_for_call(w3, tx_builder, account: str, fallback_gas: int, gas_margin: float) -> int:
    try:
        estimated = tx_builder.estimate_gas({"from": account})
        estimated = int(float(estimated))
        margin = int(max(21_000, estimated * gas_margin))
        return max(margin, 50_000)
    except Exception:
        return int(fallback_gas)


def send_contract_transaction(
    w3,
    tx_builder,
    account: Optional[str],
    private_key: str = "",
    *,
    chain_id: Optional[int] = None,
    fallback_gas: int = 3_000_000,
    gas_margin: float = 1.2,
    max_attempts: int = 4,
    backoff_factor: float = 1.0,
):
    """
    Send a smart-contract transaction with:
    - nonce serialization per account,
    - nonce refresh and retry on conflicts,
    - dynamic gas estimation with fallback.
    """
    if not account:
        raise RuntimeError("Aucun compte blockchain disponible")

    account_lock = _get_account_lock(account)
    private_key = (private_key or "").strip()
    chain_id = int(chain_id if chain_id is not None else getattr(w3.eth, "chain_id", 1337))

    with account_lock:
        last_error: Optional[Exception] = None

        for attempt in range(1, max_attempts + 1):
            try:
                nonce = w3.eth.get_transaction_count(account, "pending")
                gas_limit = _gas_limit_for_call(w3, tx_builder, account, fallback_gas, gas_margin)
                tx_params: Dict[str, Any] = {
                    "from": account,
                    "nonce": nonce,
                    "gas": gas_limit,
                    "chainId": chain_id,
                }

                try:
                    tx_params["gasPrice"] = int(w3.eth.gas_price)
                except Exception:
                    pass

                transaction = tx_builder.build_transaction(tx_params)

                if private_key:
                    signed_txn = w3.eth.account.sign_transaction(transaction, private_key)
                    tx_hash = w3.eth.send_raw_transaction(signed_txn.raw_transaction)
                else:
                    tx_hash = w3.eth.send_transaction(transaction)

                return tx_hash
            except Exception as error:
                last_error = error
                if attempt < max_attempts and _is_nonce_error(error):
                    time.sleep(max(0.0, backoff_factor * (2 ** (attempt - 1))))
                    continue
                if attempt < max_attempts and "gas" in str(error).lower():
                    time.sleep(max(0.0, backoff_factor * (2 ** (attempt - 1))))
                    continue
                raise RuntimeError(f"Transaction blockchain impossible: {error}") from error

        raise RuntimeError(f"Transaction blockchain impossible apres retries: {last_error}")
