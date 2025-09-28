from flask import Blueprint, request, jsonify
import uuid
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

feedback_bp = Blueprint("feedback", __name__)


@feedback_bp.route("/submit", methods=["POST"])
def submit_feedback():
    """
    Submit user feedback on evaluation results
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Required fields
        required_fields = ["business_case_id", "rating", "feedback_type"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        business_case_id = data["business_case_id"]
        rating = data["rating"]
        feedback_type = data["feedback_type"]
        comments = data.get("comments", "")

        # Validate rating
        if not isinstance(rating, int) or rating < 1 or rating > 5:
            return jsonify({"error": "Rating must be an integer between 1 and 5"}), 400

        # Validate feedback type
        valid_types = [
            "evaluation_quality",
            "recommendation_usefulness",
            "overall_experience",
            "feature_request",
            "bug_report",
        ]
        if feedback_type not in valid_types:
            return (
                jsonify(
                    {"error": f"Invalid feedback type. Must be one of: {valid_types}"}
                ),
                400,
            )

        # Create feedback record
        feedback_id = str(uuid.uuid4())
        feedback_record = {
            "id": feedback_id,
            "business_case_id": business_case_id,
            "rating": rating,
            "feedback_type": feedback_type,
            "comments": comments,
            "timestamp": datetime.now().isoformat(),
            "user_agent": request.headers.get("User-Agent", ""),
            "ip_address": request.remote_addr,
        }

        # In a real application, you would save this to a database
        logger.info(f"Feedback submitted: {feedback_record}")

        return (
            jsonify(
                {
                    "feedback_id": feedback_id,
                    "message": "Feedback submitted successfully",
                    "status": "received",
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Feedback submission failed: {e}")
        return jsonify({"error": "Feedback submission failed", "details": str(e)}), 500


@feedback_bp.route("/rating", methods=["POST"])
def submit_rating():
    """
    Submit rating for specific evaluation aspects
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "No data provided"}), 400

        business_case_id = data.get("business_case_id")
        ratings = data.get("ratings", {})

        if not business_case_id:
            return jsonify({"error": "business_case_id is required"}), 400

        if not ratings:
            return jsonify({"error": "ratings are required"}), 400

        # Validate rating categories
        valid_categories = [
            "accuracy",
            "usefulness",
            "completeness",
            "clarity",
            "actionability",
        ]

        validated_ratings = {}
        for category, rating in ratings.items():
            if category not in valid_categories:
                return jsonify({"error": f"Invalid rating category: {category}"}), 400

            if not isinstance(rating, int) or rating < 1 or rating > 5:
                return (
                    jsonify(
                        {
                            "error": f"Rating for {category} must be an integer between 1 and 5"
                        }
                    ),
                    400,
                )

            validated_ratings[category] = rating

        # Create rating record
        rating_id = str(uuid.uuid4())
        rating_record = {
            "id": rating_id,
            "business_case_id": business_case_id,
            "ratings": validated_ratings,
            "timestamp": datetime.now().isoformat(),
            "average_rating": sum(validated_ratings.values()) / len(validated_ratings),
        }

        # In a real application, you would save this to a database
        logger.info(f"Rating submitted: {rating_record}")

        return (
            jsonify(
                {
                    "rating_id": rating_id,
                    "message": "Rating submitted successfully",
                    "average_rating": rating_record["average_rating"],
                    "status": "received",
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Rating submission failed: {e}")
        return jsonify({"error": "Rating submission failed", "details": str(e)}), 500


@feedback_bp.route("/improvement-suggestion", methods=["POST"])
def submit_improvement_suggestion():
    """
    Submit suggestions for improving the evaluation system
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "No data provided"}), 400

        suggestion_type = data.get("type")
        suggestion_text = data.get("suggestion")
        priority = data.get("priority", "medium")
        contact_email = data.get("contact_email")

        if not suggestion_text:
            return jsonify({"error": "suggestion is required"}), 400

        if len(suggestion_text.strip()) < 10:
            return (
                jsonify({"error": "Suggestion must be at least 10 characters long"}),
                400,
            )

        # Validate suggestion type
        valid_types = [
            "new_feature",
            "improvement",
            "bug_fix",
            "ui_ux",
            "performance",
            "other",
        ]
        if suggestion_type and suggestion_type not in valid_types:
            return (
                jsonify(
                    {"error": f"Invalid suggestion type. Must be one of: {valid_types}"}
                ),
                400,
            )

        # Validate priority
        valid_priorities = ["low", "medium", "high", "critical"]
        if priority not in valid_priorities:
            return (
                jsonify(
                    {"error": f"Invalid priority. Must be one of: {valid_priorities}"}
                ),
                400,
            )

        # Create suggestion record
        suggestion_id = str(uuid.uuid4())
        suggestion_record = {
            "id": suggestion_id,
            "type": suggestion_type or "other",
            "suggestion": suggestion_text,
            "priority": priority,
            "contact_email": contact_email,
            "timestamp": datetime.now().isoformat(),
            "status": "submitted",
        }

        # In a real application, you would save this to a database
        logger.info(f"Improvement suggestion submitted: {suggestion_record}")

        return (
            jsonify(
                {
                    "suggestion_id": suggestion_id,
                    "message": "Improvement suggestion submitted successfully",
                    "status": "received",
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Improvement suggestion submission failed: {e}")
        return (
            jsonify({"error": "Suggestion submission failed", "details": str(e)}),
            500,
        )


@feedback_bp.route("/analytics", methods=["GET"])
def get_feedback_analytics():
    """
    Get analytics and insights from user feedback
    """
    try:
        # In a real application, you would query the database for feedback analytics
        # For now, return mock analytics data

        analytics = {
            "summary": {
                "total_feedback": 247,
                "average_rating": 4.2,
                "response_rate": 0.68,
                "satisfaction_score": 84,
            },
            "rating_breakdown": {
                "accuracy": 4.1,
                "usefulness": 4.3,
                "completeness": 3.9,
                "clarity": 4.4,
                "actionability": 4.0,
            },
            "feedback_types": {
                "evaluation_quality": 45,
                "recommendation_usefulness": 67,
                "overall_experience": 89,
                "feature_request": 28,
                "bug_report": 18,
            },
            "improvement_suggestions": {
                "new_feature": 15,
                "improvement": 23,
                "bug_fix": 8,
                "ui_ux": 12,
                "performance": 6,
                "other": 9,
            },
            "trends": {
                "satisfaction_trend": "increasing",
                "common_issues": [
                    "Need more detailed financial projections",
                    "Request for industry-specific insights",
                    "Desire for competitive analysis enhancement",
                ],
                "popular_features": [
                    "Quick analysis mode",
                    "SWOT analysis",
                    "Risk assessment",
                ],
            },
        }

        return jsonify(analytics), 200

    except Exception as e:
        logger.error(f"Feedback analytics retrieval failed: {e}")
        return jsonify({"error": "Analytics retrieval failed", "details": str(e)}), 500


@feedback_bp.route("/export", methods=["GET"])
def export_feedback():
    """
    Export feedback data for analysis
    """
    try:
        # Get query parameters
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        feedback_type = request.args.get("type")
        format_type = request.args.get("format", "json")

        # Validate format
        if format_type not in ["json", "csv"]:
            return jsonify({"error": "Format must be json or csv"}), 400

        # In a real application, you would query the database with filters
        # For now, return mock export data

        export_data = {
            "export_info": {
                "generated_at": datetime.now().isoformat(),
                "filters": {
                    "start_date": start_date,
                    "end_date": end_date,
                    "feedback_type": feedback_type,
                    "format": format_type,
                },
                "total_records": 50,
            },
            "feedback_data": [
                {
                    "id": str(uuid.uuid4()),
                    "business_case_id": str(uuid.uuid4()),
                    "rating": 4,
                    "feedback_type": "evaluation_quality",
                    "comments": "Very helpful analysis, but could use more market data",
                    "timestamp": "2024-01-15T10:30:00Z",
                },
                {
                    "id": str(uuid.uuid4()),
                    "business_case_id": str(uuid.uuid4()),
                    "rating": 5,
                    "feedback_type": "recommendation_usefulness",
                    "comments": "Excellent recommendations, very actionable",
                    "timestamp": "2024-01-14T15:45:00Z",
                },
                # In reality, this would contain all matching records
            ],
        }

        if format_type == "csv":
            # In a real application, you would convert to CSV format
            return (
                jsonify(
                    {
                        "message": "CSV export would be generated here",
                        "download_url": "/api/feedback/download/export_123.csv",
                    }
                ),
                200,
            )

        return jsonify(export_data), 200

    except Exception as e:
        logger.error(f"Feedback export failed: {e}")
        return jsonify({"error": "Export failed", "details": str(e)}), 500


@feedback_bp.route("/categories", methods=["GET"])
def get_feedback_categories():
    """
    Get available feedback categories and their descriptions
    """
    try:
        categories = {
            "feedback_types": {
                "evaluation_quality": {
                    "name": "Evaluation Quality",
                    "description": "Feedback on the accuracy and depth of business case evaluation",
                },
                "recommendation_usefulness": {
                    "name": "Recommendation Usefulness",
                    "description": "Feedback on the practicality and value of provided recommendations",
                },
                "overall_experience": {
                    "name": "Overall Experience",
                    "description": "General feedback about the entire evaluation process",
                },
                "feature_request": {
                    "name": "Feature Request",
                    "description": "Suggestions for new features or functionality",
                },
                "bug_report": {
                    "name": "Bug Report",
                    "description": "Reports of technical issues or problems",
                },
            },
            "rating_categories": {
                "accuracy": {
                    "name": "Accuracy",
                    "description": "How accurate and realistic the evaluation results are",
                },
                "usefulness": {
                    "name": "Usefulness",
                    "description": "How useful the evaluation is for decision making",
                },
                "completeness": {
                    "name": "Completeness",
                    "description": "How comprehensive and thorough the evaluation is",
                },
                "clarity": {
                    "name": "Clarity",
                    "description": "How clear and understandable the results are presented",
                },
                "actionability": {
                    "name": "Actionability",
                    "description": "How actionable and practical the recommendations are",
                },
            },
            "improvement_types": {
                "new_feature": "Request for completely new functionality",
                "improvement": "Enhancement to existing features",
                "bug_fix": "Fix for technical issues",
                "ui_ux": "User interface and experience improvements",
                "performance": "Speed and performance optimizations",
                "other": "Other types of suggestions",
            },
        }

        return jsonify(categories), 200

    except Exception as e:
        logger.error(f"Categories retrieval failed: {e}")
        return jsonify({"error": "Categories retrieval failed"}), 500
