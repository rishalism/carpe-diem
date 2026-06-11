"""admin portal: user role/status fields, audit_logs, reports

Revision ID: b2f4a1c9d3e7
Revises: 496b56bffbe2
Create Date: 2026-06-11 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

import app.database.base

# revision identifiers, used by Alembic.
revision: str = "b2f4a1c9d3e7"
down_revision: Union[str, None] = "496b56bffbe2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- users: admin/moderation fields ---
    # server_default backfills existing rows; enum values stored as strings
    # (matches the app's native_enum=False columns).
    op.add_column(
        "users",
        sa.Column("role", sa.String(length=32), nullable=False, server_default="user"),
    )
    op.add_column(
        "users",
        sa.Column(
            "account_status", sa.String(length=32), nullable=False, server_default="active"
        ),
    )
    op.add_column("users", sa.Column("suspension_reason", sa.Text(), nullable=True))
    op.add_column(
        "users",
        sa.Column("last_active_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_users_role", "users", ["role"])
    op.create_index("ix_users_account_status", "users", ["account_status"])

    # --- audit_logs (append-only) ---
    op.create_table(
        "audit_logs",
        sa.Column("id", app.database.base.GUID(), nullable=False),
        sa.Column("admin_id", app.database.base.GUID(), nullable=True),
        sa.Column("admin_name", sa.String(length=255), nullable=False),
        sa.Column("admin_role", sa.String(length=32), nullable=False),
        sa.Column("action", sa.String(length=64), nullable=False),
        sa.Column("resource_type", sa.String(length=32), nullable=True),
        sa.Column("resource_id", sa.String(length=64), nullable=True),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("meta", sa.JSON(), nullable=True),
        sa.Column("result", sa.String(length=16), nullable=False, server_default="success"),
        sa.Column("ip_address", sa.String(length=64), nullable=True),
        sa.Column("user_agent", sa.String(length=512), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["admin_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_audit_logs_admin_id", "audit_logs", ["admin_id"])
    op.create_index("ix_audit_logs_action", "audit_logs", ["action"])
    op.create_index("ix_audit_logs_resource_type", "audit_logs", ["resource_type"])
    op.create_index("ix_audit_logs_resource_id", "audit_logs", ["resource_id"])
    op.create_index("ix_audit_logs_ip_address", "audit_logs", ["ip_address"])
    op.create_index("ix_audit_logs_created_at", "audit_logs", ["created_at"])

    # --- reports / moderation cases ---
    op.create_table(
        "reports",
        sa.Column("id", app.database.base.GUID(), nullable=False),
        sa.Column("content_type", sa.String(length=32), nullable=False),
        sa.Column("content_id", app.database.base.GUID(), nullable=False),
        sa.Column("reported_user_id", app.database.base.GUID(), nullable=True),
        sa.Column("reporter_id", app.database.base.GUID(), nullable=True),
        sa.Column("reason", sa.String(length=64), nullable=False),
        sa.Column("details", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="open"),
        sa.Column("severity", sa.String(length=32), nullable=False, server_default="medium"),
        sa.Column("assigned_admin_id", app.database.base.GUID(), nullable=True),
        sa.Column("resolution_note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["reported_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["reporter_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["assigned_admin_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_reports_content_type", "reports", ["content_type"])
    op.create_index("ix_reports_content_id", "reports", ["content_id"])
    op.create_index("ix_reports_reported_user_id", "reports", ["reported_user_id"])
    op.create_index("ix_reports_status", "reports", ["status"])
    op.create_index("ix_reports_severity", "reports", ["severity"])
    op.create_index("ix_reports_assigned_admin_id", "reports", ["assigned_admin_id"])


def downgrade() -> None:
    op.drop_table("reports")
    op.drop_table("audit_logs")
    op.drop_index("ix_users_account_status", table_name="users")
    op.drop_index("ix_users_role", table_name="users")
    op.drop_column("users", "last_active_at")
    op.drop_column("users", "suspension_reason")
    op.drop_column("users", "account_status")
    op.drop_column("users", "role")
