from flask import Blueprint, jsonify, request
from flask_login import login_required
from app.models import RecurringSchedule, ClassType, User

bp = Blueprint('classes', __name__, url_prefix='/classes')

@bp.route('', methods=['GET'])
@bp.route('/', methods=['GET'])
@login_required
def list_classes():
    trainer_id = request.args.get('trainerId', type=int)
    query = RecurringSchedule.query
    if trainer_id:
        query = query.filter_by(trainer_id=trainer_id)
    schedules = query.all()

    out = []
    for sched in schedules:
        ctype   = ClassType.query.get(sched.type_id)
        trainer = User.query.get(sched.trainer_id)
        out.append({
            'id':          sched.id,
            'name':        ctype.name,
            'description': ctype.name,  # можно расширить в будущем
            'trainer':     {'name': trainer.name},
            'start_time':  sched.start_time.isoformat()
        })
    return jsonify(out)
