#!/usr/bin/env python3
"""
Startup script for The Unfair Advantage backend
Handles environment setup and service initialization
"""

import os
import sys
import subprocess
from pathlib import Path


def check_python_version():
    """Ensure Python 3.8+ is being used"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        sys.exit(1)
    print(f"✅ Python {sys.version.split()[0]} detected")


def check_environment():
    """Check if .env file exists and contains required variables"""
    env_file = Path(".env")
    env_template = Path(".env.template")

    if not env_file.exists():
        if env_template.exists():
            print(
                "📋 .env file not found. Please copy .env.template to .env and configure:"
            )
            print("   cp .env.template .env")
            print("   # Then edit .env with your actual values")
        else:
            print("⚠️  .env file not found. Some features may not work properly.")
        return False

    print("✅ .env file found")
    return True


def check_gcp_credentials():
    """Check if Google Cloud credentials are configured"""
    credentials_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")

    if not credentials_path:
        print("⚠️  GOOGLE_APPLICATION_CREDENTIALS not set")
        print("   GCP services (Speech-to-Text, Vision, Vertex AI) will not work")
        return False

    if not os.path.exists(credentials_path):
        print(f"❌ GCP credentials file not found: {credentials_path}")
        return False

    print("✅ GCP credentials configured")
    return True


def install_dependencies():
    """Install required dependencies"""
    print("📦 Installing dependencies...")
    try:
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "-r", "requirements.txt"],
            check=True,
            capture_output=True,
        )
        print("✅ Dependencies installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        sys.exit(1)


def create_directories():
    """Create necessary directories"""
    directories = [
        "static/uploads",
        "logs",
        "static/uploads/images",
        "static/uploads/audio",
        "static/uploads/documents",
    ]

    for directory in directories:
        os.makedirs(directory, exist_ok=True)

    print("✅ Required directories created")


def start_server():
    """Start the Flask development server"""
    print("\n🚀 Starting The Unfair Advantage API server...")
    print("   Access the API at: http://localhost:5000")
    print("   API Documentation: http://localhost:5000/api/docs")
    print("   Health Check: http://localhost:5000/")
    print("\n   Press Ctrl+C to stop the server\n")

    try:
        from app import create_app

        app = create_app()
        app.run(debug=True, host="0.0.0.0", port=5000)
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        sys.exit(1)


def main():
    """Main startup sequence"""
    print("🎯 The Unfair Advantage - Backend Startup")
    print("=" * 50)

    # Pre-flight checks
    check_python_version()
    env_configured = check_environment()
    gcp_configured = check_gcp_credentials()

    # Setup
    install_dependencies()
    create_directories()

    # Warnings
    if not env_configured:
        print("\n⚠️  WARNING: Environment not fully configured")

    if not gcp_configured:
        print("⚠️  WARNING: GCP services will use mock responses")

    print("\n" + "=" * 50)

    # Start server
    start_server()


if __name__ == "__main__":
    main()
