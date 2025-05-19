from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate
from dotenv import load_dotenv

db = SQLAlchemy()
login = LoginManager()
login.login_view = 'auth.login'

def create_app():
    load_dotenv()
    app = Flask(__name__)
    app.config.from_object('config.Config')
    db.init_app(app)
    login.init_app(app)
    Migrate(app, db)
    from app.auth import bp as auth_bp
    app.register_blueprint(auth_bp, url_prefix='/auth')
    from app.classes import bp as classes_bp
    app.register_blueprint(classes_bp)
    from app.attendance import bp as attendance_bp
    app.register_blueprint(attendance_bp)
    from app.finance import bp as finance_bp
    app.register_blueprint(finance_bp, url_prefix='/finance')
    from app.routes import bp as main_bp
    app.register_blueprint(main_bp)
    from app.schedule import bp as schedule_bp
    app.register_blueprint(schedule_bp)
    from app.users import bp as users_bp
    app.register_blueprint(users_bp)
    from app.credits import bp as credits_bp
    app.register_blueprint(credits_bp)
    return app