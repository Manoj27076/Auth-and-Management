"""
Admin blueprint routes — all require the 'admin' role.

Endpoints:
  GET  /api/admin/users                    → Paginated + searchable user list
  GET  /api/admin/users/<id>               → Single user detail
  POST /api/admin/users/<id>/role          → Assign or remove a role
  POST /api/admin/users/<id>/toggle-active → Activate / deactivate a user
  GET  /api/admin/domains                  → List all domains
  POST /api/admin/domains                  → Create a new domain
  DELETE /api/admin/domains/<id>           → Delete a domain
  GET  /api/admin/stats                    → Dashboard statistics
"""
from flask import jsonify, request
from flask_jwt_extended import jwt_required

from . import admin_bp
from ..auth.utils import roles_required
from ..extensions import db
from ..models.user import Domain, Role, User


# ── User Management ───────────────────────────────────────────────────────────

@admin_bp.route("/users")
@jwt_required()
@roles_required("admin")
def list_users():
    page     = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 20, type=int), 100)
    search   = request.args.get("search", "").strip()
    role_filter = request.args.get("role", "").strip()

    query = User.query
    if search:
        query = query.filter(
            (User.name.ilike(f"%{search}%")) | (User.email.ilike(f"%{search}%"))
        )
    if role_filter:
        role = Role.query.filter_by(name=role_filter).first()
        if role:
            query = query.filter(User.roles.contains(role))

    paginated = query.order_by(User.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        "users":        [u.to_dict() for u in paginated.items],
        "total":        paginated.total,
        "pages":        paginated.pages,
        "current_page": paginated.page,
        "per_page":     per_page,
    }), 200


@admin_bp.route("/users/<string:user_id>")
@jwt_required()
@roles_required("admin")
def get_user(user_id: str):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": user.to_dict()}), 200


@admin_bp.route("/users/<string:user_id>/role", methods=["POST"])
@jwt_required()
@roles_required("admin")
def manage_user_role(user_id: str):
    """
    Add or remove a role from a user.
    Body: { "action": "add" | "remove",  "role": "<role_name>" }
    """
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data    = request.get_json(silent=True) or {}
    action  = data.get("action")
    role_name = data.get("role")

    valid_roles = {Role.ADMIN, Role.DOMAIN_LEAD, Role.CLUB_MEMBER}
    if action not in ("add", "remove") or role_name not in valid_roles:
        return jsonify({
            "error": "Invalid action or role",
            "valid_actions": ["add", "remove"],
            "valid_roles": list(valid_roles),
        }), 400

    role = Role.query.filter_by(name=role_name).first()
    if not role:
        return jsonify({"error": f"Role '{role_name}' not found in DB"}), 404

    if action == "add":
        if role not in user.roles:
            user.roles.append(role)
    else:
        if role in user.roles:
            user.roles.remove(role)

    db.session.commit()
    return jsonify({
        "message": f"Role '{role_name}' {action}ed successfully",
        "user":    user.to_dict(),
    }), 200


@admin_bp.route("/users/<string:user_id>/toggle-active", methods=["POST"])
@jwt_required()
@roles_required("admin")
def toggle_user_active(user_id: str):
    """Flip a user's is_active flag."""
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    user.is_active = not user.is_active
    db.session.commit()

    action = "activated" if user.is_active else "deactivated"
    return jsonify({
        "message":   f"User {action}",
        "is_active": user.is_active,
        "user":      user.to_dict(),
    }), 200


# ── Domain Management ─────────────────────────────────────────────────────────

@admin_bp.route("/domains")
@jwt_required()
@roles_required("admin")
def list_domains():
    domains = Domain.query.order_by(Domain.name).all()
    return jsonify({"domains": [d.to_dict() for d in domains]}), 200


@admin_bp.route("/domains", methods=["POST"])
@jwt_required()
@roles_required("admin")
def create_domain():
    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()
    slug = str(data.get("slug", "")).strip().lower().replace(" ", "-")
    description = str(data.get("description", "")).strip()
    icon = str(data.get("icon", "🔧")).strip()

    if not name or not slug:
        return jsonify({"error": "Both 'name' and 'slug' are required"}), 400

    if Domain.query.filter_by(slug=slug).first():
        return jsonify({"error": f"Domain with slug '{slug}' already exists"}), 409

    domain = Domain(name=name, slug=slug, description=description, icon=icon)
    db.session.add(domain)
    db.session.commit()
    return jsonify({"message": "Domain created", "domain": domain.to_dict()}), 201


@admin_bp.route("/domains/<int:domain_id>", methods=["DELETE"])
@jwt_required()
@roles_required("admin")
def delete_domain(domain_id: int):
    domain = Domain.query.get(domain_id)
    if not domain:
        return jsonify({"error": "Domain not found"}), 404

    db.session.delete(domain)
    db.session.commit()
    return jsonify({"message": f"Domain '{domain.name}' deleted"}), 200


# ── Statistics ────────────────────────────────────────────────────────────────

@admin_bp.route("/stats")
@jwt_required()
@roles_required("admin")
def get_stats():
    """Aggregate statistics for the admin dashboard."""
    total_users    = User.query.count()
    verified_users = User.query.filter_by(is_verified=True).count()
    active_users   = User.query.filter_by(is_active=True).count()
    face_users     = User.query.filter_by(face_registered=True).count()

    role_distribution: dict[str, int] = {}
    for role_name in (Role.ADMIN, Role.DOMAIN_LEAD, Role.CLUB_MEMBER):
        role = Role.query.filter_by(name=role_name).first()
        role_distribution[role_name] = role.users.count() if role else 0

    top_domains = []
    for domain in Domain.query.all():
        top_domains.append({
            "domain":     domain.name,
            "icon":       domain.icon,
            "user_count": domain.users.count(),
        })
    top_domains.sort(key=lambda x: x["user_count"], reverse=True)

    return jsonify({
        "total_users":       total_users,
        "verified_users":    verified_users,
        "active_users":      active_users,
        "face_registrations": face_users,
        "role_distribution": role_distribution,
        "top_domains":       top_domains[:5],
    }), 200
