# Supabase + MongoDB Integration Guide

## Overview

This integration allows your frontend to use Supabase authentication while storing user data and processed documents in a local MongoDB database. The system automatically syncs users between Supabase and MongoDB.

## Authentication Flow

### Frontend (React Native/Expo with Supabase)

```javascript
// 1. Sign up/Sign in with Supabase
import { supabase } from "./supabaseClient";

const signUp = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
};

const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

// 2. Get access token for backend API calls
const getAccessToken = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token;
};

// 3. Make authenticated API calls to your backend
const uploadPDF = async (file) => {
  const token = await getAccessToken();

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("http://localhost:5000/api/upload/pdf", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  return response.json();
};
```

## Backend API Endpoints

### User Authentication Endpoints

#### `POST /api/user/verify-token`

Verify if access token is valid and get user info.

**Headers:**

```
Authorization: Bearer <supabase_access_token>
```

**Response:**

```json
{
  "valid": true,
  "user": {
    "user_id": "mongodb_user_id",
    "supabase_user_id": "supabase_uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "status": "active"
  }
}
```

#### `GET /api/user/profile`

Get current user's profile information.

**Headers:**

```
Authorization: Bearer <supabase_access_token>
```

**Response:**

```json
{
  "user_id": "mongodb_user_id",
  "supabase_user_id": "supabase_uuid",
  "profile": {
    "email": "user@example.com",
    "full_name": "John Doe",
    "avatar_url": "https://...",
    "phone": "+1234567890",
    "email_verified": true,
    "phone_verified": false,
    "created_at": "2025-01-15T10:30:00Z",
    "last_sign_in": "2025-01-15T12:00:00Z"
  },
  "status": "active",
  "created_at": "2025-01-15T10:30:00Z",
  "last_activity": "2025-01-15T12:00:00Z"
}
```

#### `GET /api/user/stats`

Get user's usage statistics.

**Response:**

```json
{
  "total_documents_processed": 25,
  "total_pages_processed": 150,
  "storage_used_mb": 12.5,
  "member_since": "2025-01-15T10:30:00Z",
  "last_activity": "2025-01-15T12:00:00Z",
  "recent_documents": 5
}
```

#### `GET /api/user/documents`

Get user's processed documents history.

**Query Parameters:**

- `limit`: Number of documents to return (max 100, default 50)

**Response:**

```json
{
  "documents": [
    {
      "id": "doc_uuid",
      "original_filename": "business_plan.pdf",
      "file_type": "pdf",
      "upload_timestamp": "2025-01-15T12:00:00Z",
      "processing_method": "gemini_vision_ocr",
      "confidence": 0.95,
      "pages_processed": 5,
      "file_size": 1024000,
      "processing_time": 3.2,
      "structured_data": {
        "Business_Name": "Tech Startup",
        "Entrepreneur_Name": "John Doe"
        // ... other extracted fields
      }
    }
  ],
  "total_count": 25,
  "limit": 50
}
```

#### `GET /api/user/documents/<document_id>`

Get specific document details.

**Response:**

```json
{
  "id": "doc_uuid",
  "original_filename": "business_plan.pdf",
  "file_type": "pdf",
  "upload_timestamp": "2025-01-15T12:00:00Z",
  "processing_method": "gemini_vision_ocr",
  "raw_text": "Full extracted text...",
  "structured_data": {
    "Business_Name": "Tech Startup"
    // ... all extracted fields
  },
  "confidence": 0.95,
  "pages_processed": 5,
  "file_size": 1024000,
  "processing_time": 3.2
}
```

### Enhanced Upload Endpoints

#### `POST /api/upload/pdf`

Upload PDF with optional user authentication.

**Headers (Optional):**

```
Authorization: Bearer <supabase_access_token>
```

**Body:** Form data with `file` field

**Response (Authenticated):**

