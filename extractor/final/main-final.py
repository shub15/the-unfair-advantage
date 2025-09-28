import streamlit as st
import json
import os
import io
import tempfile
from PIL import Image
import google.generativeai as genai
from google.generativeai.types import GenerationConfig
from google.cloud import speech_v1
from google.api_core.exceptions import GoogleAPIError
from pathlib import Path
import sounddevice as sd
import soundfile as sf
import numpy as np
import re
from pydub import AudioSegment
import subprocess
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Configure page settings
st.set_page_config(page_title="The Unfair Advantage - Unified Business Evaluator", layout="wide")

# Initialize Google Cloud credentials for Speech-to-Text
credentials_path = os.path.join(os.path.dirname(__file__), 'service_account.json')
if os.path.exists(credentials_path):
    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = credentials_path

# Initialize Gemini API
try:
    if GEMINI_API_KEY:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel('models/gemini-2.0-flash')
        st.sidebar.success("Gemini API Connected")
    else:
        model = None
        st.sidebar.error("GEMINI_API_KEY not found in .env file")
except Exception as e:
    st.sidebar.error(f"Gemini API Error: {str(e)}")
    model = None

# Initialize Google Cloud Speech-to-Text client using service account
SPEECH_CLIENT = None
SPEECH_CLIENT_AVAILABLE = False
SPEECH_ERROR_MSG = ""

try:
    SPEECH_CLIENT = speech.SpeechClient()
    # Test client by making a dummy request (list supported languages)
    _ = SPEECH_CLIENT.get_supported_languages({'language_code': 'en-US'})
    SPEECH_CLIENT_AVAILABLE = True
except Exception as e:
    SPEECH_ERROR_MSG = f"Google Cloud Speech-to-Text API unavailable: {e}"
    SPEECH_CLIENT = None
    SPEECH_CLIENT_AVAILABLE = False

# Add language mapping for feedback
LANGUAGE_NAMES = {
    'en-IN': 'English',
    'hi-IN': 'Hindi', 
    'mr-IN': 'Marathi',
    'gu-IN': 'Gujarati',
    'or-IN': 'Odia'
}

def initialize_session_state():
    """Initialize session state variables"""
    if 'ocr_data' not in st.session_state:
        st.session_state.ocr_data = {}
    if 'transcript' not in st.session_state:
        st.session_state.transcript = ""
    if 'business_data' not in st.session_state:
        st.session_state.business_data = {}
    if 'assessment_score' not in st.session_state:
        st.session_state.assessment_score = {}
    if 'user_language' not in st.session_state:
        st.session_state.user_language = 'en-IN'  # Default language

# === OCR FUNCTIONS ===

def gemini_vision_ocr(image):
    """Uses Gemini Vision for OCR on images"""
    if model is None:
        return "OCR Failed: Gemini client not initialized."

    try:
        # Convert PIL Image to bytes
        img_byte_arr = io.BytesIO()
        image = image.convert('RGB')
        image.save(img_byte_arr, format='PNG')
        img_byte_arr.seek(0)
        
        # Create prompt for OCR
        prompt = "Perform accurate OCR on this image, extracting all handwritten and printed text. Return only the raw text content."
        
        # Upload image and generate content
        uploaded_file = genai.upload_file(img_byte_arr, mime_type='image/png')
        response = model.generate_content([prompt, uploaded_file])
        
        return response.text
    except Exception as e:
        return f"OCR Failed: {str(e)}"

def extract_structured_data_from_ocr(raw_text):
    """Extract structured business data from OCR text using Gemini"""
    if model is None:
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
        response = model.generate_content(
            prompt,
            generation_config=GenerationConfig(
                temperature=0.1,
                top_p=0.8,
                top_k=40
            )
        )
        
        # Extract JSON from response
        json_match = re.search(r'```json\s*(.*?)\s*```', response.text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(1))
        else:
            # Try to parse the entire response as JSON
            return json.loads(response.text)
    except Exception as e:
        return {"error": f"Failed to extract structured data: {str(e)}", "raw_response": response.text if 'response' in locals() else "No response"}

# === SPEECH-TO-TEXT FUNCTIONS ===

def get_recognition_config(language_code, show_info=False):
    """Get speech recognition config"""
    diarization_config = speech_v1.SpeakerDiarizationConfig(
        enable_speaker_diarization=True,
        min_speaker_count=1,
        max_speaker_count=3
    )
    
    config_params = {
        'language_code': language_code,
        'enable_automatic_punctuation': True,
        'audio_channel_count': 1,
        'enable_word_time_offsets': True,
        'diarization_config': diarization_config
    }
    
    if language_code in ['en-IN', 'hi-IN']:
        config_params['model'] = 'telephony'
        if show_info:
            st.info(f"Using enhanced telephony model for {language_code}")
    elif show_info:
        st.info(f"Using default model for {language_code}")
    
    return speech_v1.RecognitionConfig(**config_params)

