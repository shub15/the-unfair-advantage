"""
Development utilities for The Unfair Advantage project
"""

import requests
import json
from pathlib import Path


class APITester:
    """Simple API testing utility"""

    def __init__(self, base_url="http://localhost:5000"):
        self.base_url = base_url

    def test_health(self):
        """Test health endpoint"""
        response = requests.get(f"{self.base_url}/")
        print(f"Health Check: {response.status_code}")
        print(json.dumps(response.json(), indent=2))
        return response.status_code == 200

    def test_docs(self):
        """Test documentation endpoint"""
        response = requests.get(f"{self.base_url}/api/docs")
        print(f"API Docs: {response.status_code}")
        return response.status_code == 200

    def test_text_upload(self, idea_text="AI-powered delivery service for rural areas"):
        """Test text upload"""
        data = {"title": "Test Startup Idea", "content": idea_text, "language": "en"}

        response = requests.post(f"{self.base_url}/api/upload/text", json=data)
        print(f"Text Upload: {response.status_code}")
        if response.status_code == 200:
            print(json.dumps(response.json(), indent=2))
        return response.status_code == 200

    def test_voice_upload(self, audio_file_path):
        """Test voice upload"""
        if not Path(audio_file_path).exists():
            print(f"Audio file not found: {audio_file_path}")
            return False

        with open(audio_file_path, "rb") as f:
            files = {"audio": f}
            data = {"title": "Test Voice Idea", "language": "en-US"}

            response = requests.post(
                f"{self.base_url}/api/upload/voice", files=files, data=data
            )
            print(f"Voice Upload: {response.status_code}")
            if response.status_code == 200:
                print(json.dumps(response.json(), indent=2))

        return response.status_code == 200

    def test_image_upload(self, image_file_path):
        """Test image upload (existing endpoint)"""
        if not Path(image_file_path).exists():
            print(f"Image file not found: {image_file_path}")
            return False

        with open(image_file_path, "rb") as f:
            files = {"file": f}
            response = requests.post(f"{self.base_url}/api/upload/image", files=files)
            print(f"Image Upload: {response.status_code}")
            if response.status_code == 200:
                result = response.json()
                print(f"Extracted text length: {len(result.get('extracted_text', ''))}")
                print(f"Confidence: {result.get('confidence', 'N/A')}")

        return response.status_code == 200

    def test_pdf_upload(self, pdf_file_path):
        """Test PDF upload with Gemini OCR"""
        if not Path(pdf_file_path).exists():
            print(f"PDF file not found: {pdf_file_path}")
            return False

        with open(pdf_file_path, "rb") as f:
            files = {"file": f}
            response = requests.post(f"{self.base_url}/api/upload/pdf", files=files)
            print(f"PDF Upload: {response.status_code}")
            if response.status_code == 200:
                result = response.json()
                print(f"Pages processed: {result.get('pages_processed', 'N/A')}")
                print(f"Raw text length: {len(result.get('raw_text', ''))}")
                print(f"Structured data: {bool(result.get('structured_data'))}")
                if (
                    result.get("structured_data")
                    and "error" not in result["structured_data"]
                ):
                    print("✅ Structured extraction successful")
                else:
                    print("❌ Structured extraction failed")

        return response.status_code == 200

    def test_image_structured_upload(self, image_file_path, use_gemini=True):
        """Test structured image upload"""
        if not Path(image_file_path).exists():
            print(f"Image file not found: {image_file_path}")
            return False

        with open(image_file_path, "rb") as f:
            files = {"file": f}
            data = {"use_gemini": str(use_gemini).lower()}
            response = requests.post(
                f"{self.base_url}/api/upload/image/structured", files=files, data=data
            )
            print(
                f"Structured Image Upload (Gemini={use_gemini}): {response.status_code}"
            )
            if response.status_code == 200:
                result = response.json()
                print(f"OCR Method: {result.get('ocr_method', 'N/A')}")
                print(f"Raw text length: {len(result.get('raw_text', ''))}")
                print(f"Confidence: {result.get('confidence', 'N/A')}")
                if (
                    result.get("structured_data")
                    and "error" not in result["structured_data"]
                ):
                    print("✅ Structured extraction successful")
                else:
                    print("❌ Structured extraction failed")

        return response.status_code == 200

    def run_all_tests(self):
        """Run all available tests"""
        print("🧪 Running API Tests for The Unfair Advantage")
        print("=" * 50)

        tests = [
            ("Health Check", self.test_health),
            ("API Documentation", self.test_docs),
            ("Text Upload", self.test_text_upload),
        ]

        results = {}
        for test_name, test_func in tests:
            try:
                results[test_name] = test_func()
                print(f"✅ {test_name}: {'PASSED' if results[test_name] else 'FAILED'}")
            except Exception as e:
                results[test_name] = False
                print(f"❌ {test_name}: FAILED ({e})")
            print("-" * 50)

        # Summary
        passed = sum(results.values())
        total = len(results)
        print(f"\n📊 Test Summary: {passed}/{total} tests passed")

        return passed == total


def main():
    """Run API tests"""
    tester = APITester()
    tester.run_all_tests()


if __name__ == "__main__":
    main()
