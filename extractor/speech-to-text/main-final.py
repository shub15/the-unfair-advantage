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
    """Calculate business assessment score considering all available data"""
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
        "eligibility": eligibility
    }

def generate_comprehensive_business_case(business_data, assessment_score, ocr_data, transcript):
    """Generate comprehensive business case from all data sources"""
    if model is None:
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
        response = model.generate_content(
            prompt,
            generation_config=GenerationConfig(
                temperature=0.3,
                top_p=0.9,
                top_k=40
            )
        )
        return response.text
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
            
            if st.button("📋 Generate Mentor-Ready Business Case", type="secondary"):
                with st.spinner('Creating comprehensive business case...'):
                    business_case = generate_comprehensive_business_case(
                        st.session_state.business_data,
                        st.session_state.assessment_score,
                        st.session_state.ocr_data,
                        st.session_state.transcript
                    )
                    
                    st.subheader("📋 Comprehensive Business Case")
                    st.markdown(business_case)
                    
                    # Download options
                    col1, col2 = st.columns(2)
                    with col1:
                        st.download_button(
                            label="📄 Download Business Case (Markdown)",
                            data=business_case,
                            file_name="comprehensive_business_case.md",
                            mime="text/markdown"
                        )
                    
                    with col2:
                        st.download_button(
                            label="📊 Download Business Data (JSON)",
                            data=json.dumps(st.session_state.business_data, indent=2),
                            file_name="business_data.json",
                            mime="application/json"
                        )

if __name__ == "__main__":
    main()
