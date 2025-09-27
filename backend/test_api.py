#!/usr/bin/env python3
"""
Quick API test script for The Unfair Advantage backend
"""

import requests
import json

BASE_URL = "http://localhost:5000"


def test_health_check():
    """Test the health check endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"Health Check: {response.status_code} - {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Health check failed: {e}")
        return False


def test_api_documentation():
    """Test the API documentation endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/api/docs")
        print(
            f"API Docs: {response.status_code} - Content length: {len(response.text)}"
        )
        return response.status_code == 200
    except Exception as e:
        print(f"API docs test failed: {e}")
        return False


def test_upload_endpoints():
    """Test upload endpoints (without actual files)"""
    endpoints = ["/api/upload/image", "/api/upload/document", "/api/upload/audio"]

    for endpoint in endpoints:
        try:
            # Test GET request (should return method not allowed)
            response = requests.get(f"{BASE_URL}{endpoint}")
            print(f"{endpoint}: {response.status_code} - {response.text[:100]}")
        except Exception as e:
            print(f"Upload endpoint test failed for {endpoint}: {e}")


def main():
    print("🧪 Testing The Unfair Advantage API")
    print("=" * 50)

    # Test basic endpoints
    if test_health_check():
        print("✅ Health check passed")
    else:
        print("❌ Health check failed")
        return

    if test_api_documentation():
        print("✅ API documentation accessible")
    else:
        print("❌ API documentation failed")

    print("\n📤 Testing upload endpoints...")
    test_upload_endpoints()

    print("\n✅ Basic API tests completed!")
    print(f"🌐 Server is running at: {BASE_URL}")
    print(f"📚 API Documentation: {BASE_URL}/api/docs")


if __name__ == "__main__":
    main()
