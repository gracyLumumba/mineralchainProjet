from __future__ import annotations

import hashlib
import hmac
import os
import time
from collections import OrderedDict

from flask import jsonify, request

MAX_CLOCK_SKEW_SECONDS = int(os.getenv("REQUEST_MAX_CLOCK_SKEW_SECONDS", "300"))
NONCE_TTL_SECONDS = int(os.getenv("REQUEST_NONCE_TTL_SECONDS", "600"))
NONCE_CACHE_MAX_SIZE = int(os.getenv("REQUEST_NONCE_CACHE_MAX_SIZE", "5000"))

_NONCE_CACHE: OrderedDict[str, float] = OrderedDict()


def _cleanup_nonce_cache(now: float) -> None:
    expiry = now - NONCE_TTL_SECONDS
    stale_keys = [nonce for nonce, seen_at in _NONCE_CACHE.items() if seen_at < expiry]
    for nonce in stale_keys:
        _NONCE_CACHE.pop(nonce, None)

    while len(_NONCE_CACHE) > NONCE_CACHE_MAX_SIZE:
        _NONCE_CACHE.popitem(last=False)


def _error(message: str, status: int = 400):
    return jsonify({"error": message}), status


def _authorization_token():
    auth_header = request.headers.get("Authorization", "").strip()
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ", 1)[1].strip()
    return token or None


def verify_signed_request(require_auth: bool = True):
    """
    Verify request integrity using headers bound to the bearer token:
    - X-MC-Timestamp
    - X-MC-Nonce
    - X-MC-Body-Hash
    - X-MC-Signature

    Signature = HMAC-SHA256(token, method + path + timestamp + nonce + body_hash)
    """
    token = _authorization_token()
    if not token:
        if require_auth:
            return _error("Authentification requise", 401)
        return None

    timestamp = request.headers.get("X-MC-Timestamp", "").strip()
    nonce = request.headers.get("X-MC-Nonce", "").strip()
    body_hash = request.headers.get("X-MC-Body-Hash", "").strip()
    signature = request.headers.get("X-MC-Signature", "").strip()

    if not timestamp or not nonce or not body_hash or not signature:
        return _error("En-tetes de securite manquants", 400)

    try:
        timestamp_value = float(timestamp)
    except ValueError:
        return _error("Timestamp de securite invalide", 400)

    now = time.time()
    if abs(now - timestamp_value) > MAX_CLOCK_SKEW_SECONDS:
        return _error("Requete expirée", 401)

    raw_body = request.get_data(cache=True) or b""
    computed_hash = hashlib.sha256(raw_body).hexdigest()
    if not hmac.compare_digest(body_hash, computed_hash):
        return _error("Empreinte de corps invalide", 400)

    canonical = "\n".join([
        request.method.upper(),
        request.path,
        timestamp,
        nonce,
        body_hash,
    ])
    expected = hmac.new(token.encode("utf-8"), canonical.encode("utf-8"), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(signature, expected):
        return _error("Signature de requete invalide", 401)

    _cleanup_nonce_cache(now)
    cached_at = _NONCE_CACHE.get(nonce)
    if cached_at and (now - cached_at) <= NONCE_TTL_SECONDS:
        return _error("Rejeu de requete detecte", 401)

    _NONCE_CACHE[nonce] = now
    _NONCE_CACHE.move_to_end(nonce)
    return None
