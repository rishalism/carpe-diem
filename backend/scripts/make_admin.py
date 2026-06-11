"""Promote (or demote) a user to a platform role.

Bootstrap the first super admin, or change any user's role from the CLI.

Usage (from the backend/ directory, with the venv active):

    python -m scripts.make_admin user@example.com super_admin
    python -m scripts.make_admin user@example.com moderator
    python -m scripts.make_admin user@example.com user        # demote

Valid roles: user, moderator, admin, super_admin
"""
import sys

from app.database.session import SessionLocal
from app.models.enums import UserRole
from app.repositories.user_repo import UserRepository


def main() -> int:
    if len(sys.argv) != 3:
        print(__doc__)
        return 1

    email, role_str = sys.argv[1], sys.argv[2]
    try:
        role = UserRole(role_str)
    except ValueError:
        print(f"Invalid role '{role_str}'. Choose one of: "
              f"{', '.join(r.value for r in UserRole)}")
        return 1

    db = SessionLocal()
    try:
        user = UserRepository(db).get_by_email(email.lower())
        if user is None:
            print(f"No user found with email '{email}'.")
            return 1
        old = user.role.value
        user.role = role
        db.commit()
        print(f"OK: {email} role {old} -> {role.value}")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
