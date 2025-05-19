"""Add uid to User

Revision ID: 590d3af13e71
Revises: 2fcbb9bfbba0
Create Date: 2025-05-11 18:10:16.964219

"""
from alembic import op
import sqlalchemy as sa
import uuid


# revision identifiers, used by Alembic.
revision = '590d3af13e71'
down_revision = '2fcbb9bfbba0'
branch_labels = None
depends_on = None


def upgrade():
    # 1) добавляем колонку uid как nullable
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.add_column(sa.Column('uid', sa.String(length=36), nullable=True))

    # 2) заполняем её уникальными uuid для всех существующих пользователей
    conn = op.get_bind()
    result = conn.execute(sa.text('SELECT id FROM "user"'))
    for row in result:
        conn.execute(
            sa.text('UPDATE "user" SET uid = :u WHERE id = :i'),
            {'u': str(uuid.uuid4()), 'i': row.id}
        )

    # 3) делаем колонку NOT NULL
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.alter_column('uid', nullable=False)

    # 4) создаём уникальный индекс/constraint
    op.create_unique_constraint('uq_user_uid', 'user', ['uid'])


def downgrade():
    # удаляем constraint и колонку
    op.drop_constraint('uq_user_uid', 'user', type_='unique')
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.drop_column('uid')






