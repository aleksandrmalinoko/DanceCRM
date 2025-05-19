from datetime import datetime
from flask_login import UserMixin
from app import db, login
from datetime import time, date
from sqlalchemy.ext.mutable import MutableDict


class ClassType(db.Model):
    __tablename__ = 'class_type'
    id   = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), unique=True, nullable=False)


class RecurringSchedule(db.Model):
    __tablename__ = 'recurring_schedule'
    id           = db.Column(db.Integer, primary_key=True)
    type_id      = db.Column(db.Integer, db.ForeignKey('class_type.id'), nullable=False)
    trainer_id   = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    # Список дней недели, например {"Mon": true, "Wed": true}
    days_of_week = db.Column(MutableDict.as_mutable(db.JSON), nullable=False)
    start_time   = db.Column(db.Time, nullable=False)
    end_time     = db.Column(db.Time, nullable=False)

    # “Кейс отмены”: список конкретных дат, которые отменены
    cancelled_dates = db.Column(MutableDict.as_mutable(db.JSON), default={})
    start_date = db.Column(db.Date, nullable=False, default=date.today)


# Представление реального занятия в день:
class ClassInstance(db.Model):
    __tablename__ = 'class_instance'
    id         = db.Column(db.Integer, primary_key=True)
    schedule_id= db.Column(db.Integer, db.ForeignKey('recurring_schedule.id'), nullable=False)
    date       = db.Column(db.Date, nullable=False)
    # Если нужно — сохраните в JSON дополнительные поля
    extra_data   = db.Column(MutableDict.as_mutable(db.JSON), default={})


class User(UserMixin, db.Model):
    __tablename__ = 'user'
    id                 = db.Column(db.Integer, primary_key=True)
    name               = db.Column(db.String(128), nullable=False)
    email              = db.Column(db.String(128), unique=True, nullable=False)
    password_hash      = db.Column(db.String(255), nullable=False)
    role               = db.Column(db.String(32), nullable=False)
    remaining_credits  = db.Column(db.Integer, default=0)
    uid = db.Column(db.String(36), unique=True, nullable=False, default = lambda: str(__import__('uuid').uuid4()))


class Class(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), nullable=False)
    description = db.Column(db.Text)
    trainer_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    capacity = db.Column(db.Integer)


class Attendance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    class_id = db.Column(db.Integer, db.ForeignKey('class.id'))
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)


class CreditTransaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    delta = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    note = db.Column(db.String(128))


class FinancialTransaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(10))
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    category = db.Column(db.String(64), nullable=False)
    date = db.Column(db.Date, nullable=False)
    description = db.Column(db.String(128))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


@login.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))