"""
Admin utilities for managing user roles
Run this script to promote users to admin or super admin roles
"""

import os
import sys
from datetime import datetime
from pymongo import MongoClient
from models.user import UserRole

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))


class AdminUtils:
    def __init__(self, mongodb_uri=None, mongodb_database=None):
        # Use environment variables or defaults
        self.mongodb_uri = mongodb_uri or os.getenv(
            "MONGODB_URI", "mongodb://localhost:27017"
        )
        self.mongodb_database = mongodb_database or os.getenv(
            "MONGODB_DATABASE", "unfair_advantage"
        )

        # Initialize MongoDB connection
        self.client = MongoClient(self.mongodb_uri)
        self.db = self.client[self.mongodb_database]
        self.users_collection = self.db.users

    def list_users(self):
        """List all users with their current roles"""
        users = self.users_collection.find(
            {},
            {
                "profile.email": 1,
                "profile.full_name": 1,
                "role": 1,
                "status": 1,
                "created_at": 1,
                "supabase_user_id": 1,
            },
        )

        print("\n=== All Users ===")
        print(f"{'Email':<30} {'Name':<25} {'Role':<15} {'Status':<10} {'Created':<20}")
        print("-" * 100)

        for user in users:
            email = user.get("profile", {}).get("email", "N/A")
            name = user.get("profile", {}).get("full_name", "N/A") or "N/A"
            role = user.get("role", "user")
            status = user.get("status", "active")
            created = user.get("created_at", datetime.now()).strftime("%Y-%m-%d %H:%M")

            print(f"{email:<30} {name:<25} {role:<15} {status:<10} {created:<20}")

        print()

    def promote_user_by_email(self, email: str, role: str):
        """Promote user to admin or super_admin role by email"""
        try:
            # Validate role
            if role not in ["admin", "super_admin"]:
                print(f"Error: Invalid role '{role}'. Must be 'admin' or 'super_admin'")
                return False

            # Find user by email
            user = self.users_collection.find_one({"profile.email": email})

            if not user:
                print(f"Error: User with email '{email}' not found")
                return False

            # Update user role
            result = self.users_collection.update_one(
                {"profile.email": email},
                {"$set": {"role": role, "updated_at": datetime.now()}},
            )

            if result.modified_count > 0:
                print(f"Success: User '{email}' promoted to {role}")
                return True
            else:
                print(f"Error: Failed to update user '{email}'")
                return False

        except Exception as e:
            print(f"Error promoting user: {str(e)}")
            return False

    def demote_user_by_email(self, email: str):
        """Demote user back to regular user role"""
        try:
            # Find user by email
            user = self.users_collection.find_one({"profile.email": email})

            if not user:
                print(f"Error: User with email '{email}' not found")
                return False

            # Update user role to regular user
            result = self.users_collection.update_one(
                {"profile.email": email},
                {"$set": {"role": "user", "updated_at": datetime.now()}},
            )

            if result.modified_count > 0:
                print(f"Success: User '{email}' demoted to regular user")
                return True
            else:
                print(f"Error: Failed to update user '{email}'")
                return False

        except Exception as e:
            print(f"Error demoting user: {str(e)}")
            return False

    def get_admin_stats(self):
        """Get statistics about admin users"""
        pipeline = [{"$group": {"_id": "$role", "count": {"$sum": 1}}}]

        role_counts = list(self.users_collection.aggregate(pipeline))

        print("\n=== User Role Statistics ===")
        total_users = 0
        for role_stat in role_counts:
            role = role_stat.get("_id", "unknown")
            count = role_stat.get("count", 0)
            total_users += count
            print(f"{role.capitalize()}: {count}")

        print(f"Total Users: {total_users}")
        print()


def main():
    """Main function for interactive admin management"""
    print("Admin User Management Utility")
    print("============================")

    # Initialize admin utils
    admin_utils = AdminUtils()

    while True:
        print("\nOptions:")
        print("1. List all users")
        print("2. Promote user to admin")
        print("3. Promote user to super admin")
        print("4. Demote user to regular user")
        print("5. Show role statistics")
        print("6. Exit")

        choice = input("\nEnter your choice (1-6): ").strip()

        if choice == "1":
            admin_utils.list_users()

        elif choice == "2":
            email = input("Enter user email to promote to admin: ").strip()
            if email:
                admin_utils.promote_user_by_email(email, "admin")

        elif choice == "3":
            email = input("Enter user email to promote to super admin: ").strip()
            if email:
                admin_utils.promote_user_by_email(email, "super_admin")

        elif choice == "4":
            email = input("Enter user email to demote to regular user: ").strip()
            if email:
                admin_utils.demote_user_by_email(email)

        elif choice == "5":
            admin_utils.get_admin_stats()

        elif choice == "6":
            print("Goodbye!")
            break

        else:
            print("Invalid choice. Please try again.")


if __name__ == "__main__":
    main()
