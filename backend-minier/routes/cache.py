from flask import Blueprint, jsonify as flask_jsonify
from utils.soap_utils import soap_response

cache_bp = Blueprint('cache', __name__)


def jsonify(payload, *args, **kwargs):
    status = kwargs.pop('status', 200)
    action = kwargs.pop('soap_action', 'CacheResponse')
    return soap_response(payload, action=action, status=status)

@cache_bp.route('/cache/clear', methods=['POST', 'GET'])
def clear_cache():
    """
    Endpoint pour signaler au frontend de vider son cache.
    Le frontend recevra une instruction pour vider localStorage et sessionStorage.
    """
    return jsonify({
        "success": True,
        "message": "Cache cleared",
        "action": "CLEAR_CACHE"
    })
