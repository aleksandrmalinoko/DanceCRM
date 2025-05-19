# app/attendance.py

from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, abort
from flask_login import login_required, current_user
from app import db
from app.models import Attendance, RecurringSchedule, User
from app.models import User
bp = Blueprint('attendance', __name__, url_prefix='/attendance')


@bp.route('', methods=['GET'])
@bp.route('/', methods=['GET'])
@login_required
def list_attendance():
    """
    GET /attendance?date=YYYY-MM-DD&trainerId=<id>
    Возвращает список посещений на указанный день.
    """
    date_str   = request.args.get('date')
    trainer_id = request.args.get('trainerId', type=int)

    if not date_str:
        abort(400, 'Missing date')

    # Диапазон [дата, дата+1)
    day_start = datetime.fromisoformat(date_str)
    day_end   = day_start + timedelta(days=1)

    # Все Attendance за этот день
    query = Attendance.query.filter(
        Attendance.timestamp >= day_start,
        Attendance.timestamp <  day_end
    )

    # Если указан trainerId, фильтруем через связь с RecurringSchedule
    if trainer_id:
        # предполагаем, что class_id → RecurringSchedule.id
        query = query.join(
            RecurringSchedule,
            RecurringSchedule.id == Attendance.class_id
        ).filter(
            RecurringSchedule.trainer_id == trainer_id
        )

    records = query.all()
    return jsonify([
        {
            'id':   rec.student_id,
            'name': rec.student.name
        }
        for rec in records
    ])


@bp.route('/mark',  methods=['POST'])
@bp.route('/mark/', methods=['POST'])
@login_required
def mark_attendance():
    """
    POST /attendance/mark
    Body JSON: { studentId: <id> }
    Создаёт Attendance(student_id=..., timestamp=now).
    """
    data = request.get_json() or {}
    student_id = data.get('studentId')

    if not student_id:
        abort(400, 'Missing studentId')


    # 1) Сначала создаём attendance-запись
    att = Attendance(student_id=student_id)
    db.session.add(att)
    # 2) Затем уменьшаем оставшиеся занятия у студента
    student = User.query.get_or_404(student_id)
    if student.remaining_credits <= 0:
        abort(400, 'No remaining credits')
    student.remaining_credits -= 1
    db.session.add(student)
    # и теперь сохраняем обе операции разом
    db.session.commit()

    return jsonify({}), 200
