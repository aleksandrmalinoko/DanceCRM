from flask import Blueprint, request, jsonify, send_file
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from app import db
from app.models import User
import qrcode
from io import BytesIO

bp = Blueprint('auth', __name__, url_prefix='/auth')

@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    user = User(
        name=data['name'],
        email=data['email'],
        password_hash=generate_password_hash(data['password']),
        role=data['role']
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({'id': user.id}), 201

@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    if not user or not check_password_hash(user.password_hash, data['password']):
        return jsonify({'message': 'Неверные учётные данные'}), 401
    login_user(user)
    return '', 204

@bp.route('/me', methods=['GET'])
@login_required
def me():
    user = current_user
    return jsonify({'id': user.id, 'name': user.name, 'role': user.role})

@bp.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return '', 204

# Новый маршрут: отдаёт QR-код с ID текущего пользователя
@bp.route('/qrcode', methods=['GET'])
@login_required
def qrcode_route():
    # Генерируем QR с текстом равным ID пользователя
    img = qrcode.make(current_user.uid)
    buf = BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    return send_file(buf, mimetype='image/png')
