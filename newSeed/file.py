# import streamlit as st
# import os
# import io
# import tempfile
# from pdf2image import convert_from_path
# # Google Cloud Vision is removed and replaced by Gemini Vision
# from PIL import Image
# from google import genai as gemini_sdk
# from google.genai import types
# import json # To parse Gemini's JSON response

# # --- STREAMLIT UI: PAGE CONFIGURATION (MUST BE FIRST) ---
# st.set_page_config(page_title="Handwritten PDF Extractor", layout="centered")

# # --- ENVIRONMENT & AUTHENTICATION ---
# vision_client = None # Not used anymore
# gemini_client = None 

# # --- POPPLER CONFIGURATION (CRUCIAL FOR PDF2IMAGE) ---
# # NOTE: Poppler MUST be installed locally to run pdf2image.
# # !!! Corrected path based on user's system setup in previous steps !!!
# POPPLER_PATH = r"C:\Program Files\poppler-25.07.0\Library\bin" 

# # --- API INITIALIZATION ---
# # Gemini API Key provided by user
# GEMINI_API_KEY = "3f378575e7a3f7c09ea48953684e2d15715fe95d"

# try:
#     # 1. Gemini Client Initialization (Used for both Vision OCR and Structuring)
#     os.environ['GEMINI_API_KEY'] = GEMINI_API_KEY
#     # Client is initialized using the imported SDK
#     gemini_client = gemini_sdk.Client(api_key=GEMINI_API_KEY) 
#     st.sidebar.success("Gemini Client (OCR & Extraction) Loaded.")
    
# except Exception as e:
#     st.error(f"FATAL ERROR: A required client could not be initialized. Check imports.")
#     st.exception(e)
#     gemini_client = None


# def gemini_vision_ocr(image):
#     """Uses Gemini 2.5 Flash's multimodal capabilities to perform OCR on the image."""
    
#     if gemini_client is None:
#         return "OCR Failed: Gemini client not initialized."

#     # Convert PIL Image object to bytes
#     img_byte_arr = io.BytesIO()
#     image = image.convert('RGB')
#     image.save(img_byte_arr, format='PNG')
    
#     # Prepare content for Gemini (Image + Prompt)
#     vision_prompt = "Perform accurate OCR on the entire image, including all handwritten and printed text. Return only the raw text."
    
#     contents = [
#         vision_prompt,
#         types.Part.from_bytes(data=img_byte_arr.getvalue(), mime_type='image/png')
#     ]

#     try:
#         # Using gemini-2.5-flash for multimodal analysis (Vision/OCR)
#         response = gemini_client.models.generate_content(
#             model='gemini-2.5-flash',
#             contents=contents
#         )
#         return response.text
#     except Exception as e:
#         print(f"Gemini Vision API Error: {e}")
#         return "OCR Failed: Gemini Vision API Communication Error."


# def gemini_structured_extraction(raw_text):
#     """Uses Gemini API to extract structured data from raw OCR text based on a sample template."""
#     if gemini_client is None:
#         return {"error": "Gemini Client not initialized."}

#     # Define the structure based on the sample PDF (Participant Profile and Product/Service)
#     extraction_schema = types.Schema(
#         type=types.Type.OBJECT,
#         properties={
#             "Entrepreneur_Name": types.Schema(type=types.Type.STRING, description="Extracted Name of the entrepreneur."),
#             "Education_Status": types.Schema(type=types.Type.STRING, description="Extracted educational qualification."),
#             "Phone_Number": types.Schema(type=types.Type.STRING, description="Extracted phone number."),
#             "Business_Name": types.Schema(type=types.Type.STRING, description="Name of the business, e.g., Dartwala Express."),
#             "Main_Product_Service": types.Schema(type=types.Type.STRING, description="Description of the main product or service provided."),
#             "Key_USP": types.Schema(type=types.Type.STRING, description="The unique selling proposition or idea that is better than others."),
#             "Loan_Requirement_First_Month_INR": types.Schema(type=types.Type.INTEGER, description="The loan requirement for the business setup phase (First Month) in INR.")
#         },
#         required=["Entrepreneur_Name", "Business_Name", "Main_Product_Service", "Loan_Requirement_First_Month_INR"]
#     )
    
