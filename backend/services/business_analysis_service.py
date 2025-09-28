"""
Business analysis service for comprehensive business evaluation and scoring
"""

import json
import re
import logging
from typing import Dict, Any, Optional
from flask import current_app
from google import genai as gemini_sdk
from google.genai import types
from google.generativeai.types import GenerationConfig
import google.generativeai as genai


class BusinessAnalysisService:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.gemini_client = None
        self.model = None

        # Initialize Gemini client
        try:
            gemini_api_key = current_app.config.get("GEMINI_API_KEY")
            if gemini_api_key:
                # Initialize both clients for different use cases
                genai.configure(api_key=gemini_api_key)
                self.model = genai.GenerativeModel("models/gemini-2.0-flash")

                # Also initialize the new SDK client
                self.gemini_client = gemini_sdk.Client(api_key=gemini_api_key)
                self.logger.info("Business Analysis service initialized successfully")
            else:
                self.logger.warning("GEMINI_API_KEY not found in configuration")
        except Exception as e:
            self.logger.error(
                f"Failed to initialize Business Analysis service: {str(e)}"
            )

    def extract_structured_data_from_ocr(self, raw_text: str) -> Dict[str, Any]:
        """Extract structured business data from OCR text using Gemini"""
        if self.model is None:
            return {"error": "Gemini client not initialized"}

        prompt = f"""
        Extract structured business information from this OCR text and format it as JSON:
        
        OCR Text: {raw_text}
        
        Extract the following information in JSON format:
        {{
            "entrepreneur_info": {{
                "name": "Entrepreneur name",
                "education": "Educational qualification",
                "phone": "Phone number",
                "experience": "Relevant experience"
            }},
            "business_concept": {{
                "business_name": "Name of the business",
                "description": "Brief description of the business idea",
                "industry": "Industry/sector",
                "business_type": "Product/Service/Platform"
            }},
            "value_proposition": {{
                "main_product_service": "Main product or service",
                "unique_selling_point": "What makes this business unique",
                "problem_solved": "Problem being solved"
            }},
            "financial_info": {{
                "loan_requirement": "Loan amount needed",
                "startup_costs": "Initial investment required",
                "revenue_expectations": "Expected revenue"
            }},
            "additional_info": {{
                "target_customers": "Target customer base",
                "location": "Business location",
                "timeline": "Implementation timeline"
            }}
        }}
        
        Use "Not specified" for missing information. Only extract information that is clearly mentioned.
        """

        try:
            response = self.model.generate_content(
                prompt,
                generation_config=GenerationConfig(
                    temperature=0.1, top_p=0.8, top_k=40
                ),
            )

            # Extract JSON from response
            json_match = re.search(r"```json\s*(.*?)\s*```", response.text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(1))
            else:
                # Try to parse the entire response as JSON
                return json.loads(response.text)
        except Exception as e:
            self.logger.error(f"Structured extraction failed: {str(e)}")
            return {
                "error": f"Failed to extract structured data: {str(e)}",
                "raw_response": (
                    response.text if "response" in locals() else "No response"
                ),
            }

    def extract_comprehensive_business_info(
        self,
        ocr_data: Dict[str, Any],
        transcript: str = "",
        language_code: str = "en-IN",
    ) -> Dict[str, Any]:
        """Extract comprehensive business information from both OCR and audio data"""
        if self.model is None:
            return {"error": "Gemini client not initialized"}

        prompt = f"""
        You are an expert business analyst. Extract and synthesize comprehensive business information from both image/OCR data and audio transcript data.
        
        Language: {language_code}
        
        OCR Data from Images:
        {json.dumps(ocr_data, indent=2)}
        
        Audio Transcript:
        {transcript}
        
        Synthesize all available information and create a comprehensive business profile in JSON format:
        {{
            "entrepreneur_profile": {{
                "name": "Entrepreneur name from any source",
                "education": "Educational background",
                "phone": "Contact information", 
                "experience": "Relevant experience mentioned",
                "commitment_level": "Full-time/Part-Time/Side-project",
                "team_size": "Number of people involved"
            }},
            "business_concept": {{
                "business_name": "Name of the business",
                "description": "Comprehensive description combining all sources",
                "industry": "Industry/sector",
                "business_type": "Product/Service/Platform/etc."
            }},
            "target_market": {{
                "primary_customers": "Who are the main customers",
                "market_size": "Estimated market size or description",
                "demographics": "Target customer demographics",
                "geographic_scope": "Local/Regional/National/International"
            }},
            "value_proposition": {{
                "unique_selling_point": "What makes this business unique",
                "problem_solved": "What problem does this solve",
                "benefits_offered": "Key benefits to customers"
            }},
            "revenue_model": {{
                "pricing_strategy": "How will pricing work",
                "revenue_streams": ["List of revenue sources"],
                "payment_model": "One-time/Subscription/Commission/etc."
            }},
            "resources_required": {{
                "startup_costs": "Initial investment needed (from any source)",
                "loan_requirement": "Specific loan amount mentioned",
                "key_resources": ["List of critical resources needed"],
                "skills_needed": ["Required skills or expertise"],
                "technology_requirements": "Any technology needs"
            }},
            "competition": {{
                "competitors": ["List of main competitors"],
                "competitive_advantage": "How to compete/differentiate",
                "market_position": "Positioning strategy"
            }},
            "implementation": {{
                "timeline": "Expected timeline to launch",
                "location": "Business location/area",
                "key_milestones": ["Major milestones"],
                "success_metrics": ["How to measure success"]
            }}
        }}
        
        Instructions:
        1. Prioritize information from multiple sources - if OCR and audio conflict, note both
        2. Use "Not specified" for missing information
        3. Combine and synthesize information from both sources
        4. Be comprehensive but concise
        5. If multiple speakers in audio, consider all perspectives
        """

        try:
            response = self.model.generate_content(
                prompt,
                generation_config=GenerationConfig(
                    temperature=0.1, top_p=0.8, top_k=40
                ),
            )

            json_match = re.search(r"```json\s*(.*?)\s*```", response.text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(1))
            else:
                return json.loads(response.text)

        except Exception as e:
            self.logger.error(f"Error extracting comprehensive business info: {str(e)}")
            return {
                "error": f"Error extracting comprehensive business info: {str(e)}",
                "raw_response": response.text if "response" in locals() else "",
            }

    def calculate_comprehensive_business_score(
        self, business_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Calculate business assessment score considering all available data"""
        if "error" in business_data:
            return {
                "total_score": 0,
                "breakdown": {},
                "eligibility": "Incomplete Information",
            }

        scores = {
            "market_potential": 0,
            "business_model_clarity": 0,
            "financial_feasibility": 0,
            "competitive_advantage": 0,
            "entrepreneur_capability": 0,
        }

        # Market Potential (0-2 points)
        market = business_data.get("target_market", {})
        if market.get("market_size") != "Not specified":
            scores["market_potential"] += 1
        if market.get("primary_customers") != "Not specified":
            scores["market_potential"] += 1

        # Business Model Clarity (0-2 points)
        concept = business_data.get("business_concept", {})
        revenue = business_data.get("revenue_model", {})
        if concept.get("description") != "Not specified":
            scores["business_model_clarity"] += 1
        if revenue.get("pricing_strategy") != "Not specified":
            scores["business_model_clarity"] += 1

        # Financial Feasibility (0-2 points)
        resources = business_data.get("resources_required", {})
        if (
            resources.get("startup_costs") != "Not specified"
            or resources.get("loan_requirement") != "Not specified"
        ):
            scores["financial_feasibility"] += 1
        if revenue.get("revenue_streams"):
            scores["financial_feasibility"] += 1

        # Competitive Advantage (0-2 points)
        value_prop = business_data.get("value_proposition", {})
        competition = business_data.get("competition", {})
        if value_prop.get("unique_selling_point") != "Not specified":
            scores["competitive_advantage"] += 1
        if value_prop.get("problem_solved") != "Not specified":
            scores["competitive_advantage"] += 1

        # Entrepreneur Capability (0-2 points)
        entrepreneur = business_data.get("entrepreneur_profile", {})
        implementation = business_data.get("implementation", {})
        if entrepreneur.get("experience") != "Not specified":
            scores["entrepreneur_capability"] += 1
        if implementation.get("timeline") != "Not specified":
            scores["entrepreneur_capability"] += 1

        total_score = sum(scores.values())

        # Determine eligibility
        if total_score >= 7:
            eligibility = "High Potential - Recommended"
            recommendation = (
                "Strong business case with clear market opportunity and execution plan"
            )
        elif total_score >= 5:
            eligibility = "Good Potential - Consider"
            recommendation = "Promising business idea that needs some development"
        elif total_score >= 3:
            eligibility = "Needs Development"
            recommendation = (
                "Business concept requires significant improvement before funding"
            )
        else:
            eligibility = "Insufficient Information"
            recommendation = "More information needed to properly evaluate the business"

        return {
            "total_score": total_score,
            "max_score": 10,
            "percentage": (total_score / 10) * 100,
            "breakdown": scores,
            "eligibility": eligibility,
            "recommendation": recommendation,
            "score_details": {
                "market_potential": f"{scores['market_potential']}/2 - Market size and customer identification",
                "business_model_clarity": f"{scores['business_model_clarity']}/2 - Business description and pricing strategy",
                "financial_feasibility": f"{scores['financial_feasibility']}/2 - Startup costs and revenue streams",
                "competitive_advantage": f"{scores['competitive_advantage']}/2 - Unique value proposition and problem solving",
                "entrepreneur_capability": f"{scores['entrepreneur_capability']}/2 - Experience and implementation planning",
            },
        }

    def generate_comprehensive_business_case(
        self,
        business_data: Dict[str, Any],
        assessment_score: Dict[str, Any],
        ocr_data: Dict[str, Any],
        transcript: str = "",
    ) -> str:
        """Generate comprehensive business case from all data sources"""
        if self.model is None:
            return "Error: Gemini client not initialized"

        prompt = f"""
        Generate a comprehensive mentor-ready business case based on all available data sources.
        
        Comprehensive Business Data:
        {json.dumps(business_data, indent=2)}
        
        Assessment Score:
        {json.dumps(assessment_score, indent=2)}
        
        Original OCR Data:
        {json.dumps(ocr_data, indent=2)}
        
        Original Audio Transcript:
        {transcript}
        
        Create a structured business case document with the following sections:
        
        1. EXECUTIVE SUMMARY
           - Business concept synthesis from all sources
           - Key value proposition
           - Target market overview
           - Funding requirement (from OCR/audio)
        
        2. DATA SOURCE ANALYSIS
           - Information gathered from visual/written materials
           - Information gathered from audio/verbal explanation
           - Consistency analysis between sources
           - Gaps identified in information
        
        3. BUSINESS ANALYSIS
           - Market opportunity assessment
           - Revenue model evaluation
           - Competitive landscape
           - Implementation feasibility
        
        4. STRENGTHS & OPPORTUNITIES
           - Top business strengths identified
           - Market opportunities
           - Entrepreneur capabilities
        
        5. RISKS & CHALLENGES
           - Key business risks
           - Information gaps and inconsistencies
           - Implementation obstacles
           - Mitigation strategies needed
        
        6. MENTOR EVALUATION FOCUS AREAS
           - Critical questions for mentor discussion
           - Areas needing expert guidance
           - Development priorities
           - Information verification needed
        
        7. RECOMMENDATION
           - Overall assessment considering all data sources
           - Next steps suggested
           - Support needed
           - Priority actions
        
        Format in clear json with appropriate headers and bullet points.
        Be objective, professional, and highlight both strengths and concerns.
        """

        try:
            response = self.model.generate_content(
                prompt,
                generation_config=GenerationConfig(
                    temperature=0.3, top_p=0.9, top_k=40
                ),
            )
            return response.text
        except Exception as e:
            self.logger.error(f"Error generating comprehensive business case: {str(e)}")
            return f"Error generating comprehensive business case: {str(e)}"

    def analyze_business_from_single_source(
        self, structured_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze business when only one data source is available (OCR or audio)"""
        if not structured_data or "error" in structured_data:
            return {"error": "Invalid or missing structured data"}

        # Transform single source data to comprehensive format
        comprehensive_data = {
            "entrepreneur_profile": {
                "name": structured_data.get("entrepreneur_info", {}).get(
                    "name", "Not specified"
                ),
                "education": structured_data.get("entrepreneur_info", {}).get(
                    "education", "Not specified"
                ),
                "phone": structured_data.get("entrepreneur_info", {}).get(
                    "phone", "Not specified"
                ),
                "experience": structured_data.get("entrepreneur_info", {}).get(
                    "experience", "Not specified"
                ),
                "commitment_level": "Not specified",
                "team_size": "Not specified",
            },
            "business_concept": {
                "business_name": structured_data.get("business_concept", {}).get(
                    "business_name", "Not specified"
                ),
                "description": structured_data.get("business_concept", {}).get(
                    "description", "Not specified"
                ),
                "industry": structured_data.get("business_concept", {}).get(
                    "industry", "Not specified"
                ),
                "business_type": structured_data.get("business_concept", {}).get(
                    "business_type", "Not specified"
                ),
            },
            "target_market": {
                "primary_customers": structured_data.get("additional_info", {}).get(
                    "target_customers", "Not specified"
                ),
                "market_size": "Not specified",
                "demographics": "Not specified",
                "geographic_scope": structured_data.get("additional_info", {}).get(
                    "location", "Not specified"
                ),
            },
            "value_proposition": {
                "unique_selling_point": structured_data.get(
                    "value_proposition", {}
                ).get("unique_selling_point", "Not specified"),
                "problem_solved": structured_data.get("value_proposition", {}).get(
                    "problem_solved", "Not specified"
                ),
                "benefits_offered": structured_data.get("value_proposition", {}).get(
                    "main_product_service", "Not specified"
                ),
            },
            "revenue_model": {
                "pricing_strategy": "Not specified",
                "revenue_streams": [],
                "payment_model": "Not specified",
            },
            "resources_required": {
                "startup_costs": structured_data.get("financial_info", {}).get(
                    "startup_costs", "Not specified"
                ),
                "loan_requirement": structured_data.get("financial_info", {}).get(
                    "loan_requirement", "Not specified"
                ),
                "key_resources": [],
                "skills_needed": [],
                "technology_requirements": "Not specified",
            },
            "competition": {
                "competitors": [],
                "competitive_advantage": "Not specified",
                "market_position": "Not specified",
            },
            "implementation": {
                "timeline": structured_data.get("additional_info", {}).get(
                    "timeline", "Not specified"
                ),
                "location": structured_data.get("additional_info", {}).get(
                    "location", "Not specified"
                ),
                "key_milestones": [],
                "success_metrics": [],
            },
        }

        return comprehensive_data
