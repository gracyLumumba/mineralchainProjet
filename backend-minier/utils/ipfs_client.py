import time
from typing import Any, Dict, Iterable, Optional

import requests


RETRY_STATUS_CODES = {429, 500, 502, 503, 504}


def _sleep_for_attempt(attempt: int, backoff_factor: float) -> None:
    delay = max(0.0, backoff_factor * (2 ** max(0, attempt - 1)))
    if delay:
        time.sleep(delay)


def request_with_backoff(
    method: str,
    url: str,
    *,
    json_payload: Optional[Dict[str, Any]] = None,
    headers: Optional[Dict[str, str]] = None,
    timeout: float = 20.0,
    max_attempts: int = 4,
    backoff_factor: float = 1.0,
    retry_status_codes: Iterable[int] = RETRY_STATUS_CODES,
) -> requests.Response:
    """
    Execute an HTTP request with exponential backoff for transient IPFS failures.

    This intentionally retries POST timeouts because Pinata uploads are the main
    source of temporary certification failures in the project.
    """
    session = requests.Session()
    retry_status_codes = set(retry_status_codes)
    last_error: Optional[Exception] = None

    for attempt in range(1, max_attempts + 1):
        try:
            response = session.request(
                method=method,
                url=url,
                json=json_payload,
                headers=headers,
                timeout=timeout,
            )
            if response.status_code in retry_status_codes and attempt < max_attempts:
                last_error = RuntimeError(
                    f"HTTP {response.status_code}: {response.text[:200]}"
                )
            else:
                return response
        except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as exc:
            last_error = exc
        except requests.exceptions.RequestException as exc:
            last_error = exc

        if attempt < max_attempts:
            _sleep_for_attempt(attempt, backoff_factor)

    raise RuntimeError(f"Requete IPFS echouee apres {max_attempts} tentatives: {last_error}")


def build_pinata_headers(jwt: str) -> Dict[str, str]:
    if not jwt:
        raise RuntimeError("PINATA_JWT manquant")
    return {
        "Authorization": f"Bearer {jwt}",
        "Content-Type": "application/json",
    }


def upload_json_to_pinata(
    certificate_data: Dict[str, Any],
    *,
    lot_id: str,
    jwt: str,
    pin_json_url: str,
    gateway_url: str,
    name: Optional[str] = None,
    timeout: float = 20.0,
    max_attempts: int = 4,
    backoff_factor: float = 1.0,
) -> Dict[str, Any]:
    """
    Upload JSON to Pinata/IPFS with retries and exponential backoff.
    """
    metadata_name = name or f"certificate-{lot_id}"
    payload = {
        "pinataContent": certificate_data,
        "pinataMetadata": {
            "name": metadata_name,
            "keyvalues": {
                "lot_id": lot_id,
                "timestamp": str(time.time()),
                "type": "mineral_certificate",
            },
        },
        "pinataOptions": {
            "cidVersion": 1,
            "wrapWithDirectory": False,
        },
    }

    response = request_with_backoff(
        "POST",
        pin_json_url,
        json_payload=payload,
        headers=build_pinata_headers(jwt),
        timeout=timeout,
        max_attempts=max_attempts,
        backoff_factor=backoff_factor,
    )

    if response.status_code != 200:
        raise RuntimeError(f"Erreur Pinata {response.status_code}: {response.text[:200]}")

    result = response.json()
    ipfs_hash = result["IpfsHash"]
    return {
        "ipfs_hash": ipfs_hash,
        "ipfs_uri": f"ipfs://{ipfs_hash}",
        "gateway_url": f"{gateway_url}/ipfs/{ipfs_hash}",
        "raw": result,
    }


def fetch_json_from_gateway(
    gateway_url: str,
    ipfs_hash: str,
    *,
    timeout: float = 10.0,
    max_attempts: int = 3,
    backoff_factor: float = 0.8,
) -> Dict[str, Any]:
    clean_hash = ipfs_hash.replace("ipfs://", "")
    response = request_with_backoff(
        "GET",
        f"{gateway_url}/ipfs/{clean_hash}",
        timeout=timeout,
        max_attempts=max_attempts,
        backoff_factor=backoff_factor,
    )

    if response.status_code != 200:
        raise RuntimeError(f"Fichier non trouve sur IPFS ({response.status_code})")

    payload = response.json()
    return {
        "data": payload,
        "content": payload,
        "ipfs_hash": clean_hash,
        "source": "gateway",
    }
