"""
User routes for authentication and user data management
"""

from flask import Blueprint, jsonify, request, g
from middleware.auth import (
    require_auth,
    optional_auth,
    get_current_user,
    require_admin,
    require_mentor,
)
from services.user_service import UserService
from models.user import UserRole
import logging

user_bp = Blueprint("user", __name__)
logger = logging.getLogger(__name__)


@user_bp.route("/profile", methods=["GET"])
@require_auth
def get_user_profile():
    """Get current user's profile information"""
    try:
        current_user = get_current_user()

        if not current_user:
            return jsonify({"error": "User not found"}), 404

        return (
            jsonify(
                {
                    "user_id": current_user._id,
                    "supabase_user_id": current_user.supabase_user_id,
                    "profile": {
                        "email": current_user.profile.email,
                        "full_name": current_user.profile.full_name,
                        "avatar_url": current_user.profile.avatar_url,
                        "phone": current_user.profile.phone,
                        "email_verified": current_user.profile.email_verified,
                        "phone_verified": current_user.profile.phone_verified,
                        "created_at": current_user.profile.created_at.isoformat(),
                        "last_sign_in": (
                            current_user.profile.last_sign_in.isoformat()
                            if current_user.profile.last_sign_in
                            else None
                        ),
                    },
                    "status": current_user.status.value,
                    "role": current_user.role.value,
                    "created_at": current_user.created_at.isoformat(),
                    "last_activity": (
                        current_user.last_activity.isoformat()
                        if current_user.last_activity
                        else None
                    ),
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Error getting user profile: {str(e)}")
        return jsonify({"error": "Failed to retrieve user profile"}), 500


@user_bp.route("/stats", methods=["GET"])
@require_auth
def get_user_stats():
    """Get current user's usage statistics"""
    try:
        current_user = get_current_user()

        if not current_user:
            return jsonify({"error": "User not found"}), 404

        user_service = UserService()
        stats = user_service.get_user_stats(current_user.supabase_user_id)

        return jsonify(stats), 200

    except Exception as e:
        logger.error(f"Error getting user stats: {str(e)}")
        return jsonify({"error": "Failed to retrieve user statistics"}), 500


@user_bp.route("/documents", methods=["GET"])
@require_auth
def get_user_documents():
    """Get current user's processed documents"""
    try:
        current_user = get_current_user()

        if not current_user:
            return jsonify({"error": "User not found"}), 404

        # Get pagination parameters
        limit = min(
            int(request.args.get("limit", 50)), 100
        )  # Max 100 documents per request

        user_service = UserService()
        documents = user_service.get_user_documents(
            current_user.supabase_user_id, limit
        )

        # Convert documents to JSON-serializable format
        documents_data = []
        for doc in documents:
            documents_data.append(
                {
                    "id": doc.id,
                    "original_filename": doc.original_filename,
                    "file_type": doc.file_type,
                    "upload_timestamp": doc.upload_timestamp.isoformat(),
                    "processing_method": doc.processing_method,
                    "confidence": doc.confidence,
                    "pages_processed": doc.pages_processed,
                    "file_size": doc.file_size,
                    "processing_time": doc.processing_time,
                    "structured_data": doc.structured_data,
                    "ocr_metadata": doc.ocr_metadata,
                }
            )

        return (
            jsonify(
                {
                    "documents": documents_data,
                    "total_count": len(documents_data),
                    "limit": limit,
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Error getting user documents: {str(e)}")
        return jsonify({"error": "Failed to retrieve user documents"}), 500


@user_bp.route("/documents/<document_id>", methods=["GET"])
@require_auth
def get_document_by_id(document_id):
    """Get specific document by ID"""
    try:
        current_user = get_current_user()

        if not current_user:
            return jsonify({"error": "User not found"}), 404

        # Find document in user's processed documents
        document = None
        for doc in current_user.processed_documents:
            if doc.id == document_id:
                document = doc
                break

        if not document:
            return jsonify({"error": "Document not found"}), 404

        return (
            jsonify(
                {
                    "id": document.id,
                    "original_filename": document.original_filename,
                    "file_type": document.file_type,
                    "upload_timestamp": document.upload_timestamp.isoformat(),
                    "processing_method": document.processing_method,
                    "raw_text": document.raw_text,
                    "structured_data": document.structured_data,
                    "confidence": document.confidence,
                    "pages_processed": document.pages_processed,
                    "file_size": document.file_size,
                    "processing_time": document.processing_time,
                    "ocr_metadata": document.ocr_metadata,
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Error getting document by ID: {str(e)}")
        return jsonify({"error": "Failed to retrieve document"}), 500


@user_bp.route("/preferences", methods=["GET", "PUT"])
@require_auth
def user_preferences():
    """Get or update user preferences"""
    try:
        current_user = get_current_user()

        if not current_user:
            return jsonify({"error": "User not found"}), 404

        if request.method == "GET":
            return jsonify({"preferences": current_user.preferences}), 200

        elif request.method == "PUT":
            data = request.get_json()

            if not data or "preferences" not in data:
                return jsonify({"error": "Preferences data required"}), 400

            user_service = UserService()
            success = user_service.update_user_preferences(
                current_user.supabase_user_id, data["preferences"]
            )

            if success:
                return (
                    jsonify(
                        {
                            "message": "Preferences updated successfully",
                            "preferences": data["preferences"],
                        }
                    ),
                    200,
                )
            else:
                return jsonify({"error": "Failed to update preferences"}), 500

    except Exception as e:
        logger.error(f"Error handling user preferences: {str(e)}")
        return jsonify({"error": "Failed to handle preferences"}), 500


@user_bp.route("/verify-token", methods=["POST"])
@optional_auth
def verify_token():
    """
    Verify access token and return user info
    Can be used by frontend to check if token is still valid
    """
    try:
        current_user = get_current_user()

        if current_user:
            return (
                jsonify(
                    {
                        "valid": True,
                        "user": {
                            "user_id": current_user._id,
                            "supabase_user_id": current_user.supabase_user_id,
                            "email": current_user.profile.email,
                            "full_name": current_user.profile.full_name,
                            "status": current_user.status.value,
                            "role": current_user.role.value,
                        },
                    }
                ),
                200,
            )
        else:
            return jsonify({"valid": False, "message": "Invalid or expired token"}), 401

    except Exception as e:
        logger.error(f"Error verifying token: {str(e)}")
        return jsonify({"valid": False, "error": "Token verification failed"}), 500


@user_bp.route("/admin/users", methods=["GET"])
@require_auth
@require_admin
def get_all_users():
    """Get all users (admin only)"""
    try:
        user_service = UserService()

        # Get pagination parameters
        limit = min(int(request.args.get("limit", 50)), 100)
        role_filter = request.args.get("role")

        if role_filter:
            try:
                role = UserRole(role_filter)
                users = user_service.get_users_by_role(role, limit)
            except ValueError:
                return jsonify({"error": "Invalid role specified"}), 400
        else:
            # For now, we'll get users by querying all roles
            users = []
            for role in UserRole:
                users.extend(user_service.get_users_by_role(role, limit))
            users = users[:limit]  # Apply limit after combining

        users_data = []
        for user in users:
            users_data.append(
                {
                    "user_id": user._id,
                    "supabase_user_id": user.supabase_user_id,
                    "email": user.profile.email,
                    "full_name": user.profile.full_name,
                    "status": user.status.value,
                    "role": user.role.value,
                    "created_at": user.created_at.isoformat(),
                    "last_activity": (
                        user.last_activity.isoformat() if user.last_activity else None
                    ),
                    "total_documents_processed": user.total_documents_processed,
                }
            )

        return (
            jsonify(
                {"users": users_data, "total_count": len(users_data), "limit": limit}
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Error getting all users: {str(e)}")
        return jsonify({"error": "Failed to retrieve users"}), 500


@user_bp.route("/admin/users/<supabase_user_id>/role", methods=["PUT"])
@require_auth
@require_mentor
def update_user_role(supabase_user_id):
    """Update user role (mentor only)"""
    try:
        data = request.get_json()

        if not data or "role" not in data:
            return jsonify({"error": "Role data required"}), 400

        try:
            new_role = UserRole(data["role"])
        except ValueError:
            return jsonify({"error": "Invalid role specified"}), 400

        user_service = UserService()
        success = user_service.update_user_role(supabase_user_id, new_role)

        if success:
            return (
                jsonify(
                    {
                        "message": "User role updated successfully",
                        "supabase_user_id": supabase_user_id,
                        "new_role": new_role.value,
                    }
                ),
                200,
            )
        else:
            return jsonify({"error": "Failed to update user role"}), 500

    except Exception as e:
        logger.error(f"Error updating user role: {str(e)}")
        return jsonify({"error": "Failed to update user role"}), 500


@user_bp.route("/admin/stats", methods=["GET"])
@require_auth
@require_admin
def get_admin_stats():
    """Get admin statistics"""
    try:
        user_service = UserService()

        # Get user counts by role
        stats = {"user_counts": {}, "total_users": 0}

        for role in UserRole:
            users = user_service.get_users_by_role(
                role, 1000
            )  # Get up to 1000 users per role
            stats["user_counts"][role.value] = len(users)
            stats["total_users"] += len(users)

        return jsonify(stats), 200

    except Exception as e:
        logger.error(f"Error getting admin stats: {str(e)}")
        return jsonify({"error": "Failed to retrieve admin statistics"}), 500
