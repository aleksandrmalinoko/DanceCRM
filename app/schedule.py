from flask import Blueprint, request, jsonify
from app import db
from app.models import ClassType, RecurringSchedule
from datetime import datetime, date, time, timedelta
from app.models import User

bp = Blueprint('schedule', __name__, url_prefix='/schedule')

# --- Типы занятий: (unchanged) ---
@bp.route('/types', methods=['GET'])
@bp.route('/types/', methods=['GET'])
def list_types():
    types = ClassType.query.all()
    return jsonify([{'id': t.id, 'name': t.name} for t in types])

@bp.route('/types', methods=['POST'])
@bp.route('/types/', methods=['POST'])
def create_type():
    name = request.json.get('name')
    ct = ClassType(name=name)
    db.session.add(ct)
    db.session.commit()
    return jsonify({'id': ct.id, 'name': ct.name}), 201

# --- Расписание: список с учётом отмены серии и отдельных дат ---
@bp.route('', methods=['GET'])
@bp.route('/', methods=['GET'])
def list_schedule():
    frm        = request.args.get('from')
    to         = request.args.get('to')
    types_csv  = request.args.get('types')
    trainer_id = request.args.get('trainerId')

    date_from = datetime.fromisoformat(frm).date()
    date_to   = datetime.fromisoformat(to).date()

    query = RecurringSchedule.query
    if types_csv:
        ids = [int(i) for i in types_csv.split(',') if i]
        query = query.filter(RecurringSchedule.type_id.in_(ids))
    if trainer_id:
        query = query.filter_by(trainer_id=trainer_id)

    events = []
    cur = date_from
    while cur <= date_to:
        dow = cur.strftime('%a')
        for sched in query:
            # fetch our cancellation markers
            if cur < sched.start_date:
                continue
            series_cancel_from = sched.cancelled_dates.get('cancel_series_from')  # YYYY-MM-DD or None
            # skip if series was cancelled from this date forward
            if series_cancel_from:
                cutoff = datetime.fromisoformat(series_cancel_from).date()
                if cur >= cutoff:
                    continue

            # skip if this particular date was cancelled
            if str(cur) in sched.cancelled_dates:
                continue

            # normal recurring logic
            if sched.days_of_week.get(dow):
                  # подтягиваем тренера
                trainer = User.query.get(sched.trainer_id)
                events.append({
                    'id': sched.id,
                    'typeId': sched.type_id,
                    'trainerId': sched.trainer_id,
                    'trainerName': trainer.name,
                    'date': str(cur),
                    'startTime': sched.start_time.isoformat(),
                    'endTime': sched.end_time.isoformat(),
                })
        cur += timedelta(days=1)
    return jsonify(events)

# --- Создание серии (unchanged) ---
@bp.route('', methods=['POST'])
@bp.route('/', methods=['POST'])
def create_series():
    data = request.json
    sched = RecurringSchedule(
      type_id      = data['typeId'],
      trainer_id   = data['trainerId'],
      days_of_week = data['daysOfWeek'],
      start_date=datetime.fromisoformat(data['startDate']).date(),
      start_time   = time.fromisoformat(data['startTime']),
      end_time     = time.fromisoformat(data['endTime'])
    )
    db.session.add(sched)
    db.session.commit()
    return jsonify({'id': sched.id}), 201

# --- Отмена одной даты (unchanged) ---
@bp.route('/<int:schedule_id>/cancel_instance', methods=['POST'])
@bp.route('/<int:schedule_id>/cancel_instance/', methods=['POST'])
def cancel_instance(schedule_id):
    d     = request.json.get('date')  # 'YYYY-MM-DD'
    sched = RecurringSchedule.query.get_or_404(schedule_id)
    sched.cancelled_dates[str(d)] = True
    db.session.commit()
    return '', 204

# --- Отмена серии с этого дня и дальше ---
@bp.route('/<int:schedule_id>/cancel_series', methods=['POST'])
@bp.route('/<int:schedule_id>/cancel_series/', methods=['POST'])
def cancel_series(schedule_id):
    from_date = request.json.get('from')  # 'YYYY-MM-DD'
    sched = RecurringSchedule.query.get_or_404(schedule_id)
    # записываем единственный маркер отмены серии
    sched.cancelled_dates['cancel_series_from'] = from_date
    db.session.commit()
    return '', 204
