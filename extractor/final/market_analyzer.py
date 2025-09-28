import requests
import json
import os
from dotenv import load_dotenv
import google.generativeai as genai
from google.generativeai.types import GenerationConfig
import re

# Load environment variables
load_dotenv()
GOOGLE_SEARCH_API_KEY = os.getenv("GOOGLE_SEARCH_API_KEY")
GOOGLE_SEARCH_ENGINE_ID = os.getenv("GOOGLE_SEARCH_ENGINE_ID")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Configure Gemini API
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('models/gemini-2.0-flash')
else:
    model = None

SEARCH_ENABLED = bool(GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_ENGINE_ID)

def google_search(query, num_results=5):
    """Perform Google search using Custom Search API"""
    if not SEARCH_ENABLED:
        return []
    
    try:
        url = "https://www.googleapis.com/customsearch/v1"
        params = {
            'key': GOOGLE_SEARCH_API_KEY,
            'cx': GOOGLE_SEARCH_ENGINE_ID,
            'q': query,
            'num': num_results
        }
        
        response = requests.get(url, params=params)
        if response.status_code == 200:
            results = response.json()
            return results.get('items', [])
        else:
            return []
    except Exception as e:
        print(f"Search error: {str(e)}")
        return []

def analyze_market_with_search(business_case_json):
    """Analyze market using Google Search and enhance business case"""
    if not SEARCH_ENABLED or model is None:
        # Return enhanced business case with dummy market data
        enhanced_case = business_case_json.copy()
        enhanced_case["market_research"] = {
            "search_enabled": False,
            "market_analysis": "Market research unavailable - API keys not configured",
            "competition_analysis": "Competition research unavailable - API keys not configured",
            "market_potential_score": 75,
            "competitive_landscape_score": 70,
            "industry_trends": ["Market research API not configured"],
            "opportunities": ["Enable Google Search API for detailed market analysis"],
            "threats": ["Limited market intelligence without search integration"]
        }
        return enhanced_case
    
    try:
        # Extract business concept from comprehensive case
        business_concept = ""
        target_market = ""
        location = ""
        
        if "executive_summary" in business_case_json:
            business_concept = business_case_json["executive_summary"].get("business_concept", "")
            target_market = business_case_json["executive_summary"].get("target_market", "")
        
        # Perform market research searches
        market_query = f"{business_concept} market size India 2025"
        market_results = google_search(market_query, 3)
        
        competition_query = f"{business_concept} competition analysis India 2025"
        competition_results = google_search(competition_query, 3)
        
        industry_query = f"{business_concept} industry trends 2025"
        industry_results = google_search(industry_query, 3)
        
        # Use Gemini to analyze search results
        analysis_prompt = f"""
        Analyze this business case with market research data and provide enhanced market intelligence:
        
        Original Business Case:
        {json.dumps(business_case_json, indent=2)}
        
        Market Research Results:
        Market Size Data: {market_results[:2]}
        Competition Data: {competition_results[:2]}
        Industry Trends: {industry_results[:2]}
        
        Provide enhanced market analysis in JSON format:
        {{
            "market_analysis": "Detailed market size and potential analysis based on search results",
            "competition_analysis": "Comprehensive competition landscape analysis",
            "market_potential_score": score (1-100),
            "competitive_landscape_score": score (1-100),
            "industry_trends": ["List of current industry trends"],
            "market_opportunities": ["List of market opportunities identified"],
            "competitive_threats": ["List of competitive threats"],
            "market_entry_barriers": ["List of barriers to entry"],
            "target_market_validation": "Validation of target market based on research",
            "pricing_benchmarks": "Market pricing information if available",
            "growth_projections": "Market growth projections based on research"
        }}
        
        Base your analysis on the actual search results provided.
        """
        
        response = model.generate_content(
            analysis_prompt,
            generation_config=GenerationConfig(
                temperature=0.2,
                top_p=0.8,
                top_k=40
            )
        )
        
        # Extract JSON from response
        json_match = re.search(r'```json\s*(.*?)\s*```', response.text, re.DOTALL)
        if json_match:
            market_intelligence = json.loads(json_match.group(1))
        else:
            market_intelligence = json.loads(response.text)
        
        # Add search metadata
        market_intelligence["search_enabled"] = True
        market_intelligence["search_queries_used"] = [market_query, competition_query, industry_query]
        market_intelligence["search_results_count"] = len(market_results) + len(competition_results) + len(industry_results)
        
        # Enhance the original business case
        enhanced_case = business_case_json.copy()
        enhanced_case["market_research"] = market_intelligence
        
        # Update business analysis section with market research
        if "business_analysis" in enhanced_case:
            enhanced_case["business_analysis"]["market_research_insights"] = {
                "validated_market_size": market_intelligence.get("market_analysis", ""),
                "competitive_positioning": market_intelligence.get("competition_analysis", ""),
                "industry_outlook": market_intelligence.get("industry_trends", [])
            }
        
        return enhanced_case
        
    except Exception as e:
        # Fallback with error information
        enhanced_case = business_case_json.copy()
        enhanced_case["market_research"] = {
            "search_enabled": True,
            "error": f"Market research failed: {str(e)}",
            "market_analysis": "Market research temporarily unavailable",
            "competition_analysis": "Competition research temporarily unavailable",
            "market_potential_score": 70,
            "competitive_landscape_score": 65,
            "industry_trends": ["Market research temporarily unavailable"],
            "opportunities": ["Retry market research when services are available"],
            "threats": ["Limited market intelligence due to technical issues"]
        }
        return enhanced_case

