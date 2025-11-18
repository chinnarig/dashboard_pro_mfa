# Role Standardization Fix

## Issue
Backend Python enums for user roles didn't match the database schema values.

## Database Schema (Correct)
```sql
-- Users table role field accepts:
role VARCHAR(50) DEFAULT 'Read'

-- Valid values in database:
- 'Admin'  -- Full administrative access
- 'Read'   -- Read-only access
- 'Write'  -- Read and write access
```

## Backend Models (Before) ❌
```python
class UserRole(enum.Enum):
    """Enum for user roles"""
    ADMIN = "ADMIN"   # ❌ Wrong - should be "Admin"
    USER = "USER"     # ❌ Wrong - should be "Read" or "Write"
```

## Backend Models (After) ✅
```python
class UserRole(enum.Enum):
    """Enum for user roles"""
    ADMIN = "Admin"   # ✅ Matches database
    READ = "Read"     # ✅ Matches database
    WRITE = "Write"   # ✅ Matches database
```

## Files Updated

### 1. Backend Models ✅
**File:** `/backend/app/db/models.py`
```python
class UserRole(enum.Enum):
    """Enum for user roles"""
    ADMIN = "Admin"
    READ = "Read"
    WRITE = "Write"
```

### 2. Backend Schemas ✅
**File:** `/backend/app/schemas/models.py`
```python
class UserRoleEnum(str, Enum):
    """Enum for user roles"""
    ADMIN = "Admin"
    READ = "Read"
    WRITE = "Write"

class UserCreate(BaseModel):
    # ... other fields
    role: UserRoleEnum = UserRoleEnum.READ  # Default to Read access
```

## Role Definitions

| Role | Value | Backend Enum | Access Level |
|------|-------|--------------|--------------|
| **Admin** | `'Admin'` | `UserRole.ADMIN` | Full system access, can manage users, agents, settings |
| **Write** | `'Write'` | `UserRole.WRITE` | Can create and edit content, moderate access |
| **Read** | `'Read'` | `UserRole.READ` | Read-only access, cannot modify data |

## Frontend Compatibility

The frontend already handles both formats:
```typescript
// Frontend checks support both 'ADMIN' and 'Admin'
if (user.role !== 'ADMIN' && user.role !== 'Admin') {
    redirect('/');
}
```

## Test Users Roles

All test users now have standardized roles:

| Email | Role in DB | Backend Enum |
|-------|------------|--------------|
| admin@acme.com | `Admin` | `UserRole.ADMIN` |
| admin@techstart.io | `Admin` | `UserRole.ADMIN` |
| writer@acme.com | `Write` | `UserRole.WRITE` |
| reader@acme.com | `Read` | `UserRole.READ` |

## Benefits

✅ **Consistency** - Backend enums match database values exactly  
✅ **Type Safety** - Proper enum validation in Python code  
✅ **API Validation** - Pydantic schemas validate against correct role values  
✅ **Clear Intent** - Role names are self-documenting  

## Usage Examples

### Creating a User (Backend)
```python
from app.schemas.models import UserCreate, UserRoleEnum

new_user = UserCreate(
    name="John Doe",
    email="john@example.com",
    password="SecurePass123",
    confirm_password="SecurePass123",
    role=UserRoleEnum.WRITE  # or READ, ADMIN
)
```

### Checking Roles (Backend)
```python
from app.db.models import UserRole

if user.role == UserRole.ADMIN.value:
    # Admin-only operations
    pass
elif user.role == UserRole.WRITE.value:
    # Write operations
    pass
else:  # UserRole.READ.value
    # Read-only operations
    pass
```

## Verification

### Check Database Roles
```bash
PGPASSWORD='Admin@011235' psql -h 35.232.108.201 -U postgres -d livekit \
  -c "SELECT DISTINCT role FROM users ORDER BY role;"
```

**Expected Output:**
```
 role  
-------
 Admin
 Read
 Write
```

### Check Backend Enums (Python)
```python
from app.db.models import UserRole

# Print all role values
for role in UserRole:
    print(f"{role.name} = {role.value}")

# Output:
# ADMIN = Admin
# READ = Read
# WRITE = Write
```

## Status

✅ **Backend models updated**  
✅ **Backend schemas updated**  
✅ **Role values standardized**  
✅ **Database and backend now in sync**  

---

**Updated:** November 18, 2025  
**Status:** ✅ Role Standardization Complete