def process_diarized_response(response):
    """Process speech recognition response with speaker diarization"""
    if not response.results:
        return "No speech detected in audio."
    
    words_info = []
    for result in response.results:
        for word_info in result.alternatives[0].words:
            words_info.append({
                'word': word_info.word,
                'speaker_tag': word_info.speaker_tag,
                'start_time': word_info.start_time.total_seconds(),
                'end_time': word_info.end_time.total_seconds()
            })
    
    if words_info:
        transcript = ""
        current_speaker = None
        speaker_text = ""
        
        for word_info in words_info:
            if current_speaker != word_info['speaker_tag']:
                if current_speaker is not None:
                    transcript += f"\nSpeaker {current_speaker}: {speaker_text.strip()}\n"
                current_speaker = word_info['speaker_tag']
                speaker_text = ""
            speaker_text += word_info['word'] + " "
        
        if current_speaker is not None:
            transcript += f"\nSpeaker {current_speaker}: {speaker_text.strip()}\n"
        return transcript.strip()
    else:
        # Fallback to basic transcript
        transcript = ""
        for result in response.results:
            transcript += result.alternatives[0].transcript + " "
        return transcript.strip()

def transcribe_audio_chunks(audio_file, language_code, audio_segment):
    """Process long audio files by splitting into chunks"""
    client = speech_v1.SpeechClient()
    chunk_length_ms = 50 * 1000
    chunks = []
    
    st.info(f"Processing audio in chunks (duration: {len(audio_segment)/1000:.1f} seconds)...")
    
    for i in range(0, len(audio_segment), chunk_length_ms):
        chunk = audio_segment[i:i + chunk_length_ms]
        chunks.append(chunk)
    
    full_transcript = ""
    
    for i, chunk in enumerate(chunks):
        chunk_file_path = None
        try:
            with st.spinner(f'Processing chunk {i+1} of {len(chunks)}...'):
                chunk_file_path = tempfile.mktemp(suffix='.wav')
                chunk.export(chunk_file_path, format="wav")
                
                with open(chunk_file_path, 'rb') as f:
                    content = f.read()
                
                audio = speech_v1.RecognitionAudio(content=content)
                config = get_recognition_config(language_code, show_info=False)
                response = client.recognize(config=config, audio=audio)
                
                chunk_transcript = process_diarized_response(response)
                full_transcript += f"\n--- Chunk {i+1} ---\n{chunk_transcript}\n"
                
        except Exception as e:
            st.warning(f"Error processing chunk {i+1}: {str(e)}")
            continue
        finally:
            if chunk_file_path and os.path.exists(chunk_file_path):
                try:
                    os.unlink(chunk_file_path)
                except:
                    pass
    
    return full_transcript.strip()

def transcribe_audio(audio_file, language_code='en-IN'):
    """Transcribe audio file with chunking support"""
    client = speech_v1.SpeechClient()
    
    try:
        audio_segment = AudioSegment.from_file(audio_file)
        duration_seconds = len(audio_segment) / 1000
        
        if duration_seconds > 59:
            return transcribe_audio_chunks(audio_file, language_code, audio_segment)
        
        with open(audio_file, 'rb') as f:
            content = f.read()
        
        audio = speech_v1.RecognitionAudio(content=content)
        config = get_recognition_config(language_code, show_info=True)
        response = client.recognize(config=config, audio=audio)
        
        return process_diarized_response(response)
        
    except Exception as e:
        return f"Error transcribing audio: {str(e)}"

# === BUSINESS ANALYSIS FUNCTIONS ===

def extract_comprehensive_business_info(ocr_data, transcript, language_code='en-IN'):
    """Extract comprehensive business information from both OCR and audio data"""
    if model is None:
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
        response = model.generate_content(
            prompt,
            generation_config=GenerationConfig(
                temperature=0.1,
                top_p=0.8,
                top_k=40
            )
        )
        
        json_match = re.search(r'```json\s*(.*?)\s*```', response.text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(1))
        else:
            return json.loads(response.text)
            
    except Exception as e:
        return {"error": f"Error extracting comprehensive business info: {str(e)}", "raw_response": response.text if 'response' in locals() else ""}

