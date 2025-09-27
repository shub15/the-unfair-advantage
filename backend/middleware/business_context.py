"""
Business Context Middleware for The Unfair Advantage
Adds startup ecosystem context to requests
"""

from flask import request, g
import time
import uuid


class BusinessContextMiddleware:
    """
    Middleware to add business context and tracking to requests
    """

    def __init__(self, app=None):
        self.app = app
        if app is not None:
            self.init_app(app)

    def init_app(self, app):
        app.before_request(self.before_request)
        app.after_request(self.after_request)

    def before_request(self):
        """Execute before each request"""
        # Generate unique request ID for tracking
        g.request_id = str(uuid.uuid4())[:8]
        g.start_time = time.time()

        # Add business context
        g.business_context = self._get_business_context()

        # Log request start
        if request.path.startswith("/api/"):
            self.app.logger.info(
                f"[{g.request_id}] {request.method} {request.path} - Request started"
            )

    def after_request(self, response):
        """Execute after each request"""
        if hasattr(g, "start_time"):
            duration = round((time.time() - g.start_time) * 1000, 2)  # milliseconds

            # Add headers for debugging
            response.headers["X-Request-ID"] = getattr(g, "request_id", "unknown")
            response.headers["X-Response-Time"] = f"{duration}ms"

            # Log request completion
            if request.path.startswith("/api/"):
                self.app.logger.info(
                    f"[{g.request_id}] {request.method} {request.path} - "
                    f"Completed in {duration}ms with status {response.status_code}"
                )

        return response

    def _get_business_context(self):
        """
        Determine business context from request
        This helps customize evaluation based on the entrepreneur's context
        """
        context = {
            "market_focus": "india",  # Default to Indian market
            "entrepreneur_type": "first_time",  # Assume first-time entrepreneur
            "industry_sector": "general",  # General sector unless specified
            "funding_stage": "pre_seed",  # Assume pre-seed stage
            "target_market": "india_tier1",  # Default to tier 1 cities
        }

        # Extract context from headers or query params
        if request.headers.get("X-Market-Focus"):
            context["market_focus"] = request.headers.get("X-Market-Focus")

        if request.headers.get("X-Industry-Sector"):
            context["industry_sector"] = request.headers.get("X-Industry-Sector")

        if request.args.get("market"):
            context["target_market"] = request.args.get("market")

        if request.args.get("industry"):
            context["industry_sector"] = request.args.get("industry")

        return context
