"""
Profile blueprint routes.

Endpoints:
  GET  /api/profile/             → Get current user's profile
  PUT  /api/profile/edit         → Update name (email is immutable)
  PUT  /api/profile/domains      → Replace domain selections
  GET  /api/profile/domains/all  → List all available domains
  POST /api/profile/face         → One-time face registration flag (immutable)
"""
from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from . import profile_bp
from ..auth.utils import verified_required, otp_required
from ..extensions import db
from ..models.user import Domain, User


# ── View Profile ──────────────────────────────────────────────────────────────

@profile_bp.route("/")
@jwt_required()
@verified_required
@otp_required
def get_profile():
    user: User | None = User.query.get(get_jwt_identity())
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": user.to_dict()}), 200


# ── Edit Profile ──────────────────────────────────────────────────────────────

@profile_bp.route("/edit", methods=["PUT"])
@jwt_required()
@verified_required
@otp_required
def edit_profile():
    """
    Allow users to update their name only.
    email is sourced from Google and cannot be changed.
    face_registered is intentionally excluded — set via /face endpoint.
    """
    user: User | None = User.query.get(get_jwt_identity())
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json(silent=True) or {}

    # Whitelist of mutable fields
    if "name" in data:
        name = str(data["name"]).strip()
        if not name:
            return jsonify({"error": "Name cannot be empty"}), 400
        if len(name) > 255:
            return jsonify({"error": "Name is too long (max 255 characters)"}), 400
        user.name = name

    # Guard: silently ignore attempts to change email or face_registered
    # Role changes go through the admin blueprint only
    db.session.commit()
    return jsonify({"message": "Profile updated", "user": user.to_dict()}), 200


# ── Domain Selection ──────────────────────────────────────────────────────────

@profile_bp.route("/domains", methods=["PUT"])
@jwt_required()
@verified_required
@otp_required
def update_domains():
    """Replace the user's domain selections with the provided list of domain IDs."""
    user: User | None = User.query.get(get_jwt_identity())
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json(silent=True) or {}
    if "domain_ids" not in data:
        return jsonify({"error": "domain_ids is required"}), 400

    domain_ids = data["domain_ids"]
    if not isinstance(domain_ids, list):
        return jsonify({"error": "domain_ids must be a list of integers"}), 400

    if len(domain_ids) > 10:
        return jsonify({"error": "You may select up to 10 domains"}), 400

    if domain_ids:
        domains = Domain.query.filter(Domain.id.in_(domain_ids)).all()
        if len(domains) != len(set(domain_ids)):
            return jsonify({"error": "One or more domain IDs are invalid"}), 400
    else:
        domains = []

    user.domains = domains
    db.session.commit()
    return jsonify({
        "message": "Domains updated",
        "domains": [d.to_dict() for d in domains],
    }), 200


@profile_bp.route("/domains/all")
@jwt_required()
def get_all_domains():
    """Return all available domains for the domain-selection UI."""
    domains = Domain.query.order_by(Domain.name).all()
    return jsonify({"domains": [d.to_dict() for d in domains]}), 200


# ── Face Registration (one-time, immutable) ───────────────────────────────────

@profile_bp.route("/face", methods=["POST"])
@jwt_required()
@verified_required
@otp_required
def register_face():
    """
    Called by the QR/facial-recognition module to flag that facial data
    has been collected for this user.  Can only be set once — the SQLAlchemy
    before_update event prevents resetting it to False.
    """
    user: User | None = User.query.get(get_jwt_identity())
    if not user:
        return jsonify({"error": "User not found"}), 404

    if user.face_registered:
        return jsonify({
            "error": "Facial data already registered. This cannot be modified.",
            "face_registered": True,
        }), 409

    user.face_registered = True
    db.session.commit()
    return jsonify({
        "message": "Face registered successfully",
        "face_registered": True,
    }), 200
