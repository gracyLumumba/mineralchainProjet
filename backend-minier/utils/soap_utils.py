from __future__ import annotations

import json
from html import escape
from xml.etree import ElementTree as ET

from flask import Response, request

SOAP_NS = "http://schemas.xmlsoap.org/soap/envelope/"
SOAP_ENV = f"{{{SOAP_NS}}}"


def _json_default(value):
    if hasattr(value, "isoformat"):
        try:
            return value.isoformat()
        except Exception:
            pass
    return str(value)


def build_soap_envelope(action: str, payload) -> str:
    payload_text = json.dumps(payload, ensure_ascii=False, default=_json_default)
    return (
        '<?xml version="1.0" encoding="utf-8"?>'
        f'<soap:Envelope xmlns:soap="{SOAP_NS}">'
        "<soap:Body>"
        f"<{action}>{escape(payload_text)}</{action}>"
        "</soap:Body>"
        "</soap:Envelope>"
    )


def parse_soap_payload(expected_action: str | None = None, fallback_json: bool = True):
    raw = (request.get_data(cache=True, as_text=True) or "").strip()
    if not raw:
        return {}

    if fallback_json and raw[:1] in {"{", "["}:
        return request.get_json(silent=True) or {}

    try:
        root = ET.fromstring(raw)
    except ET.ParseError:
        if fallback_json:
            return request.get_json(silent=True) or {}
        raise

    body = root.find(f".//{SOAP_ENV}Body")
    if body is None:
        return {}

    payload_element = None
    for child in list(body):
        if isinstance(child.tag, str):
            payload_element = child
            break

    if payload_element is None:
        return {}

    if expected_action and payload_element.tag.rsplit("}", 1)[-1] != expected_action:
        # Continue anyway so clients can still evolve operation names without breaking the server.
        pass

    payload_text = "".join(payload_element.itertext()).strip()
    if not payload_text:
        return {}

    try:
        return json.loads(payload_text)
    except json.JSONDecodeError:
        return {"_raw": payload_text}


def soap_response(payload, action: str = "Response", status: int = 200):
    xml = build_soap_envelope(action, payload)
    return Response(xml, status=status, content_type="text/xml; charset=utf-8")