#     system_prompt = (
#         "You are an expert financial analyst focused on business plan review. Your task is to extract "
#         "key, structured data points from the provided raw OCR text which was taken from a handwritten "
#         "entrepreneurship development program document. Only return the requested JSON object. "
#         "If a field cannot be found, set its value to 'N/A' (except required fields)."
#     )

#     prompt = (
#         f"Extract the following structured data from the provided raw OCR text:\n\n"
#         f"--- RAW OCR TEXT ---\n{raw_text}\n--- END OF RAW OCR TEXT ---"
#     )

#     try:
#         response = gemini_client.models.generate_content(
#             model='gemini-2.5-flash',
#             contents=prompt,
#             config=types.GenerateContentConfig(
#                 system_instruction=system_prompt,
#                 response_mime_type="application/json",
#                 response_schema=extraction_schema
#             )
#         )
#         # The response text will be a valid JSON string
#         return response.text
#     except Exception as e:
#         return {"error": f"Gemini API call failed: {e}"}


# def process_uploaded_pdf(uploaded_file):
#     """Saves the uploaded PDF temporarily, processes it page-by-page, extracts text, and structures it."""
    
#     # 1. Save uploaded file temporarily to disk (pdf2image needs a file path)
#     with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
#         tmp_file.write(uploaded_file.read())
#         temp_pdf_path = tmp_file.name

#     raw_text_combined = ""
#     structured_json = {}
    
#     try:
#         # Check Poppler path validity (Crucial for PDF conversion)
#         if not os.path.isdir(POPPLER_PATH) or not os.path.exists(os.path.join(POPPLER_PATH, 'pdftoppm.exe')):
#              st.error(f"FATAL ERROR: Poppler 'bin' directory not found or incomplete at: {POPPLER_PATH}")
#              st.warning("Please correct the 'POPPLER_PATH' in the code and restart the app.")
#              return "Poppler Configuration Error.", None

#         st.info("Step 1/3: Converting PDF pages to images...")
#         pages = convert_from_path(temp_pdf_path, poppler_path=POPPLER_PATH)
#         st.success(f"PDF converted! Found {len(pages)} pages.")

#         # 2. Extract RAW text using Gemini Vision OCR
#         full_text_parts = []
#         for i, page in enumerate(pages):
#             st.text(f"Step 2/3: Running high-accuracy OCR on Page {i + 1} using Gemini Vision...")
#             page_text = gemini_vision_ocr(page)
#             full_text_parts.append(page_text)
#             st.progress((i + 1) / len(pages))
        
#         raw_text_combined = "\n\n[PAGE BREAK]\n\n".join(full_text_parts)
#         st.success("OCR Complete. Proceeding to Data Structuring.")

#         # 3. Structure the data using Gemini
#         st.info("Step 3/3: Structuring raw text into JSON using Gemini...")
        
#         # Ensure the response is parsable JSON before displaying
#         json_output_str = gemini_structured_extraction(raw_text_combined)
        
#         try:
#             structured_json = json.loads(json_output_str)
#         except json.JSONDecodeError:
#             st.error("Gemini returned non-JSON/malformed response.")
#             structured_json = {"error": "Gemini Output Error", "raw_response": json_output_str}


#     except Exception as e:
#         st.error("Processing Failed.")
#         st.exception(e)
#         raw_text_combined = "Processing Error."

#     finally:
#         os.unlink(temp_pdf_path) # Clean up
    
#     return raw_text_combined, structured_json


# # --- STREAMLIT UI: APP LAYOUT ---

# st.title("🧠 Structured Data Extractor from Handwritten PDF")
# st.markdown("Upload your handwritten business plan PDF. We use **Gemini Vision** for text and **Gemini Flash** for structured extraction.")

# st.sidebar.title("Configuration Status")

