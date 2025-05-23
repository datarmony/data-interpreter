"""Add gemini analysis fields to Dashboard

Revision ID: 52a4f81c3f49
Revises: cf44dd39dda6
Create Date: 2025-05-07 16:40:12.316706

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '52a4f81c3f49'
down_revision = 'cf44dd39dda6'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('dashboards', schema=None) as batch_op:
        batch_op.add_column(sa.Column('gemini_analysis_text', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('last_analysis_timestamp', sa.DateTime(), nullable=True))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('dashboards', schema=None) as batch_op:
        batch_op.drop_column('last_analysis_timestamp')
        batch_op.drop_column('gemini_analysis_text')

    # ### end Alembic commands ###
