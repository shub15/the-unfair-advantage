# User Role System Implementation

This implementation adds a role-based authorization system to the MongoDB users collection for admin logins.

## Features Added

### 1. User Roles

- **USER**: Default role for regular users
- **ADMIN**: Can access admin endpoints and view user data
- **SUPER_ADMIN**: Can manage user roles and has full administrative access

### 2. Database Changes

- Added `role` field to the User model with default value "user"
- Added MongoDB index on the `role` field for better query performance
- Updated `to_dict()` and `from_dict()` methods to handle the role field

### 3. API Endpoints

#### Updated User Endpoints

- `GET /user/profile` - Now includes user role in response
- `POST /user/verify-token` - Now includes user role in response

#### New Admin Endpoints

- `GET /admin/users` - List all users (admin only)
  - Query parameters: `limit` (max 100), `role` (filter by role)
- `PUT /admin/users/<supabase_user_id>/role` - Update user role (super admin only)
- `GET /admin/stats` - Get user statistics by role (admin only)

### 4. Authorization Middleware

- `@require_admin` - Decorator requiring admin or super admin role
- `@require_super_admin` - Decorator requiring super admin role only

### 5. User Service Methods

- `update_user_role(supabase_user_id, role)` - Update user role
- `get_users_by_role(role, limit)` - Get users by role
- `is_admin(supabase_user_id)` - Check if user has admin privileges
- `is_super_admin(supabase_user_id)` - Check if user has super admin privileges

### 6. Admin Management Utility

- `admin_utils.py` - Interactive script for managing user roles
  - List all users with roles
  - Promote users to admin/super admin
  - Demote users to regular user
  - View role statistics

## Usage

### Using the Admin Utility

```bash
cd backend
python admin_utils.py
```

### API Examples

#### Get User Profile (includes role)

```bash
curl -H "Authorization: Bearer <token>" \
     http://localhost:5000/user/profile
```

#### List All Users (Admin only)

```bash
curl -H "Authorization: Bearer <admin-token>" \
     http://localhost:5000/admin/users?limit=50&role=admin
```

#### Update User Role (Super Admin only)

```bash
curl -X PUT \
     -H "Authorization: Bearer <super-admin-token>" \
     -H "Content-Type: application/json" \
     -d '{"role": "admin"}' \
     http://localhost:5000/admin/users/<supabase-user-id>/role
```

## Environment Setup

Make sure your `.env` file includes:

```
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=unfair_advantage
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
```

## Default Behavior

- New users are automatically assigned the "user" role
- Existing users without a role field will be treated as regular users
- Admin promotion must be done manually using the admin utility or API

## Security Notes

- Super admin role is required to change user roles
- Admin role is required to view user lists and statistics
- All admin operations are logged for audit purposes
- Role validation is performed on every admin endpoint access
