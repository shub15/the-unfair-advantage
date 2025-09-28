"""
Authentication middleware for Supabase integration
"""

import logging
from functools import wraps
from flask import request, jsonify, g
from services.user_service import UserService


def require_auth(f):
    """
    Decorator to require authentication for API endpoints
    Expects Authorization header with Bearer token
    """

    @wraps(f)
    def decorated_function(*args, **kwargs):
        logger = logging.getLogger(__name__)

        try:
            # Get authorization header
            auth_header = request.headers.get("Authorization")

            if not auth_header:
                return (
                    jsonify(
                        {
                            "error": "Authorization header missing",
                            "message": "Please provide an access token in the Authorization header",
                        }
                    ),
                    401,
                )

            # Extract token from "Bearer <token>" format
            if not auth_header.startswith("Bearer "):
                return (
                    jsonify(
                        {
                            "error": "Invalid authorization format",
                            "message": "Authorization header must be in format: Bearer <token>",
                        }
                    ),
                    401,
                )

            access_token = auth_header.split(" ")[1]

            # Initialize user service
            user_service = UserService()

            # Verify token with Supabase
            supabase_user_data = user_service.verify_access_token(access_token)

            if not supabase_user_data:
                return (
                    jsonify(
                        {
                            "error": "Invalid or expired token",
                            "message": "The provided access token is invalid or has expired",
                        }
                    ),
                    401,
                )

            # Get or create user in local MongoDB
            user = user_service.get_or_create_user(supabase_user_data)

            if not user:
                return (
                    jsonify(
                        {
                            "error": "User creation failed",
                            "message": "Failed to create or retrieve user account",
                        }
                    ),
                    500,
                )

            # Store user data in Flask's request context
            g.current_user = user
            g.supabase_user_data = supabase_user_data
            g.access_token = access_token

            return f(*args, **kwargs)

        except Exception as e:
            logger.error(f"Authentication middleware error: {str(e)}")
            return (
                jsonify(
                    {
                        "error": "Authentication error",
                        "message": "An error occurred during authentication",
                    }
                ),
                500,
            )

    return decorated_function


def optional_auth(f):
    """
    Decorator for optional authentication
    Sets g.current_user if valid token is provided, otherwise continues without auth
    """

    @wraps(f)
    def decorated_function(*args, **kwargs):
        logger = logging.getLogger(__name__)

        try:
            # Initialize default values
            g.current_user = None
            g.supabase_user_data = None
            g.access_token = None

            # Get authorization header
            auth_header = request.headers.get("Authorization")

            if auth_header and auth_header.startswith("Bearer "):
                access_token = auth_header.split(" ")[1]

                # Initialize user service
                user_service = UserService()

                # Verify token with Supabase
                supabase_user_data = user_service.verify_access_token(access_token)

                if supabase_user_data:
                    # Get or create user in local MongoDB
                    user = user_service.get_or_create_user(supabase_user_data)

                    if user:
                        g.current_user = user
                        g.supabase_user_data = supabase_user_data
                        g.access_token = access_token

            return f(*args, **kwargs)

        except Exception as e:
            logger.error(f"Optional authentication middleware error: {str(e)}")
            # Continue without authentication on error
            return f(*args, **kwargs)

    return decorated_function


def get_current_user():
    """
    Helper function to get current authenticated user
    Returns None if no user is authenticated
    """
    return getattr(g, "current_user", None)


def get_supabase_user_data():
    """
    Helper function to get Supabase user data
    Returns None if no user is authenticated
    """
    return getattr(g, "supabase_user_data", None)


def get_access_token():
    """
    Helper function to get current access token
    Returns None if no token is present
    """
    return getattr(g, "access_token", None)
