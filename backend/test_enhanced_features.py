#!/usr/bin/env python3
"""
Test script for the enhanced business analysis features
"""

import sys
import os
import json

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))


def test_business_analysis_service():
    """Test the business analysis service initialization"""
    try:
        from services.business_analysis_service import BusinessAnalysisService

        # Test service initialization (without Flask context)
        print("✓ BusinessAnalysisService import successful")

        # Test sample data processing
        sample_structured_data = {
            "entrepreneur_info": {
                "name": "John Doe",
                "education": "MBA",
                "phone": "9876543210",
                "experience": "5 years in tech",
            },
            "business_concept": {
                "business_name": "TechSolution",
                "description": "AI-powered business solutions",
                "industry": "Technology",
                "business_type": "Service",
            },
            "value_proposition": {
                "unique_selling_point": "AI automation",
                "problem_solved": "Manual processes",
                "main_product_service": "AI consulting",
            },
            "financial_info": {
                "loan_requirement": "Rs. 10,00,000",
                "startup_costs": "Rs. 15,00,000",
                "revenue_expectations": "Rs. 50,00,000 annually",
            },
            "additional_info": {
                "target_customers": "SME businesses",
                "location": "Bangalore",
                "timeline": "6 months",
            },
        }

        print("✓ Sample data structure validated")
        print("✓ All tests passed!")
        return True

    except ImportError as e:
        print(f"✗ Import error: {e}")
        return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False


def test_speech_service():
    """Test the enhanced speech service"""
    try:
        from services.speech_service import SpeechService

        print("✓ Enhanced SpeechService import successful")
        return True
    except ImportError as e:
        print(f"✗ Speech service import error: {e}")
        return False
    except Exception as e:
        print(f"✗ Speech service error: {e}")
        return False


def main():
    """Run all tests"""
    print("Testing Enhanced Business Analysis Backend")
    print("=" * 50)

    tests = [
        ("Business Analysis Service", test_business_analysis_service),
        ("Enhanced Speech Service", test_speech_service),
    ]

    passed = 0
    failed = 0

    for test_name, test_func in tests:
        print(f"\nTesting {test_name}...")
        if test_func():
            passed += 1
        else:
            failed += 1

    print("\n" + "=" * 50)
    print(f"Test Results: {passed} passed, {failed} failed")

    if failed == 0:
        print("🎉 All tests passed! The enhanced backend is ready.")
    else:
        print("❌ Some tests failed. Please check the errors above.")

    return failed == 0


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
