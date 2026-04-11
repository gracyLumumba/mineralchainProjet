from flask import Blueprint, jsonify

cache_bp = Blueprint('cache', __name__)

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