# uploaded_file = st.file_uploader(
#     "Upload Handwritten PDF", 
#     type=['pdf'], 
#     help="Select the PDF file containing handwritten or mixed-language text."
# )

# if uploaded_file is not None:
    
#     if st.button("Start Structured Analysis", type="primary"):
        
#         if gemini_client is None:
#             st.error("Cannot start analysis because the Gemini client failed to initialize. Please check console errors.")
#         else:
#             with st.spinner("Processing PDF, running OCR, and structuring data with Gemini..."):
#                 raw_text_output, structured_output = process_uploaded_pdf(uploaded_file)

#             if raw_text_output != "Poppler Configuration Error." and not isinstance(structured_output, dict) and not isinstance(structured_output, str):
#                 st.success("✅ Analysis Complete!")
                
#                 # Display Structured JSON
#                 st.subheader("1. Extracted Structured Data (JSON)")
#                 st.json(structured_output)

#                 # Download Button for JSON
#                 st.download_button(
#                     label="Download Structured JSON",
#                     data=json.dumps(structured_output, indent=2),
#                     file_name="extracted_data.json",
#                     mime="application/json"
#                 )
                
#                 # Display Raw Text
#                 st.subheader("2. Raw Text Transcript (OCR Output)")
#                 st.code(raw_text_output, language='text')

#             elif raw_text_output == "Poppler Configuration Error.":
#                 pass # Error message already shown in the function
#             else:
#                  # Handles both processing errors and malformed Gemini output
#                  st.error("An API or processing error occurred. Please check the console for detailed error messages.")
#                  if "raw_response" in structured_output:
#                     st.text("Raw Gemini Response (for Debugging):")
#                     st.code(structured_output.get("raw_response"), language="text")


# st.sidebar.markdown(
#     """
#     ---
#     ### How to Run Locally:
#     1.  **Libraries:** `pip install streamlit pdf2image Pillow google-genai`
#     2.  **Poppler:** Install Poppler binaries and **update the `POPPLER_PATH` in the code.**
#     3.  **Run:** `streamlit run ocr_app.py`
#     """
# )
import streamlit as st
import os
import io
import tempfile
from pdf2image import convert_from_path
# Google Cloud Vision is removed and replaced by Gemini Vision
from PIL import Image
from google import genai as gemini_sdk
from google.genai import types
import json # To parse Gemini's JSON response

# --- STREAMLIT UI: PAGE CONFIGURATION (MUST BE FIRST) ---
st.set_page_config(page_title="Handwritten PDF Extractor", layout="centered")

# --- ENVIRONMENT & AUTHENTICATION ---
vision_client = None # Not used anymore
gemini_client = None 

# --- POPPLER CONFIGURATION (CRUCIAL FOR PDF2IMAGE) ---
# NOTE: Poppler MUST be installed locally to run pdf2image.
# !!! FINAL CORRECTED PATH based on user's successful extraction directory !!!
POPPLER_PATH = r"C:\Program Files\poppler-25.07.0\Library\bin"

# --- API INITIALIZATION ---
# --- API INITIALIZATION ---
# Get API key from Streamlit secrets (secure method)
try:
    # Attempt to read from st.secrets
    GEMINI_API_KEY = st.secrets["GEMINI_API_KEY"]
except KeyError:
    # Fallback/error message if the secret isn't configured
    GEMINI_API_KEY = None
    st.sidebar.error("GEMINI_API_KEY not found in Streamlit secrets.")


try:
    # 1. Gemini Client Initialization (Used for both Vision OCR and Structuring)
    if GEMINI_API_KEY:
        os.environ['GEMINI_API_KEY'] = GEMINI_API_KEY
        # Client is initialized using the imported SDK
        gemini_client = gemini_sdk.Client(api_key=GEMINI_API_KEY) 
        st.sidebar.success("Gemini Client (OCR & Extraction) Loaded.")
    else:
        # Prevent client initialization if key is missing
        gemini_client = None
        st.sidebar.error("Gemini Client initialization skipped due to missing API Key.")
        
