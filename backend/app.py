"""
Main Flask application for The Unfair Advantage project
Handles business idea capture, processing, and evaluation
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import logging

from routes.upload import upload_bp
from routes.evaluate import evaluate_bp
from routes.feedback import feedback_bp
from routes.user import user_bp
from config import Config
from middleware.business_context import BusinessContextMiddleware


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS for frontend integration
    CORS(app)

    # Configure comprehensive logging
    log_level = os.environ.get("LOG_LEVEL", "INFO").upper()
    log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    # Create logs directory if it doesn't exist
    log_dir = "logs"
    os.makedirs(log_dir, exist_ok=True)

    logging.basicConfig(
        level=getattr(logging, log_level),
        format=log_format,
        handlers=[
            logging.FileHandler(f"{log_dir}/unfair_advantage.log"),
            logging.StreamHandler(),  # Console output
        ],
    )

    # Set up Flask app logger
    app.logger.setLevel(getattr(logging, log_level))
    app.logger.info("The Unfair Advantage API started successfully")

    # Initialize business context middleware
    BusinessContextMiddleware(app)

    # Register blueprints
    app.register_blueprint(upload_bp, url_prefix="/api/upload")
    app.register_blueprint(evaluate_bp, url_prefix="/api/evaluate")
    app.register_blueprint(feedback_bp, url_prefix="/api/feedback")
    app.register_blueprint(user_bp, url_prefix="/api/user")

    # Ensure upload directory exists
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    @app.route("/")
    def health_check():
        return jsonify(
            {
                "status": "healthy",
                "message": "The Unfair Advantage API is running",
                "description": "AI-powered business idea evaluation platform",
                "version": "1.0.0",
                "supported_inputs": ["text", "voice", "handwritten_notes", "documents"],
                "supported_languages": list(
                    app.config.get("SUPPORTED_LANGUAGES", {}).keys()
                ),
                "endpoints": {
                    "upload": "/api/upload - Submit business ideas in any format",
                    "evaluate": "/api/evaluate - Get AI-powered business analysis",
                    "feedback": "/api/feedback - Provide feedback on evaluations",
                },
            }
        )

    @app.route("/api/docs")
    def api_documentation():
        """API documentation endpoint"""
        return jsonify(
            {
                "api_name": "The Unfair Advantage API",
                "description": "Democratizing business idea evaluation through AI",
                "version": "1.0.0",
                "base_url": request.host_url,
                "authentication": "None required (open access)",
                "rate_limiting": "Coming soon",
                "endpoints": {
                    "upload_endpoints": {
                        "POST /api/upload/text": "Submit text-based business idea",
                        "POST /api/upload/voice": "Upload voice recording",
                        "POST /api/upload/image": "Upload handwritten notes/sketches",
                        "POST /api/upload/document": "Upload document files",
                        "GET /api/upload/status/<id>": "Check processing status",
                    },
                    "evaluation_endpoints": {
                        "POST /api/evaluate/analyze": "Analyze business idea",
                        "GET /api/evaluate/report/<id>": "Get detailed evaluation report",
                        "GET /api/evaluate/criteria": "Get evaluation criteria info",
                    },
                    "feedback_endpoints": {
                        "POST /api/feedback/submit": "Submit user feedback",
                        "POST /api/feedback/rating": "Rate evaluation quality",
                    },
                },
                "supported_file_types": list(app.config.get("ALLOWED_EXTENSIONS", [])),
                "max_file_size": f"{app.config.get('MAX_CONTENT_LENGTH', 0) // (1024*1024)}MB",
                "supported_languages": app.config.get("SUPPORTED_LANGUAGES", {}),
                "evaluation_criteria": app.config.get("EVALUATION_CRITERIA", {}),
            }
        )

    @app.errorhandler(404)
    def not_found(error):
        return (
            jsonify(
                {
                    "error": "Endpoint not found",
                    "message": "The requested resource does not exist",
                    "available_endpoints": [
                        "/api/upload",
                        "/api/evaluate",
                        "/api/feedback",
                    ],
                }
            ),
            404,
        )

    @app.errorhandler(500)
    def internal_error(error):
        app.logger.error(f"Server Error: {error}", exc_info=True)
        return (
            jsonify(
                {
                    "error": "Internal server error",
                    "message": "Something went wrong on our end. Please try again later.",
                }
            ),
            500,
        )

    @app.errorhandler(413)
    def too_large(error):
        return (
            jsonify(
                {
                    "error": "File too large",
                    "message": f'Maximum file size is {app.config["MAX_CONTENT_LENGTH"] // (1024*1024)}MB',
                    "max_size_bytes": app.config["MAX_CONTENT_LENGTH"],
                }
            ),
            413,
        )

    @app.errorhandler(400)
    def bad_request(error):
        return (
            jsonify(
                {"error": "Bad request", "message": "Invalid request data or format"}
            ),
            400,
        )

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host="0.0.0.0", port=5000)