def calculate_enhanced_scores(enhanced_business_case):
    """Calculate enhanced scores including market research insights as primary method"""
    if not model:
        return calculate_fallback_scores(enhanced_business_case)
    
    try:
        scoring_prompt = f"""
        Calculate comprehensive business scores based on the enhanced business case with market research data.
        Use the market research insights as the primary scoring criteria.
        
        Enhanced Business Case:
        {json.dumps(enhanced_business_case, indent=2)}
        
        Scoring Criteria (1-100 each):
        1. Market Potential: Based on market size, demand validation, growth trends from research
        2. Business Model Clarity: Based on revenue model definition, scalability, sustainability
        3. Financial Feasibility: Based on startup costs realism, revenue projections vs market data
        4. Competitive Advantage: Based on differentiation, barriers to entry, competitive positioning
        5. Implementation Readiness: Based on resource availability, timeline realism, risk mitigation
        6. Market Research Score: Based on quality and depth of market validation data
        
        Provide scores in JSON format:
        {{
            "market_potential": integer_score_1_to_100,
            "business_model_clarity": integer_score_1_to_100,
            "financial_feasibility": integer_score_1_to_100,
            "competitive_advantage": integer_score_1_to_100,
            "implementation_readiness": integer_score_1_to_100,
            "market_research_score": integer_score_1_to_100,
            "overall_score": weighted_average_integer,
            "eligibility_status": "High Potential - Recommended|Good Potential - Consider|Needs Development|Insufficient Information",
            "scoring_rationale": {{
                "market_validation": "brief explanation",
                "competitive_analysis": "brief explanation", 
                "financial_viability": "brief explanation",
                "implementation_assessment": "brief explanation"
            }}
        }}
        
        Weight the overall score as: Market Potential (25%), Business Model (20%), Financial (20%), 
        Competitive Advantage (15%), Implementation (10%), Market Research (10%).
        
        Consider market research data heavily - businesses with strong market validation should score higher.
        """
        
        response = model.generate_content(
            scoring_prompt,
            generation_config=GenerationConfig(
                temperature=0.2,
                top_p=0.8,
                top_k=40
            )
        )
        
        json_match = re.search(r'```json\s*(.*?)\s*```', response.text, re.DOTALL)
        if json_match:
            scores = json.loads(json_match.group(1))
            # Ensure all scores are integers
            for key in ["market_potential", "business_model_clarity", "financial_feasibility", 
                       "competitive_advantage", "implementation_readiness", "market_research_score", "overall_score"]:
                if key in scores and isinstance(scores[key], str):
                    try:
                        scores[key] = int(re.search(r'\d+', scores[key]).group())
                    except:
                        scores[key] = 70
            return scores
        else:
            raise ValueError("Could not parse enhanced scores")
            
    except Exception as e:
        print(f"Enhanced scoring failed: {str(e)}, falling back to original method")
        return calculate_fallback_scores(enhanced_business_case)