except Exception as e:
    st.error(f"FATAL ERROR: A required client could not be initialized. Check imports.")
    st.exception(e)
    gemini_client = None


def gemini_vision_ocr(image):
    """Uses Gemini 2.5 Flash's multimodal capabilities to perform OCR on the image."""
    
    if gemini_client is None:
        return "OCR Failed: Gemini client not initialized."

    # Convert PIL Image object to bytes
    img_byte_arr = io.BytesIO()
    image = image.convert('RGB')
    image.save(img_byte_arr, format='PNG')
    
    # Prepare content for Gemini (Image + Prompt)
    vision_prompt = "Perform accurate OCR on the entire image, including all handwritten and printed text. Return only the raw text."
    
    contents = [
        vision_prompt,
        types.Part.from_bytes(data=img_byte_arr.getvalue(), mime_type='image/png')
    ]

    try:
        # Using gemini-2.5-flash for multimodal analysis (Vision/OCR)
        response = gemini_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=contents
        )
        return response.text
    except Exception as e:
        print(f"Gemini Vision API Error: {e}")
        return "OCR Failed: Gemini Vision API Communication Error."


def gemini_structured_extraction(raw_text):
    """Uses Gemini API to extract structured data from raw OCR text based on a sample template."""
    if gemini_client is None:
        # If client is not initialized, return error as a JSON string
        return json.dumps({"error": "Gemini Client not initialized."}, indent=2)

    # Define the structure based on the sample PDF (Participant Profile and Product/Service)
    extraction_schema = types.Schema(
        type=types.Type.OBJECT,
        properties={
            "Entrepreneur_Name": types.Schema(type=types.Type.STRING, description="Extracted Name of the entrepreneur."),
            "Education_Status": types.Schema(type=types.Type.STRING, description="Extracted educational qualification."),
            "Phone_Number": types.Schema(type=types.Type.STRING, description="Extracted phone number."),
            "Business_Name": types.Schema(type=types.Type.STRING, description="Name of the business, e.g., Dartwala Express."),
            "Main_Product_Service": types.Schema(type=types.Type.STRING, description="Description of the main product or service provided."),
            "Key_USP": types.Schema(type=types.Type.STRING, description="The unique selling proposition or idea that is better than others."),
            "Loan_Requirement_First_Month_INR": types.Schema(type=types.Type.INTEGER, description="The loan requirement for the business setup phase (First Month) in INR.")
        },
        required=["Entrepreneur_Name", "Business_Name", "Main_Product_Service", "Loan_Requirement_First_Month_INR"]
    )
    
    system_prompt = (
        "You are an expert financial analyst focused on business plan review. Your task is to extract "
        "key, structured data points from the provided raw OCR text which was taken from a handwritten "
        "entrepreneurship development program document. Only return the requested JSON object. "
        "If a field cannot be found, set its value to 'N/A' (except required fields)."
    )

    prompt = (
        f"Extract the following structured data from the provided raw OCR text:\n\n"
        f"--- RAW OCR TEXT ---\n{raw_text}\n--- END OF RAW OCR TEXT ---"
    )

    try:
        response = gemini_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                response_mime_type="application/json",
                response_schema=extraction_schema
            )
        )
        # The response text will be a valid JSON string
        return response.text
    except Exception as e:
        # If API call fails, return error as a JSON string
        return json.dumps({"error": f"Gemini API call failed: {e}"}, indent=2)