```json
{
  "submission_id": "submission_uuid",
  "raw_text": "Extracted text...",
  "structured_data": {
    "Business_Name": "Tech Startup"
    // ... extracted fields
  },
  "pages_processed": 5,
  "confidence": 0.95,
  "processing_time": "3.2s",
  "file_size": 1024000,
  "status": "ready_for_evaluation",
  "saved_to_history": true,
  "user_id": "mongodb_user_id"
}
```

**Response (Unauthenticated):**

```json
{
  "submission_id": "submission_uuid",
  "raw_text": "Extracted text...",
  "structured_data": {
    "Business_Name": "Tech Startup"
    // ... extracted fields
  },
  "pages_processed": 5,
  "confidence": 0.95,
  "processing_time": "3.2s",
  "file_size": 1024000,
  "status": "ready_for_evaluation"
}
```

#### `POST /api/upload/image/structured`

Upload image with optional user authentication (same pattern as PDF upload).

## Environment Configuration

Create `.env` file in your backend directory:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
SUPABASE_ANON_KEY=your-anon-public-key-here

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/
MONGODB_DATABASE=unfair_advantage

# Other existing configs...
GEMINI_API_KEY=your-gemini-api-key
```

## User Data Structure

### MongoDB User Document Structure

```javascript
{
  "_id": "mongodb_object_id",
  "supabase_user_id": "supabase_uuid",
  "profile": {
    "supabase_user_id": "supabase_uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "avatar_url": "https://...",
    "phone": "+1234567890",
    "created_at": "2025-01-15T10:30:00Z",
    "last_sign_in": "2025-01-15T12:00:00Z",
    "email_verified": true,
    "phone_verified": false,
    "metadata": {}
  },
  "status": "active",
  "processed_documents": [
    {
      "id": "doc_uuid",
      "original_filename": "business_plan.pdf",
      "file_type": "pdf",
      "upload_timestamp": "2025-01-15T12:00:00Z",
      "processing_method": "gemini_vision_ocr",
      "raw_text": "Full extracted text...",
      "structured_data": {
        "Business_Name": "Tech Startup",
        "Entrepreneur_Name": "John Doe",
        // ... other fields
      },
      "confidence": 0.95,
      "pages_processed": 5,
      "file_size": 1024000,
      "processing_time": 3.2,
      "ocr_metadata": {}
    }
  ],
  "total_documents_processed": 25,
  "total_pages_processed": 150,
  "storage_used_bytes": 13107200,
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T12:00:00Z",
  "last_activity": "2025-01-15T12:00:00Z",
  "preferences": {}
}
```

## Usage Examples

### Frontend Implementation Example

```javascript
// utils/api.js
const API_BASE_URL = "http://localhost:5000/api";

export class APIClient {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
  }

  async getAuthHeaders() {
    const {
      data: { session },
    } = await this.supabase.auth.getSession();
    return session?.access_token
      ? {
          Authorization: `Bearer ${session.access_token}`,
        }
      : {};
  }

  async uploadPDF(file) {
    const headers = await this.getAuthHeaders();
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/upload/pdf`, {
      method: "POST",
      headers,
      body: formData,
    });

    return response.json();
  }

  async getUserProfile() {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      headers,
    });
    return response.json();
  }

  async getUserDocuments(limit = 50) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(
      `${API_BASE_URL}/user/documents?limit=${limit}`,
      {
        headers,
      }
    );
    return response.json();
  }
}
```

## Benefits

1. **Seamless Authentication**: Frontend uses familiar Supabase auth flow
2. **Local Data Control**: All processed documents stored in your MongoDB
3. **User History**: Complete document processing history per user
4. **Flexible Access**: Endpoints work with or without authentication
5. **Usage Tracking**: Monitor user activity and storage usage
6. **Scalable**: MongoDB can handle large amounts of document data

## Testing

Use the existing test endpoints for development:

- `/api/upload/test/frontend` - Frontend testing with scenarios
- `/api/upload/test/frontend/info` - Documentation for test endpoints

These work without authentication for easy frontend development.
