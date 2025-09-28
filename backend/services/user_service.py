"""
User service for managing user authentication and data storage
Integrates Supabase authentication with local MongoDB storage
"""

import logging
import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database
from supabase import create_client, Client
from flask import current_app

from models.user import User, UserProfile, UserStatus, UserRole, ProcessedDocument


class UserService:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self._mongo_client: Optional[MongoClient] = None
        self._supabase_client: Optional[Client] = None
        self._db: Optional[Database] = None
        self._users_collection: Optional[Collection] = None

        # Initialize connections
        self._init_mongo_connection()
        self._init_supabase_connection()

    def _init_mongo_connection(self):
        """Initialize MongoDB connection"""
        try:
            mongodb_uri = current_app.config.get("MONGODB_URI")
            mongodb_database = current_app.config.get("MONGODB_DATABASE")

            if not mongodb_uri:
                self.logger.error("MONGODB_URI not configured")
                return

            self._mongo_client = MongoClient(mongodb_uri)
            self._db = self._mongo_client[mongodb_database]
            self._users_collection = self._db.users

            # Create indexes for better performance
            self._users_collection.create_index("supabase_user_id", unique=True)
            self._users_collection.create_index("profile.email")
            self._users_collection.create_index("created_at")
            self._users_collection.create_index("role")

            self.logger.info("MongoDB connection initialized successfully")

        except Exception as e:
            self.logger.error(f"Failed to initialize MongoDB connection: {str(e)}")

    def _init_supabase_connection(self):
        """Initialize Supabase connection"""
        try:
            supabase_url = current_app.config.get("SUPABASE_URL")
            supabase_service_key = current_app.config.get("SUPABASE_SERVICE_KEY")

            if not supabase_url or not supabase_service_key:
                self.logger.error("Supabase configuration missing (URL or SERVICE_KEY)")
                return

            self._supabase_client = create_client(supabase_url, supabase_service_key)
            self.logger.info("Supabase client initialized successfully")

        except Exception as e:
            self.logger.error(f"Failed to initialize Supabase client: {str(e)}")

    def verify_access_token(self, access_token: str) -> Optional[Dict[str, Any]]:
        """
        Verify Supabase access token and return user data
        """
        try:
            if not self._supabase_client:
                self.logger.error("Supabase client not initialized")
                return None

            # Get user from Supabase using access token
            response = self._supabase_client.auth.get_user(access_token)

            if response.user:
                return {
                    "supabase_user_id": response.user.id,
                    "email": response.user.email,
                    "full_name": response.user.user_metadata.get("full_name"),
                    "avatar_url": response.user.user_metadata.get("avatar_url"),
                    "phone": response.user.phone,
                    "email_verified": response.user.email_confirmed_at is not None,
                    "phone_verified": response.user.phone_confirmed_at is not None,
                    "created_at": response.user.created_at,
                    "last_sign_in": response.user.last_sign_in_at,
                    "metadata": response.user.user_metadata,
                }

        except Exception as e:
            self.logger.error(f"Failed to verify access token: {str(e)}")

        return None

    def get_or_create_user(self, supabase_user_data: Dict[str, Any]) -> Optional[User]:
        """
        Get existing user or create new user in MongoDB based on Supabase data
        """
        try:
            if self._users_collection is None:
                self.logger.error("MongoDB users collection not initialized")
                return None

            supabase_user_id = supabase_user_data.get("supabase_user_id")

            # Try to find existing user
            existing_user_doc = self._users_collection.find_one(
                {"supabase_user_id": supabase_user_id}
            )

            if existing_user_doc:
                # Update last activity and return existing user
                self._users_collection.update_one(
                    {"supabase_user_id": supabase_user_id},
                    {
                        "$set": {
                            "last_activity": datetime.now(),
                            "updated_at": datetime.now(),
                        }
                    },
                )
                return User.from_dict(existing_user_doc)

            # Create new user
            user_profile = UserProfile(
                supabase_user_id=supabase_user_id,
                email=supabase_user_data.get("email"),
                full_name=supabase_user_data.get("full_name"),
                avatar_url=supabase_user_data.get("avatar_url"),
                phone=supabase_user_data.get("phone"),
                created_at=supabase_user_data.get("created_at", datetime.now()),
                last_sign_in=supabase_user_data.get("last_sign_in"),
                email_verified=supabase_user_data.get("email_verified", False),
                phone_verified=supabase_user_data.get("phone_verified", False),
                metadata=supabase_user_data.get("metadata", {}),
            )

            new_user = User(
                _id=str(uuid.uuid4()),
                supabase_user_id=supabase_user_id,
                profile=user_profile,
                status=UserStatus.ACTIVE,
                last_activity=datetime.now(),
            )

            # Insert into MongoDB
            result = self._users_collection.insert_one(new_user.to_dict())

            if result.inserted_id:
                self.logger.info(f"Created new user: {supabase_user_id}")
                return new_user

        except Exception as e:
            self.logger.error(f"Failed to get or create user: {str(e)}")

        return None

    def get_user_by_supabase_id(self, supabase_user_id: str) -> Optional[User]:
        """Get user by Supabase user ID"""
        try:
            if self._users_collection is None:
                return None

            user_doc = self._users_collection.find_one(
                {"supabase_user_id": supabase_user_id}
            )

            if user_doc:
                return User.from_dict(user_doc)

        except Exception as e:
            self.logger.error(f"Failed to get user by Supabase ID: {str(e)}")

        return None

    def add_processed_document(self, user: User, document: ProcessedDocument) -> bool:
        """Add processed document to user's history"""
        try:
            if self._users_collection is None:
                return False

            # Add document to user object
            user.add_processed_document(document)

            # Update in MongoDB
            result = self._users_collection.update_one(
                {"supabase_user_id": user.supabase_user_id},
                {
                    "$push": {"processed_documents": document.__dict__},
                    "$set": {
                        "total_documents_processed": user.total_documents_processed,
                        "total_pages_processed": user.total_pages_processed,
                        "storage_used_bytes": user.storage_used_bytes,
                        "updated_at": user.updated_at,
                        "last_activity": user.last_activity,
                    },
                },
            )

            return result.modified_count > 0

        except Exception as e:
            self.logger.error(f"Failed to add processed document: {str(e)}")
            return False

    def get_user_documents(
        self, supabase_user_id: str, limit: int = 50
    ) -> List[ProcessedDocument]:
        """Get user's processed documents with pagination"""
        try:
            user = self.get_user_by_supabase_id(supabase_user_id)
            if user:
                # Return recent documents first
                return sorted(
                    user.processed_documents,
                    key=lambda x: x.upload_timestamp,
                    reverse=True,
                )[:limit]

        except Exception as e:
            self.logger.error(f"Failed to get user documents: {str(e)}")

        return []

    def get_user_stats(self, supabase_user_id: str) -> Dict[str, Any]:
        """Get user statistics"""
        try:
            user = self.get_user_by_supabase_id(supabase_user_id)
            if user:
                return {
                    "total_documents_processed": user.total_documents_processed,
                    "total_pages_processed": user.total_pages_processed,
                    "storage_used_mb": round(
                        user.storage_used_bytes / (1024 * 1024), 2
                    ),
                    "member_since": user.created_at,
                    "last_activity": user.last_activity,
                    "recent_documents": len(
                        [
                            doc
                            for doc in user.processed_documents
                            if (datetime.now() - doc.upload_timestamp).days <= 7
                        ]
                    ),
                }

        except Exception as e:
            self.logger.error(f"Failed to get user stats: {str(e)}")

        return {}

    def update_user_preferences(
        self, supabase_user_id: str, preferences: Dict[str, Any]
    ) -> bool:
        """Update user preferences"""
        try:
            if self._users_collection is None:
                return False

            result = self._users_collection.update_one(
                {"supabase_user_id": supabase_user_id},
                {
                    "$set": {
                        "preferences": preferences,
                        "updated_at": datetime.now(),
                    }
                },
            )

            return result.modified_count > 0

        except Exception as e:
            self.logger.error(f"Failed to update user preferences: {str(e)}")
            return False

    def update_user_role(self, supabase_user_id: str, role: UserRole) -> bool:
        """Update user role"""
        try:
            if self._users_collection is None:
                return False

            result = self._users_collection.update_one(
                {"supabase_user_id": supabase_user_id},
                {
                    "$set": {
                        "role": role.value,
                        "updated_at": datetime.now(),
                    }
                },
            )

            return result.modified_count > 0

        except Exception as e:
            self.logger.error(f"Failed to update user role: {str(e)}")
            return False

    def get_users_by_role(self, role: UserRole, limit: int = 100) -> List[User]:
        """Get users by role"""
        try:
            if self._users_collection is None:
                return []

            user_docs = self._users_collection.find({"role": role.value}).limit(limit)

            users = []
            for doc in user_docs:
                users.append(User.from_dict(doc))

            return users

        except Exception as e:
            self.logger.error(f"Failed to get users by role: {str(e)}")
            return []

    def is_admin(self, supabase_user_id: str) -> bool:
        """Check if user has admin role"""
        try:
            user = self.get_user_by_supabase_id(supabase_user_id)
            if user:
                return user.role in [UserRole.ADMIN, UserRole.MENTOR]
            return False

        except Exception as e:
            self.logger.error(f"Failed to check admin status: {str(e)}")
            return False

    def is_mentor(self, supabase_user_id: str) -> bool:
        """Check if user has mentor role"""
        try:
            user = self.get_user_by_supabase_id(supabase_user_id)
            if user:
                return user.role == UserRole.MENTOR
            return False

        except Exception as e:
            self.logger.error(f"Failed to check mentor status: {str(e)}")
            return False

    def is_super_admin(self, supabase_user_id: str) -> bool:
        """Check if user has super admin role"""
        try:
            user = self.get_user_by_supabase_id(supabase_user_id)
            if user:
                return user.role == UserRole.SUPER_ADMIN
            return False

        except Exception as e:
            self.logger.error(f"Failed to check super admin status: {str(e)}")
            return False