def process_uploaded_pdf(uploaded_file):
    """Saves the uploaded PDF temporarily, processes it page-by-page, extracts text, and structures it."""
    
    # 1. Save uploaded file temporarily to disk (pdf2image needs a file path)
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
        tmp_file.write(uploaded_file.read())
        temp_pdf_path = tmp_file.name

    raw_text_combined = ""
    structured_json = {}
    
    try:
        # Check Poppler path validity (Crucial for PDF conversion)
        if not os.path.isdir(POPPLER_PATH) or not os.path.exists(os.path.join(POPPLER_PATH, 'pdftoppm.exe')):
             st.error(f"FATAL ERROR: Poppler 'bin' directory not found or incomplete at: {POPPLER_PATH}")
             st.warning("Please correct the 'POPPLER_PATH' in the code and restart the app.")
             return "Poppler Configuration Error.", None

        st.info("Step 1/3: Converting PDF pages to images...")
        pages = convert_from_path(temp_pdf_path, poppler_path=POPPLER_PATH)
        st.success(f"PDF converted! Found {len(pages)} pages.")

        # 2. Extract RAW text using Gemini Vision OCR
        full_text_parts = []
        for i, page in enumerate(pages):
            st.text(f"Step 2/3: Running high-accuracy OCR on Page {i + 1} using Gemini Vision...")
            page_text = gemini_vision_ocr(page)
            full_text_parts.append(page_text)
            st.progress((i + 1) / len(pages))
        
        raw_text_combined = "\n\n[PAGE BREAK]\n\n".join(full_text_parts)
        st.success("OCR Complete. Proceeding to Data Structuring.")

        # 3. Structure the data using Gemini
        st.info("Step 3/3: Structuring raw text into JSON using Gemini...")
        
        # Now, json_output_str is GUARANTEED to be a string (either valid JSON or an error JSON string)
        json_output_str = gemini_structured_extraction(raw_text_combined)
        
        try:
            # Safely load the JSON string into a Python dict
            structured_json = json.loads(json_output_str)
        except json.JSONDecodeError:
            st.error("Gemini returned non-JSON/malformed response.")
            # If the response is malformed, we create a structured error dict
            structured_json = {"error": "Gemini Output Error", "raw_response": json_output_str}


    except Exception as e:
        st.error("Processing Failed.")
        st.exception(e)
        raw_text_combined = "Processing Error."

    finally:
        os.unlink(temp_pdf_path) # Clean up
    
    return raw_text_combined, structured_json


# --- STREAMLIT UI: APP LAYOUT ---

st.title("🧠 Structured Data Extractor from Handwritten PDF")
st.markdown("Upload your handwritten business plan PDF. We use **Gemini Vision** for text and **Gemini Flash** for structured extraction.")

st.sidebar.title("Configuration Status")

uploaded_file = st.file_uploader(
    "Upload Handwritten PDF", 
    type=['pdf'], 
    help="Select the PDF file containing handwritten or mixed-language text."
)

if uploaded_file is not None:
    
    if st.button("Start Structured Analysis", type="primary"):
        
        if gemini_client is None:
            st.error("Cannot start analysis because the Gemini client failed to initialize. Please check console errors.")
        else:
            with st.spinner("Processing PDF, running OCR, and structuring data with Gemini..."):
                raw_text_output, structured_output = process_uploaded_pdf(uploaded_file)

            if raw_text_output != "Poppler Configuration Error." and not isinstance(structured_output, str):
                st.success("✅ Analysis Complete!")
                
                # Display Structured JSON
                st.subheader("1. Extracted Structured Data (JSON)")
                st.json(structured_output)

                # Download Button for JSON
                st.download_button(
                    label="Download Structured JSON",
                    data=json.dumps(structured_output, indent=2),
                    file_name="extracted_data.json",
                    mime="application/json"
                )
                
                # Display Raw Text
                st.subheader("2. Raw Text Transcript (OCR Output)")
                st.code(raw_text_output, language='text')

            elif raw_text_output == "Poppler Configuration Error.":
                pass # Error message already shown in the function
            else:
                 # Handles both processing errors and malformed Gemini output
                 st.error("An API or processing error occurred. Please check the console for detailed error messages.")
                 if "raw_response" in structured_output:
                    st.text("Raw Gemini Response (for Debugging):")
                    st.code(structured_output.get("raw_response"), language="text")


st.sidebar.markdown(
    """
    ---
    ### How to Run Locally:
    1.  **Libraries:** `pip install streamlit pdf2image Pillow google-genai`
    2.  **Poppler:** Install Poppler binaries and **update the `POPPLER_PATH` in the code.**
    3.  **Run:** `streamlit run ocr_app.py`
    """
)
