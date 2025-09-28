#!/usr/bin/env python3
"""
Simple server test to verify the backend integration
"""

import os
import sys
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))


def test_imports():
    """Test all imports"""
    print("🧪 Testing imports...")

    try:
        from app import create_app

        print("✅ Flask app import successful")

        from services.ocr_service import OCRService

        print("✅ OCR service import successful")

        from utils.pdf_processor import PDFProcessor

        print("✅ PDF processor import successful")

        return True

    except Exception as e:
        print(f"❌ Import failed: {str(e)}")
        return False


def test_app_creation():
    """Test Flask app creation"""
    print("\n🏗️  Testing app creation...")

    try:
        from app import create_app

        app = create_app()
        print("✅ Flask app created successfully")
        return app

    except Exception as e:
        print(f"❌ App creation failed: {str(e)}")
        return None


def test_gemini_integration():
    """Test Gemini integration"""
    print("\n🤖 Testing Gemini integration...")

    try:
        # Set a dummy API key for testing
        os.environ["GEMINI_API_KEY"] = "test-key"

        # This will test the import and initialization logic
        from services.ocr_service import OCRService

        # Create app context for testing
        from app import create_app

        app = create_app()

        with app.app_context():
            ocr_service = OCRService()
            print(
                "✅ OCR service created (Gemini client may not be initialized without valid API key)"
            )

        return True

    except Exception as e:
        print(f"❌ Gemini integration test failed: {str(e)}")
        return False


def main():
    """Run all tests"""
    print("🎯 Backend Integration Test Suite")
    print("=" * 50)

    # Test imports
    if not test_imports():
        print("\n❌ Import tests failed. Cannot proceed.")
        sys.exit(1)

    # Test app creation
    app = test_app_creation()
    if not app:
        print("\n❌ App creation failed. Cannot proceed.")
        sys.exit(1)

    # Test Gemini integration
    if not test_gemini_integration():
        print("\n⚠️  Gemini integration tests failed (this is expected without API key)")

    print("\n" + "=" * 50)
    print("🎉 Basic integration tests completed!")
    print("\n📋 Next steps:")
    print("1. Set up your .env file with GEMINI_API_KEY")
    print("2. Install Poppler for PDF processing (optional)")
    print("3. Start the server with: python simple_server.py")

    return True


if __name__ == "__main__":
    main()