def calculate_comprehensive_business_score(business_data):
    """Calculate business assessment score - now serves as fallback only"""
    # This function is now primarily a fallback for when market analysis fails
    if "error" in business_data:
        return {"total_score": 0, "breakdown": {}, "eligibility": "Incomplete Information"}
    
    scores = {
        "market_potential": 0,
        "business_model_clarity": 0,
        "financial_feasibility": 0,
        "competitive_advantage": 0,
        "entrepreneur_capability": 0
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
    if resources.get("startup_costs") != "Not specified" or resources.get("loan_requirement") != "Not specified":
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
    elif total_score >= 5:
        eligibility = "Good Potential - Consider"
    elif total_score >= 3:
        eligibility = "Needs Development"
    else:
        eligibility = "Insufficient Information"
    
    return {
        "total_score": total_score,
        "max_score": 10,
        "percentage": (total_score / 10) * 100,
        "breakdown": scores,
        "eligibility": eligibility,
        "scoring_method": "legacy_fallback"
    }

def generate_comprehensive_business_case(business_data, assessment_score, ocr_data, transcript):
    """Generate comprehensive business case from all data sources"""
    if model is None:
        return "Error: Gemini client not initialized"

    prompt = f"""
    Generate a comprehensive business case based on ALL the provided data sources below.
    DO NOT use any dummy or placeholder data. Only use the information provided.
    
    ACTUAL BUSINESS DATA FROM USER INPUT:
    {json.dumps(business_data, indent=2)}
    
    ASSESSMENT SCORE DATA:
    {json.dumps(assessment_score, indent=2)}
    
    ORIGINAL OCR DATA FROM IMAGES:
    {json.dumps(ocr_data, indent=2)}
    
    ORIGINAL AUDIO TRANSCRIPT:
    {transcript}
    
    Create a comprehensive business case using ONLY the data provided above. Return as JSON:
    {{
        "executive_summary": {{
            "business_concept": "Extract from the provided business_data, NOT dummy data",
            "value_proposition": "Use actual value proposition from input data",
            "target_market": "Use actual target market from input data",
            "funding_requirement": "Use actual funding info from OCR/audio data"
        }},
        "data_source_analysis": {{
            "visual_materials": ["Information extracted from the OCR data provided"],
            "verbal_explanation": ["Information from the actual transcript provided"],
            "consistency_analysis": ["Compare OCR and transcript data provided"],
            "identified_gaps": ["Missing info based on actual data provided"]
        }},
        "business_analysis": {{
            "market_opportunity": {{
                "assessment": "Based on actual target_market data provided",
                "size": "Based on actual market info from input",
                "growth_potential": "Based on actual business concept provided"
            }},
            "revenue_model": {{
                "evaluation": "Based on actual revenue_model from input",
                "streams": ["From actual revenue_streams in business_data"],
                "projections": "From actual financial data in input"
            }},
            "competitive_landscape": {{
                "competitors": ["From actual competition data in input"],
                "position": "Based on actual competitive_advantage from input",
                "advantages": ["From actual unique_selling_point in input"]
            }},
            "implementation_feasibility": {{
                "startup_requirements": "From actual resources_required in input",
                "timeline": "From actual implementation timeline in input",
                "risks": ["Based on actual business challenges identified"]
            }}
        }},
        "strengths_opportunities": {{
            "business_strengths": ["From actual entrepreneur_profile and business strengths"],
            "market_opportunities": ["From actual market analysis of input data"],
            "entrepreneur_capabilities": ["From actual entrepreneur_profile data"]
        }},
        "risks_challenges": {{
            "business_risks": ["Based on actual competition and market data"],
            "information_gaps": ["What's missing from the actual input provided"],
            "implementation_obstacles": ["Based on actual resource requirements"],
            "mitigation_strategies": ["Relevant to actual business concept provided"]
        }},
        "mentor_evaluation": {{
            "critical_questions": ["Specific to the actual business provided"],
            "guidance_areas": ["Based on actual gaps in business_data"],
            "development_priorities": ["Specific to actual business needs"],
            "verification_needs": ["What needs checking in actual business plan"]
        }},
        "recommendation": {{
            "overall_assessment": "Assessment of the ACTUAL business provided",
            "next_steps": ["Specific to the actual business concept"],
            "support_needed": ["Based on actual entrepreneur_profile needs"],
            "priority_actions": ["Relevant to actual business implementation"]
        }}
    }}

    CRITICAL: Use ONLY the data provided above. Do not use any pre-existing examples or dummy data.
    Focus on the actual business concept, location, target market, and financial details from the input.
    """
    
    try:
        response = model.generate_content(
            prompt,
            generation_config=GenerationConfig(
                temperature=0.1,  # Lower temperature for more focused responses
                top_p=0.8,
                top_k=40
            )
        )
        
        # Extract and parse JSON response
        json_match = re.search(r'```json\s*(.*?)\s*```', response.text, re.DOTALL)
        if json_match:
            case_content = json.loads(json_match.group(1))
        else:
            case_content = json.loads(response.text)
        
        # Validate that the response is using actual data by checking key fields
        actual_business_concept = business_data.get("business_concept", {}).get("description", "")
        generated_concept = case_content.get("executive_summary", {}).get("business_concept", "")
        
        # If the generated content seems to be using dummy data, regenerate with more specific prompt
        if "mobile application" in generated_concept.lower() and "mobile application" not in actual_business_concept.lower():
            st.warning("Detected dummy data usage, regenerating with actual input...")
            
            # More specific second attempt
            specific_prompt = f"""
            You are generating a business case for this SPECIFIC business:
            
            Business Name: {business_data.get("business_concept", {}).get("business_name", "Not specified")}
            Business Description: {business_data.get("business_concept", {}).get("description", "Not specified")}
            Location: {business_data.get("implementation", {}).get("location", "Not specified")}
            Target Customers: {business_data.get("target_market", {}).get("primary_customers", "Not specified")}
            Startup Costs: {business_data.get("resources_required", {}).get("startup_costs", "Not specified")}
            
            OCR Text Content: {ocr_data.get("raw_text", "No OCR data")}
            Audio Transcript: {transcript if transcript else "No audio transcript"}
            
            Generate a business case for THIS SPECIFIC BUSINESS ONLY. Do not use any mobile app or farming examples.
            """
            
            response = model.generate_content(
                specific_prompt,
                generation_config=GenerationConfig(
                    temperature=0.05,  # Very low temperature
                    top_p=0.7,
                    top_k=20
                )
            )
            
            json_match = re.search(r'```json\s*(.*?)\s*```', response.text, re.DOTALL)
            if json_match:
                case_content = json.loads(json_match.group(1))
            else:
                case_content = json.loads(response.text)
        
        # Save comprehensive business case as JSON
        case_path = os.path.join(os.path.dirname(__file__), 'comprehensive_business_case.json')
        with open(case_path, 'w', encoding='utf-8') as f:
            json.dump(case_content, f, indent=2)
        
        # ENHANCED: Perform market research analysis (PRIMARY SCORING)
        try:
            from market_analyzer import analyze_market_with_search, calculate_enhanced_scores
            
            # Enhance with market research
            enhanced_case = analyze_market_with_search(case_content)
            
            # Calculate enhanced scores (PRIMARY METHOD)
            enhanced_scores = calculate_enhanced_scores(enhanced_case)
            enhanced_case["enhanced_scores"] = enhanced_scores
            enhanced_case["primary_scoring_method"] = "market_research_based"
            
            # Save enhanced business case
            enhanced_case_path = os.path.join(os.path.dirname(__file__), 'enhanced_business_case.json')
            with open(enhanced_case_path, 'w', encoding='utf-8') as f:
                json.dump(enhanced_case, f, indent=2)
            
            # Use enhanced case for stakeholder views
            case_content = enhanced_case
            
            # Store enhanced scores in session state
            st.session_state.enhanced_scores = enhanced_scores
            
        except Exception as e:
            st.warning(f"Market research analysis failed: {str(e)}, using fallback scoring")
            # Use fallback scoring method
            fallback_scores = calculate_comprehensive_business_score(business_data)
            case_content["enhanced_scores"] = {
                "overall_score": fallback_scores["percentage"],
                "market_potential": fallback_scores["breakdown"].get("market_potential", 0) * 50,
                "business_model_clarity": fallback_scores["breakdown"].get("business_model_clarity", 0) * 50,
                "financial_feasibility": fallback_scores["breakdown"].get("financial_feasibility", 0) * 50,
                "competitive_advantage": fallback_scores["breakdown"].get("competitive_advantage", 0) * 50,
                "implementation_readiness": fallback_scores["breakdown"].get("entrepreneur_capability", 0) * 50,
                "market_research_score": 30,
                "eligibility_status": fallback_scores["eligibility"],
                "scoring_method": "fallback"
            }
            case_content["primary_scoring_method"] = "fallback"
            
        # Generate stakeholder views using the corrected case content
        try:
            from output_generator import save_stakeholder_views
            # Pass the corrected case_path that contains actual data and user language
            with open(case_path, 'w', encoding='utf-8') as f:
                json.dump(case_content, f, indent=2)
                
            # Get user's language preference, default to English if not set
            user_language = st.session_state.get('user_language', 'en-IN')
            
            stakeholder_files, stakeholder_contents = save_stakeholder_views(case_path, model, user_language)
            # Store stakeholder contents in session state
            st.session_state.stakeholder_views = stakeholder_contents
            return case_content, stakeholder_files
        except Exception as e:
            st.warning(f"Error generating stakeholder views: {str(e)}")
            return case_content, None
            
    except Exception as e:
        return f"Error generating comprehensive business case: {str(e)}"

# === AUDIO PROCESSING UTILITIES ===

def check_ffmpeg_installation():
    """Check if FFmpeg is installed"""
    try:
        result = subprocess.run(['ffmpeg', '-version'], capture_output=True, text=True)
        return result.returncode == 0
    except FileNotFoundError:
        return False

def convert_video_to_wav(video_path):
    """Convert video file to WAV format"""
    try:
        audio = AudioSegment.from_file(video_path)
        wav_path = video_path.rsplit(".", 1)[0] + ".wav"
        audio.export(wav_path, format="wav", parameters=["-ac", "1", "-ar", "16000"])
        return wav_path
    except Exception as e:
        st.error(f"Error converting video: {str(e)}")
        return None

def record_audio(duration=10, sample_rate=44100):
    """Record audio from microphone"""
    try:
        with st.spinner('Recording...'):
            recording = sd.rec(int(duration * sample_rate), samplerate=sample_rate, channels=1)
            sd.wait()
        return recording, sample_rate
    except Exception as e:
        st.error(f"Error recording audio: {str(e)}")
        return None, None

# Add language mapping for feedback
LANGUAGE_NAMES = {
    'en-IN': 'English',
    'hi-IN': 'Hindi', 
    'mr-IN': 'Marathi',
    'gu-IN': 'Gujarati',
    'or-IN': 'Odia'
}

def generate_user_feedback(business_data, assessment_score, language_code='en-IN'):
    """Generate user-friendly feedback in their selected language"""
    if model is None:
        return {"error": "Gemini client not initialized"}

    # Determine language for feedback
    language_name = LANGUAGE_NAMES.get(language_code, 'English')
    
    prompt = f"""
    Generate encouraging and constructive feedback for an entrepreneur from a rural/semi-urban area.
    Provide the feedback in {language_name} language in simple, easy-to-understand terms.
    
    Business Information:
    {json.dumps(business_data, indent=2)}
    
    Assessment Score:
    {json.dumps(assessment_score, indent=2)}
    
    Create feedback in JSON format:
    {{
        "congratulations_message": "Warm congratulations message in {language_name}",
        "business_strengths": {{
            "title": "Your Business Strengths in {language_name}",
            "points": ["3-4 specific strengths in simple {language_name}"]
        }},
        "improvement_areas": {{
            "title": "Areas for Improvement in {language_name}",
            "points": ["3-4 gentle suggestions for improvement in simple {language_name}"]
        }},
        "next_steps": {{
            "title": "Next Steps in {language_name}",
            "immediate_actions": ["2-3 immediate actionable steps in simple {language_name}"],
            "long_term_goals": ["2-3 long-term goals in simple {language_name}"]
        }},
        "resources_needed": {{
            "title": "Resources You Need in {language_name}",
            "financial": "Financial needs explanation in simple {language_name}",
            "skills": ["Skills to develop in simple {language_name}"],
            "support": ["Types of support available in simple {language_name}"]
        }},
        "encouragement": {{
            "title": "Encouragement in {language_name}",
            "message": "Motivational message highlighting their potential in {language_name}"
        }},
        "scoring_explanation": {{
            "title": "Your Score in {language_name}",
            "overall_score": "Overall score with simple explanation in {language_name}",
            "what_it_means": "What the score means in simple terms in {language_name}",
            "how_to_improve": "Simple advice on improving the score in {language_name}"
        }}
    }}
    
    Guidelines:
    - Use simple, non-technical language appropriate for rural/semi-urban entrepreneurs
    - Be encouraging and positive while being honest about areas for improvement
    - Avoid business jargon and complex terms
    - Focus on practical, actionable advice
    - Highlight their strengths and potential
    - Make them feel confident about their business idea
    - If language is not English, use appropriate cultural context and expressions
    """
    
    try:
        response = model.generate_content(
            prompt,
            generation_config=GenerationConfig(
                temperature=0.3,
                top_p=0.8,
                top_k=40
            )
        )
        
        json_match = re.search(r'```json\s*(.*?)\s*```', response.text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(1))
        else:
            return json.loads(response.text)
            
    except Exception as e:
        return {"error": f"Error generating user feedback: {str(e)}"}

# === MAIN APPLICATION ===

def main():
    st.title("🎯 The Unfair Advantage - Unified Business Evaluator")
    st.markdown("**Comprehensive business plan analysis from images and voice inputs**")
    
    initialize_session_state()
    
    # Sidebar status
    st.sidebar.title("System Status")
    if check_ffmpeg_installation():
        st.sidebar.success("✅ Audio Processing Ready")
    else:
        st.sidebar.warning("⚠️ FFmpeg not installed - audio features limited")
    
    # Main tabs
    tab1, tab2, tab3 = st.tabs(["📄 Image Analysis", "🎤 Voice Input", "📊 Comprehensive Analysis"])
    
    # === IMAGE ANALYSIS TAB ===
    with tab1:
        st.header("Business Plan Image Analysis")
        
        # Image upload
        uploaded_images = st.file_uploader(
            "Upload business plan images or sketches",
            type=['jpg', 'jpeg', 'png'],
            accept_multiple_files=True,
            help="Upload images of handwritten business plans, sketches, or diagrams"
        )
        
        if uploaded_images:
            st.subheader("Uploaded Images")
            cols = st.columns(min(len(uploaded_images), 3))
            for i, img in enumerate(uploaded_images):
                with cols[i % 3]:
                    image = Image.open(img)
                    st.image(image, caption=img.name, use_column_width=True)
            
            if st.button("Analyze Images", type="primary"):
                with st.spinner("Processing images with OCR..."):
                    all_ocr_text = []
                    for img in uploaded_images:
                        image = Image.open(img)
                        ocr_text = gemini_vision_ocr(image)
                        all_ocr_text.append(f"=== {img.name} ===\n{ocr_text}")
                    
                    combined_ocr = "\n\n".join(all_ocr_text)
                    structured_data = extract_structured_data_from_ocr(combined_ocr)
                    
                    st.session_state.ocr_data = {
                        "raw_text": combined_ocr,
                        "structured_data": structured_data
                    }
                    
                    st.success("✅ Images processed successfully!")
                    
                    # Display results
                    with st.expander("📄 Raw OCR Text"):
                        st.text_area("Extracted text:", combined_ocr, height=200)
                    
                    with st.expander("🏗️ Structured Data"):
                        st.json(structured_data)
    
    # === VOICE INPUT TAB ===
    with tab2:
        st.header("Voice Input & Audio Analysis")
        
        # Language selection
        languages = {
            'English': 'en-IN',
            'Hindi': 'hi-IN', 
            'Marathi': 'mr-IN',
            'Gujarati': 'gu-IN',
            'Odia': 'or-IN'
        }
        
        selected_language = st.selectbox(
            "Select audio language:",
            list(languages.keys()),
            help="Choose the primary language in your audio"
        )
        language_code = languages[selected_language]
        
        # Store user's language preference
        st.session_state.user_language = language_code

        # Audio input options
        input_method = st.radio(
            "Choose input method:",
            ["Upload Audio/Video File", "Record Live Audio"],
            help="Upload existing files or record directly"
        )
        
        if input_method == "Upload Audio/Video File":
            uploaded_audio = st.file_uploader(
                "Upload audio or video file",
                type=['wav', 'mp3', 'm4a', 'mp4', 'mov', 'avi'],
                help="Supports audio and video formats with automatic conversion"
            )
            
            if uploaded_audio:
                file_key = f"{uploaded_audio.name}_{uploaded_audio.size}"
                
                if st.button("Process Audio/Video", type="primary") or st.session_state.get('processed_audio_file') != file_key:
                    with st.spinner('Processing audio/video...'):
                        # Save file temporarily
                        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(uploaded_audio.name).suffix) as tmp_file:
                            tmp_file.write(uploaded_audio.getvalue())
                            audio_path = tmp_file.name
                        
                        try:
                            # Convert video to audio if needed
                            file_extension = uploaded_audio.name.lower().split('.')[-1]
                            if file_extension in ['mp4', 'mov', 'avi']:
                                wav_path = convert_video_to_wav(audio_path)
                                if wav_path:
                                    audio_path = wav_path
                                else:
                                    st.error("Failed to convert video")
                                    return
                            
                            # Transcribe audio
                            transcript = transcribe_audio(audio_path, language_code)
                            st.session_state.transcript = transcript
                            st.session_state.processed_audio_file = file_key
                            
                            st.success("✅ Audio processed successfully!")
                            
                        except Exception as e:
                            st.error(f"Processing error: {str(e)}")
                        finally:
                            # Cleanup
                            try:
                                os.unlink(audio_path)
                                if 'wav_path' in locals() and wav_path != audio_path:
                                    os.unlink(wav_path)
                            except:
                                pass
        
        else:  # Record Live Audio
            duration = st.slider("Recording duration (seconds):", 5, 60, 10)
            
            if st.button("🎤 Start Recording", type="primary"):
                audio_data, sample_rate = record_audio(duration)
                
                if audio_data is not None:
                    with st.spinner('Processing recorded audio...'):
                        # Save recording
                        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp_file:
                            sf.write(tmp_file.name, audio_data, sample_rate)
                            audio_path = tmp_file.name
                        
                        try:
                            transcript = transcribe_audio(audio_path, language_code)
                            st.session_state.transcript = transcript
                            st.success("✅ Recording processed successfully!")
                        except Exception as e:
                            st.error(f"Processing error: {str(e)}")
                        finally:
                            os.unlink(audio_path)
        
        # Display current transcript
        if st.session_state.transcript:
            st.subheader("Current Transcript")
            if "Speaker" in st.session_state.transcript:
                st.text_area("Multi-speaker transcript:", st.session_state.transcript, height=200, disabled=True)
            else:
                st.text_area("Transcript:", st.session_state.transcript, height=200, disabled=True)
    
    # === COMPREHENSIVE ANALYSIS TAB ===
    with tab3:
        st.header("Comprehensive Business Analysis")
        
        # Show available data sources
        col1, col2 = st.columns(2)
        with col1:
            if st.session_state.ocr_data:
                st.success("✅ Image data available")
            else:
                st.info("ℹ️ No image data - upload images in tab 1")
        
        with col2:
            if st.session_state.transcript:
                st.success("✅ Audio transcript available")
            else:
                st.info("ℹ️ No audio data - record/upload audio in tab 2")
        
        # Comprehensive analysis button
        if st.button("🔍 Generate Comprehensive Analysis", type="primary", disabled=not (st.session_state.ocr_data or st.session_state.transcript)):
            if not st.session_state.ocr_data and not st.session_state.transcript:
                st.error("Please provide at least one data source (document or audio)")
            else:
                with st.spinner('Analyzing all available data sources...'):
                    # Extract comprehensive business information
                    business_data = extract_comprehensive_business_info(
                        st.session_state.ocr_data.get('structured_data', {}),
                        st.session_state.transcript
                    )
                    
                    st.session_state.business_data = business_data
                    
                    if "error" not in business_data:
                        # Calculate assessment score
                        assessment_score = calculate_comprehensive_business_score(business_data)
                        st.session_state.assessment_score = assessment_score
                        
                        st.success("✅ Comprehensive analysis complete!")
                        
                        # Display results
                        st.subheader("📊 Business Information Summary")
                        
                        # Create summary display
                        summary_col1, summary_col2 = st.columns(2)
                        
                        with summary_col1:
                            st.write("**Entrepreneur Profile:**")
                            entrepreneur = business_data.get("entrepreneur_profile", {})
                            st.write(f"- Name: {entrepreneur.get('name', 'Not specified')}")
                            st.write(f"- Experience: {entrepreneur.get('experience', 'Not specified')}")
                            st.write(f"- Education: {entrepreneur.get('education', 'Not specified')}")
                            
                            st.write("**Business Concept:**")
                            concept = business_data.get("business_concept", {})
                            st.write(f"- Name: {concept.get('business_name', 'Not specified')}")
                            st.write(f"- Industry: {concept.get('industry', 'Not specified')}")
                            st.write(f"- Type: {concept.get('business_type', 'Not specified')}")
                            
                            st.write("**Financial Requirements:**")
                            resources = business_data.get("resources_required", {})
                            st.write(f"- Startup Costs: {resources.get('startup_costs', 'Not specified')}")
                            st.write(f"- Loan Requirement: {resources.get('loan_requirement', 'Not specified')}")
                        
                        with summary_col2:
                            st.write("**Target Market:**")
                            market = business_data.get("target_market", {})
                            st.write(f"- Customers: {market.get('primary_customers', 'Not specified')}")
                            st.write(f"- Market Size: {market.get('market_size', 'Not specified')}")
                            st.write(f"- Scope: {market.get('geographic_scope', 'Not specified')}")
                            
                            st.write("**Value Proposition:**")
                            value = business_data.get("value_proposition", {})
                            st.write(f"- USP: {value.get('unique_selling_point', 'Not specified')}")
                            st.write(f"- Problem Solved: {value.get('problem_solved', 'Not specified')}")
                            
                            st.write("**Implementation:**")
                            implementation = business_data.get("implementation", {})
                            st.write(f"- Timeline: {implementation.get('timeline', 'Not specified')}")
                            st.write(f"- Location: {implementation.get('location', 'Not specified')}")
                        
                        # Assessment score display
                        st.subheader("🎯 Business Assessment Score")
                        
                        # Check if we have enhanced scores
                        if st.session_state.get('enhanced_scores'):
                            enhanced_scores = st.session_state.enhanced_scores
                            
                            score_col1, score_col2 = st.columns(2)
                            with score_col1:
                                st.metric(
                                    "Overall Score", 
                                    f"{enhanced_scores.get('overall_score', 0)}/100",
                                    help="Score based on market research and comprehensive analysis"
                                )
                                st.write(f"**Eligibility:** {enhanced_scores.get('eligibility_status', 'Unknown')}")
                                scoring_method = enhanced_scores.get('scoring_method', 'enhanced')
                                if scoring_method == 'fallback':
                                    st.warning("⚠️ Using fallback scoring (market research unavailable)")
                                else:
                                    st.success("✅ Enhanced scoring with market research")
                            
                            with score_col2:
                                st.write("**Detailed Scores:**")
                                st.write(f"- Market Potential: {enhanced_scores.get('market_potential', 0)}/100")
                                st.write(f"- Business Model: {enhanced_scores.get('business_model_clarity', 0)}/100")
                                st.write(f"- Financial Feasibility: {enhanced_scores.get('financial_feasibility', 0)}/100")
                                st.write(f"- Competitive Advantage: {enhanced_scores.get('competitive_advantage', 0)}/100")
                                st.write(f"- Implementation Readiness: {enhanced_scores.get('implementation_readiness', 0)}/100")
                                st.write(f"- Market Research Score: {enhanced_scores.get('market_research_score', 0)}/100")
                        else:
                            # Fallback to original scoring display
                            score_col1, score_col2 = st.columns(2)
                            with score_col1:
                                st.metric(
                                    "Overall Score", 
                                    f"{assessment_score['total_score']}/10",
                                    f"{assessment_score['percentage']:.1f}%"
                                )
                                st.write(f"**Eligibility:** {assessment_score['eligibility']}")
                            
                            with score_col2:
                                st.write("**Score Breakdown:**")
                                for criteria, score in assessment_score['breakdown'].items():
                                    st.write(f"- {criteria.replace('_', ' ').title()}: {score}/2")
                        
                        # Complete data view
                        with st.expander("🔍 View Complete Business Data (JSON)"):
                            st.json(business_data)
                    
                    else:
                        st.error(f"Analysis failed: {business_data.get('error', 'Unknown error')}")
                        if 'raw_response' in business_data:
                            with st.expander("Debug Information"):
                                st.text(business_data['raw_response'])
        
        # Generate final business case
        if st.session_state.business_data and "error" not in st.session_state.business_data:
            st.divider()
            
            # Add User Feedback Section
            if st.button("💬 Get Personalized Feedback", type="primary"):
                # Get the language from session state
                feedback_language = st.session_state.get('user_language', 'en-IN')
                
                with st.spinner('Generating personalized feedback...'):
                    user_feedback = generate_user_feedback(
                        st.session_state.business_data,
                        st.session_state.get('assessment_score', {}),
                        feedback_language
                    )
                    
                    if "error" not in user_feedback:
                        st.session_state.user_feedback = user_feedback
                        st.success("✅ Personalized feedback generated!")
                        
                        # Display user feedback
                        st.subheader("🌟 Your Business Feedback")
                        
                        # Congratulations message
                        st.success(user_feedback.get("congratulations_message", ""))
                        
                        # Business strengths
                        strengths = user_feedback.get("business_strengths", {})
                        st.subheader(strengths.get("title", "Your Business Strengths"))
                        for strength in strengths.get("points", []):
                            st.write(f"✅ {strength}")
                        
                        # Improvement areas
                        improvements = user_feedback.get("improvement_areas", {})
                        st.subheader(improvements.get("title", "Areas for Improvement"))
                        for improvement in improvements.get("points", []):
                            st.write(f"💡 {improvement}")
                        
                        # Next steps
                        next_steps = user_feedback.get("next_steps", {})
                        st.subheader(next_steps.get("title", "Next Steps"))
                        
                        col1, col2 = st.columns(2)
                        with col1:
                            st.write("**Immediate Actions:**")
                            for action in next_steps.get("immediate_actions", []):
                                st.write(f"🎯 {action}")
                        
                        with col2:
                            st.write("**Long-term Goals:**")
                            for goal in next_steps.get("long_term_goals", []):
                                st.write(f"🚀 {goal}")
                        
                        # Resources needed
                        resources = user_feedback.get("resources_needed", {})
                        st.subheader(resources.get("title", "Resources You Need"))
                        
                        st.write(f"**Financial:** {resources.get('financial', '')}")
                        
                        if resources.get("skills"):
                            st.write("**Skills to Develop:**")
                            for skill in resources.get("skills", []):
                                st.write(f"📚 {skill}")
                        
                        if resources.get("support"):
                            st.write("**Support Available:**")
                            for support in resources.get("support", []):
                                st.write(f"🤝 {support}")
                        
                        # Scoring explanation
                        scoring = user_feedback.get("scoring_explanation", {})
                        st.subheader(scoring.get("title", "Your Score"))
                        st.info(f"**Score:** {scoring.get('overall_score', '')}")
                        st.write(f"**What it means:** {scoring.get('what_it_means', '')}")
                        st.write(f"**How to improve:** {scoring.get('how_to_improve', '')}")
                        
                        # Encouragement
                        encouragement = user_feedback.get("encouragement", {})
                        st.subheader(encouragement.get("title", "Encouragement"))
                        st.success(encouragement.get("message", ""))
                        
                        # Download feedback
                        lang_name = LANGUAGE_NAMES.get(feedback_language, 'English')
                        st.download_button(
                            label=f"📄 Download Your Feedback ({lang_name})",
                            data=json.dumps(user_feedback, indent=2, ensure_ascii=False),
                            file_name=f"business_feedback_{feedback_language}.json",
                            mime="application/json"
                        )
                    else:
                        st.error(f"Failed to generate feedback: {user_feedback['error']}")

            if st.button("📋 Generate Mentor-Ready Business Case", type="secondary"):
                with st.spinner('Creating comprehensive business case...'):
                    if 'stakeholder_views' not in st.session_state:
                        # Debug: Show what data is being passed
                        st.write("**Debug - Data being processed:**")
                        with st.expander("Business Data"):
                            st.json(st.session_state.business_data)
                        with st.expander("OCR Data"):
                            st.json(st.session_state.ocr_data)
                        with st.expander("Transcript"):
                            st.text(st.session_state.transcript)
                        
                        business_case_result = generate_comprehensive_business_case(
                            st.session_state.business_data,
                            st.session_state.assessment_score,
                            st.session_state.ocr_data,
                            st.session_state.transcript
                        )
                        
                        if isinstance(business_case_result, tuple):
                            business_case, stakeholder_files = business_case_result
                            st.session_state.comprehensive_case = business_case
                            st.session_state.stakeholder_files = stakeholder_files
                        else:
                            st.error(business_case_result)
                            return
                    
                    # Display comprehensive case
                    st.subheader("📋 Comprehensive Business Case")
                    if isinstance(st.session_state.comprehensive_case, dict):
                        # Check if the generated case is using actual data
                        concept = st.session_state.comprehensive_case.get("executive_summary", {}).get("business_concept", "")
                        if "mobile application" in concept.lower():
                            st.error("🚨 Generated case is using dummy data instead of your input. Please try again.")
                        else:
                            st.success("✅ Using your actual business data")
                        st.json(st.session_state.comprehensive_case)
                    else:
                        st.markdown(st.session_state.comprehensive_case)
                    
                    # Display stakeholder downloads
                    if st.session_state.get('stakeholder_views'):
                        st.subheader("📑 Stakeholder-Specific Views")
                        
                        download_cols = st.columns(3)
                        for idx, (stakeholder, content) in enumerate(st.session_state.stakeholder_views.items()):
                            with download_cols[idx]:
                                # Show language info for entrepreneur view
                                if stakeholder == 'entrepreneur':
                                    user_lang = st.session_state.get('user_language', 'en-IN')
                                    lang_name = LANGUAGE_NAMES.get(user_lang, 'English')
                                    label = f"📄 Download Entrepreneur View ({lang_name})"
                                    filename = f"business_case_entrepreneur_{user_lang}.json"
                                else:
                                    label = f"📄 Download {stakeholder.title()} View"
                                    filename = f"business_case_{stakeholder}.json"
                                
                                st.download_button(
                                    label=label,
                                    data=json.dumps(content, indent=2, ensure_ascii=False),
                                    file_name=filename,
                                    mime="application/json",
                                    key=f"download_{stakeholder}"
                                )
                        
                        # Preview stakeholder views in expandable sections
                        st.subheader("Preview Stakeholder Views")
                        
                        # Show language info for entrepreneur preview
                        user_lang = st.session_state.get('user_language', 'en-IN')
                        lang_name = LANGUAGE_NAMES.get(user_lang, 'English')
                        tab_labels = [f"Entrepreneur View ({lang_name})", "Mentor View", "Admin View"]
                        
                        tabs = st.tabs(tab_labels)
                        for tab, (stakeholder, content) in zip(tabs, st.session_state.stakeholder_views.items()):
                            with tab:
                                if stakeholder == 'entrepreneur' and user_lang != 'en-IN':
                                    st.info(f"📢 This view is generated in {lang_name} for better accessibility")
                                st.json(content)
                                
if __name__ == "__main__":
    main()