def calculate_fallback_scores(business_case_data):
    """Fallback scoring method based on data completeness (original method)"""
    # Extract business data from the comprehensive case
    if "executive_summary" in business_case_data:
        # Use the original business data structure
        business_data = {
            "business_concept": business_case_data.get("executive_summary", {}).get("business_concept", ""),
            "target_market": business_case_data.get("executive_summary", {}).get("target_market", ""),
            "revenue_model": business_case_data.get("business_analysis", {}).get("revenue_model", {}).get("evaluation", ""),
            "startup_costs": business_case_data.get("executive_summary", {}).get("funding_requirement", ""),
            "unique_selling_proposition": business_case_data.get("executive_summary", {}).get("value_proposition", ""),
            "competition_analysis": business_case_data.get("business_analysis", {}).get("competitive_landscape", {}).get("competitors", [])
        }
    else:
        # Direct business data
        business_data = business_case_data
    
    scores = {
        "market_potential": 0,
        "business_model_clarity": 0,
        "financial_feasibility": 0,
        "competitive_advantage": 0,
        "implementation_readiness": 0,
        "market_research_score": 50  # Default score for fallback
    }
    
    # Market Potential (0-100 points)
    market_info = business_data.get("target_market", "")
    if market_info and market_info != "Not specified" and len(market_info) > 20:
        scores["market_potential"] = 85
    elif market_info and market_info != "Not specified":
        scores["market_potential"] = 65
    else:
        scores["market_potential"] = 30
    
    # Business Model Clarity (0-100 points)
    concept = business_data.get("business_concept", "")
    revenue = business_data.get("revenue_model", "")
    if concept and concept != "Not specified" and len(concept) > 30:
        scores["business_model_clarity"] += 50
    if revenue and revenue != "Not specified" and len(revenue) > 20:
        scores["business_model_clarity"] += 40
    scores["business_model_clarity"] = min(scores["business_model_clarity"], 100)
    
    # Financial Feasibility (0-100 points)
    startup_costs = business_data.get("startup_costs", "")
    if startup_costs and startup_costs != "Not specified":
        scores["financial_feasibility"] = 75
        # Check if revenue model exists
        if revenue and revenue != "Not specified":
            scores["financial_feasibility"] = 85
    else:
        scores["financial_feasibility"] = 40
        
    # Competitive Advantage (0-100 points)
    usp = business_data.get("unique_selling_proposition", "")
    competition = business_data.get("competition_analysis", "")
    if usp and usp != "Not specified" and len(usp) > 20:
        scores["competitive_advantage"] += 50
    if competition and competition != "Not specified":
        scores["competitive_advantage"] += 40
    scores["competitive_advantage"] = min(scores["competitive_advantage"], 100)
        
    # Implementation Readiness (0-100 points)
    # Check if multiple key fields are filled
    filled_fields = sum(1 for field in [concept, market_info, revenue, startup_costs, usp] 
                       if field and field != "Not specified" and len(field) > 10)
    scores["implementation_readiness"] = min(filled_fields * 20, 100)
    
    # Calculate overall score (weighted average)
    weights = {
        "market_potential": 0.25,
        "business_model_clarity": 0.20,
        "financial_feasibility": 0.20,
        "competitive_advantage": 0.15,
        "implementation_readiness": 0.10,
        "market_research_score": 0.10
    }
    
    overall_score = sum(scores[key] * weights[key] for key in weights.keys())
    
    # Determine eligibility
    if overall_score >= 80:
        eligibility = "High Potential - Recommended"
    elif overall_score >= 65:
        eligibility = "Good Potential - Consider"
    elif overall_score >= 50:
        eligibility = "Needs Development"
    else:
        eligibility = "Insufficient Information"
    
    return {
        "market_potential": int(scores["market_potential"]),
        "business_model_clarity": int(scores["business_model_clarity"]),
        "financial_feasibility": int(scores["financial_feasibility"]),
        "competitive_advantage": int(scores["competitive_advantage"]),
        "implementation_readiness": int(scores["implementation_readiness"]),
        "market_research_score": int(scores["market_research_score"]),
        "overall_score": int(overall_score),
        "eligibility_status": eligibility,
        "scoring_method": "fallback",
        "scoring_rationale": {
            "market_validation": "Based on target market description completeness",
            "competitive_analysis": "Based on USP and competition analysis provided",
            "financial_viability": "Based on startup costs and revenue model definition",
            "implementation_assessment": "Based on overall information completeness"
        }
    }
