# app/users.py

from flask import Blueprint, request, jsonify, abort
from flask_login import login_required, current_user
from werkzeug.security import generate_password_hash
from app import db
from app.models import User, Attendance, Class

bp = Blueprint('users', __name__, url_prefix='/users')


@bp.route('', methods=['GET'])
@bp.route('/', methods=['GET'])
def list_users():
    role = request.args.get('role')
    uid  = request.args.get('uid')

    query = User.query
    if role:
        query = query.filter_by(role=role)
    if uid:
        query = query.filter_by(uid=uid)

    users = query.all()
    return jsonify([
        {
            'id':               u.id,
            'name':             u.name,
            'email':            u.email,
            'role':             u.role,
            'remainingCredits': u.remaining_credits
        }
        for u in users
    ])


@bp.route('', methods=['POST'])
@bp.route('/', methods=['POST'])
@login_required
def create_user():
    if current_user.role != 'admin':
        abort(403)
    data = request.get_json()
    user = User(
        name          = data['name'],
        email         = data['email'],
        password_hash = generate_password_hash(data['password']),
        role          = data['role']
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({
        'id':               user.id,
        'uid':              user.uid,
        'name':             user.name,
        'email':            user.email,
        'role':             user.role,
        'remainingCredits': user.remaining_credits
    }), 201


@bp.route('/<int:user_id>/stats', methods=['GET'])
@login_required
def user_stats(user_id):
    # только админ или сам пользователь
    if current_user.role != 'admin' and current_user.id != user_id:
        abort(403)

    user = User.query.get_or_404(user_id)

    if user.role == 'student':
        # Считаем все Attendance по student_id
        attended = Attendance.query.filter_by(student_id=user.id).count()
        return jsonify({ 'attendances': attended })

    elif user.role == 'trainer':
        # Считаем все занятия класса по trainer_id
        led = Class.query.filter_by(trainer_id=user.id).count()
        return jsonify({ 'classesLed': led })

    else:
        return jsonify({})


@bp.route('/<int:user_id>/credits', methods=['GET','PUT'])
@login_required
def credits(user_id):
    if current_user.role != 'admin' and current_user.id != user_id:
        abort(403)

    user = User.query.get_or_404(user_id)

    if request.method == 'GET':
        return jsonify({ 'remainingCredits': user.remaining_credits })

    # PUT
    data = request.get_json()
    if 'remainingCredits' not in data:
        abort(400, 'Missing remainingCredits')
    user.remaining_credits = data['remainingCredits']
    db.session.commit()
    return jsonify({ 'remainingCredits': user.remaining_credits })
