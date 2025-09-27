"""
Test script for Gemini OCR integration
"""

import requests
import json
import os
import sys
from pathlib import Path

# Base URL for the API
BASE_URL = "http://localhost:5000"


def test_pdf_upload(pdf_file_path):
    """Test PDF upload and processing"""
    print(f"Testing PDF upload: {pdf_file_path}")

    if not os.path.exists(pdf_file_path):
        print(f"Error: File not found: {pdf_file_path}")
        return False

    url = f"{BASE_URL}/api/upload/pdf"

    try:
        with open(pdf_file_path, "rb") as file:
            files = {"file": file}
            response = requests.post(url, files=files)

        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print("✅ PDF processing successful!")
            print(f"Pages processed: {result.get('pages_processed', 'N/A')}")
            print(f"Confidence: {result.get('confidence', 'N/A')}")
            print(f"Raw text length: {len(result.get('raw_text', ''))}")

            # Display structured data
            structured_data = result.get("structured_data", {})
            if structured_data and "error" not in structured_data:
                print("\n📊 Structured Data:")
                for key, value in structured_data.items():
                    print(f"  {key}: {value}")
            else:
                print(
                    f"❌ Structured extraction failed: {structured_data.get('error', 'Unknown error')}"
                )

            return True
        else:
            print(f"❌ Error: {response.text}")
            return False

    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return False


def test_image_structured_upload(image_file_path, use_gemini=True):
    """Test structured image upload"""
    print(f"Testing structured image upload: {image_file_path}")

    if not os.path.exists(image_file_path):
        print(f"Error: File not found: {image_file_path}")
        return False

    url = f"{BASE_URL}/api/upload/image/structured"

    try:
        with open(image_file_path, "rb") as file:
            files = {"file": file}
            data = {"use_gemini": str(use_gemini).lower()}
            response = requests.post(url, files=files, data=data)

        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print("✅ Image processing successful!")
            print(f"OCR Method: {result.get('ocr_method', 'N/A')}")
            print(f"Confidence: {result.get('confidence', 'N/A')}")
            print(f"Raw text length: {len(result.get('raw_text', ''))}")

            # Display structured data
            structured_data = result.get("structured_data", {})
            if structured_data and "error" not in structured_data:
                print("\n📊 Structured Data:")
                for key, value in structured_data.items():
                    print(f"  {key}: {value}")
            else:
                print(
                    f"❌ Structured extraction failed: {structured_data.get('error', 'Unknown error')}"
                )

            return True
        else:
            print(f"❌ Error: {response.text}")
            return False

    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return False


def test_server_health():
    """Test if the server is running"""
    try:
        response = requests.get(f"{BASE_URL}/")
        return response.status_code in [200, 404]  # 404 is fine if no root route
    except:
        return False


def main():
    print("🧪 Gemini OCR Integration Test Suite")
    print("=" * 50)

    # Check if server is running
    if not test_server_health():
        print("❌ Server not running. Please start the backend server first:")
        print("   python start.py")
        sys.exit(1)

    print("✅ Server is running")
    print()

    # Test files (adjust paths as needed)
    test_files = {
        "pdf": "test_files/sample_business_plan.pdf",
        "image": "test_files/sample_handwritten.png",
    }

    # Look for test files in common locations
    possible_locations = ["test_files/", "static/uploads/", "../test_files/", "./"]

    found_files = {}

    for file_type, filename in test_files.items():
        for location in possible_locations:
            full_path = os.path.join(location, os.path.basename(filename))
            if os.path.exists(full_path):
                found_files[file_type] = full_path
                break

    # Run tests
    success_count = 0
    total_tests = 0

    if "pdf" in found_files:
        print(f"📄 Testing PDF Processing")
        print("-" * 30)
        if test_pdf_upload(found_files["pdf"]):
            success_count += 1
        total_tests += 1
        print()
    else:
        print("⚠️  No PDF test file found. Skipping PDF tests.")
        print("   Place a PDF file in test_files/ directory to test PDF processing.")
        print()

    if "image" in found_files:
        print(f"🖼️  Testing Structured Image Processing")
        print("-" * 30)
        if test_image_structured_upload(found_files["image"], use_gemini=True):
            success_count += 1
        total_tests += 1
        print()

        print(f"🖼️  Testing with Google Vision Fallback")
        print("-" * 30)
        if test_image_structured_upload(found_files["image"], use_gemini=False):
            success_count += 1
        total_tests += 1
        print()
    else:
        print("⚠️  No image test file found. Skipping image tests.")
        print(
            "   Place an image file in test_files/ directory to test image processing."
        )
        print()

    # Summary
    print("📊 Test Summary")
    print("=" * 20)
    print(f"Tests passed: {success_count}/{total_tests}")

    if success_count == total_tests and total_tests > 0:
        print("🎉 All tests passed!")
    elif total_tests == 0:
        print("⚠️  No tests could be run. Please add test files.")
    else:
        print("❌ Some tests failed. Check the logs above.")


if __name__ == "__main__":
    main()
