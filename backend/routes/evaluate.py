"""
Evaluation routes for business idea analysis
"""

from flask import Blueprint, request, jsonify
from services.llm_service import LLMService
from services.translation_service import TranslationService

evaluate_bp = Blueprint("evaluate", __name__)


@evaluate_bp.route("/business-idea", methods=["POST"])
def evaluate_business_idea():
    """Evaluate business idea viability"""
    try:
        data = request.get_json()

        if not data or "text" not in data:
            return jsonify({"error": "Business idea text required"}), 400

        business_text = data["text"]
        preferred_language = data.get("language", "en")

        # Evaluate using LLM service
        llm_service = LLMService()
        evaluation_result = llm_service.evaluate_business_idea(
            business_text, preferred_language
        )

        if "error" in evaluation_result:
            return jsonify(evaluation_result), 500

        # Translate feedback if needed
        if preferred_language != "en":
            translation_service = TranslationService()
            evaluation_result = translation_service.translate_evaluation(
                evaluation_result, preferred_language
            )

        return (
            jsonify(
                {
                    "submission_id": data.get("submission_id"),
                    "evaluation": evaluation_result,
                    "status": "evaluation_complete",
                }
            ),
            200,
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@evaluate_bp.route("/batch", methods=["POST"])
def batch_evaluate():
    """Batch evaluation for multiple submissions"""
    try:
        data = request.get_json()

        if not data or "submissions" not in data:
            return jsonify({"error": "Submissions array required"}), 400

        llm_service = LLMService()
        results = []

        for submission in data["submissions"]:
            if "text" not in submission:
                continue

            evaluation = llm_service.evaluate_business_idea(
                submission["text"], submission.get("language", "en")
            )

            results.append(
                {
                    "submission_id": submission.get("submission_id"),
                    "evaluation": evaluation,
                }
            )

        return jsonify({"batch_results": results, "total_processed": len(results)}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
