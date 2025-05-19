from flask import Blueprint, request, jsonify
from app import db
from app.models import FinancialTransaction
from flask_login import login_required

bp = Blueprint('finance', __name__)

@bp.route('/transactions', methods=['GET'])
@login_required
def list_transactions():
    args = request.args
    query = FinancialTransaction.query
    if 'category' in args:
        query = query.filter_by(category=args['category'])
    if 'date_from' in args:
        query = query.filter(FinancialTransaction.date >= args['date_from'])
    if 'date_to' in args:
        query = query.filter(FinancialTransaction.date <= args['date_to'])
    txs = query.all()
    return jsonify([{
        'id': t.id,
        'type': t.type,
        'amount': str(t.amount),
        'category': t.category,
        'date': t.date.isoformat(),
        'description': t.description
    } for t in txs])

@bp.route('/transactions', methods=['POST'])
@login_required
def create_transaction():
    data = request.get_json()
    t = FinancialTransaction(
        type=data['type'],
        amount=data['amount'],
        category=data['category'],
        date=data['date'],
        description=data.get('description', '')
    )
    db.session.add(t)
    db.session.commit()
    return jsonify({'id': t.id}), 201