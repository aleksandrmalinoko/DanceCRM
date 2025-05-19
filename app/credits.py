from flask import Blueprint, jsonify
from flask_login import login_required, current_user

bp = Blueprint('credits', __name__, url_prefix='/credits')

@bp.route('', methods=['GET'])
@bp.route('/', methods=['GET'])
@login_required
def my_credits():
    return jsonify({'remaining': current_user.remaining_credits})
