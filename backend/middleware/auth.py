"""
Authentication middleware for Flask routes
Handles Supabase token verification and user authorization
"""

import logging
from functools import wraps
from flask import request, jsonify, g
from services.user_service import UserService

logger = logging.getLogger(__name__)


def extract_token_from_header():
    """Extract Bearer token from Authorization header"""
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return None

    # Expected format: "Bearer <token>"
    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None

    return parts[1]


def verify_and_get_user(access_token):
    """Verify token and get user from database"""
    try:
        user_service = UserService()

        # Verify token with Supabase
        supabase_user_data = user_service.verify_access_token(access_token)
        if not supabase_user_data:
            return None

        # Get or create user in MongoDB
        user = user_service.get_or_create_user(supabase_user_data)
        return user

    except Exception as e:
        logger.error(f"Error verifying user: {str(e)}")
        return None


def require_auth(f):
    """Decorator that requires valid authentication"""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        access_token = extract_token_from_header()

        if not access_token:
            return (
                jsonify(
                    {
                        "error": "Authentication required",
                        "message": "No access token provided",
                    }
                ),
                401,
            )

        user = verify_and_get_user(access_token)
        if not user:
            return (
                jsonify(
                    {
                        "error": "Authentication failed",
                        "message": "Invalid or expired access token",
                    }
                ),
                401,
            )

        # Store user in Flask's g object for use in the route
        g.current_user = user

        return f(*args, **kwargs)

    return decorated_function


def optional_auth(f):
    """Decorator that allows optional authentication"""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        access_token = extract_token_from_header()

        if access_token:
            user = verify_and_get_user(access_token)
            g.current_user = user
        else:
            g.current_user = None

        return f(*args, **kwargs)

    return decorated_function


def require_admin(f):
    """Decorator that requires admin or mentor role"""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user = getattr(g, "current_user", None)

        if not current_user:
            return (
                jsonify(
                    {
                        "error": "Authentication required",
                        "message": "User not authenticated",
                    }
                ),
                401,
            )

        user_service = UserService()
        if not user_service.is_admin(current_user.supabase_user_id):
            return (
                jsonify(
                    {
                        "error": "Access denied",
                        "message": "Admin or mentor privileges required",
                    }
                ),
                403,
            )

        return f(*args, **kwargs)

    return decorated_function


def require_mentor(f):
    """Decorator that requires mentor role specifically"""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user = getattr(g, "current_user", None)

        if not current_user:
            return (
                jsonify(
                    {
                        "error": "Authentication required",
                        "message": "User not authenticated",
                    }
                ),
                401,
            )

        user_service = UserService()
        if not user_service.is_mentor(current_user.supabase_user_id):
            return (
                jsonify(
                    {
                        "error": "Access denied",
                        "message": "Mentor privileges required",
                    }
                ),
                403,
            )

        return f(*args, **kwargs)

    return decorated_function


def get_current_user():
    """Helper function to get the current authenticated user"""
    return getattr(g, "current_user", None)


def require_self_or_admin(user_id_param="user_id"):
    """
    Decorator that requires the user to be accessing their own data or be an admin
    user_id_param: the parameter name that contains the user ID to check
    """

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            current_user = getattr(g, "current_user", None)

            if not current_user:
                return (
                    jsonify(
                        {
                            "error": "Authentication required",
                            "message": "User not authenticated",
                        }
                    ),
                    401,
                )

            # Get the user ID from route parameters or request data
            target_user_id = kwargs.get(user_id_param) or request.json.get(
                user_id_param
            )

            # Allow if user is accessing their own data
            if target_user_id == current_user.supabase_user_id:
                return f(*args, **kwargs)

            # Allow if user is admin or mentor
            user_service = UserService()
            if user_service.is_admin(current_user.supabase_user_id):
                return f(*args, **kwargs)

            return (
                jsonify(
                    {
                        "error": "Access denied",
                        "message": "You can only access your own data",
                    }
                ),
                403,
            )

        return decorated_function

    return decorator


def rate_limit_by_user(max_requests=100, window_minutes=60):
    """
    Simple rate limiting decorator (placeholder for future implementation)
    This would need a proper cache/Redis implementation in production
    """

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # TODO: Implement actual rate limiting logic
            # For now, just pass through
            return f(*args, **kwargs)

        return decorated_function

    return decorator
