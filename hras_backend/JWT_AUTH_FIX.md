# JWT Authentication Fix - CustomUser Integration

## ✅ Issue Resolved

**Problem:** JWT token endpoint returning 400 errors after switching to CustomUser model.

**Root Cause:** 
- UserSerializer referenced old User model fields (username, specialty, age, availability)
- CustomUser uses email-based authentication instead of username
- Missing custom authentication backend

## 🔧 Files Updated

### 1. accounts/auth_backends.py (Created)
```python
class ApprovedUserBackend(ModelBackend):
    """
    Custom authentication backend that checks:
    - Valid email and password
    - is_active = True
    - is_approved = True
    """
```

**Security:** Prevents login for unapproved users even with valid credentials.

### 2. core/serializers.py (Updated)
```python
class UserSerializer(serializers.ModelSerializer):
    # Updated fields to match CustomUser model
    fields = ['id', 'email', 'password', 'first_name', 'last_name', 
              'role', 'is_approved', 'is_active', 'hospital', 
              'hospital_name', 'date_joined']
```

**Changes:**
- Removed: username, specialty, age, availability
- Added: email, role, is_approved, is_active, hospital_name, date_joined
- Password hashing in create/update methods

### 3. core/serializers.py - CustomTokenObtainPairSerializer
**Already existed** and checks:
- is_approved flag
- is_active flag
- Returns user info with role and hospital

## 🔐 Authentication Flow

### 1. Login Request
```bash
POST /api/token/
{
  "email": "user@hospital.com",
  "password": "password123"
}
```

### 2. Backend Checks (ApprovedUserBackend)
1. ✅ Email exists
2. ✅ Password correct
3. ✅ is_active = True
4. ✅ is_approved = True

### 3. Success Response
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "email": "user@hospital.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "doctor",
    "hospital": {
      "id": 1,
      "name": "General Hospital"
    }
  }
}
```

### 4. Error Responses

**Unapproved User:**
```json
{
  "detail": "Account is not approved or inactive."
}
```

**Invalid Credentials:**
```json
{
  "detail": "No active account found with the given credentials"
}
```

## 🧪 Testing

### 1. Test Unapproved User Login
```bash
# Register new user
curl -X POST http://localhost:8000/api/accounts/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@hospital.com",
    "password": "TestPass123",
    "password_confirm": "TestPass123",
    "first_name": "Test",
    "last_name": "User",
    "role": "nurse"
  }'

# Try to login (should fail)
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@hospital.com",
    "password": "TestPass123"
  }'
# Expected: "Account is not approved or inactive."
```

### 2. Approve User in Admin
1. Go to http://localhost:8000/admin/
2. Navigate to Users
3. Find test@hospital.com
4. Check "Is active" and "Is approved"
5. Save

### 3. Test Approved User Login
```bash
# Try to login again (should succeed)
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@hospital.com",
    "password": "TestPass123"
  }'
# Expected: JWT tokens + user info
```

## 📋 Settings Configuration

```python
# settings.py

AUTH_USER_MODEL = 'accounts.CustomUser'

AUTHENTICATION_BACKENDS = [
    'accounts.auth_backends.ApprovedUserBackend',  # Custom backend
    'django.contrib.auth.backends.ModelBackend',   # Fallback
]
```

## ✅ Verification Checklist

- [x] CustomUser model created
- [x] ApprovedUserBackend created
- [x] UserSerializer updated for CustomUser fields
- [x] CustomTokenObtainPairSerializer checks approval
- [x] Settings configured with AUTH_USER_MODEL
- [x] Settings configured with AUTHENTICATION_BACKENDS
- [x] Registration endpoint working
- [x] Login blocked for unapproved users
- [x] Login works for approved users
- [x] JWT tokens include role and hospital info

## 🎯 Security Features

1. **Email-based Authentication**
   - More secure than username
   - Unique identifier
   - Easy password reset

2. **Approval Workflow**
   - is_approved flag prevents unauthorized access
   - is_active flag allows admin to disable users
   - Both checked during authentication

3. **Role-based Access**
   - Role included in JWT token
   - Can be used for frontend routing
   - Backend permissions based on role

4. **Hospital Assignment**
   - Hospital ID in JWT token
   - Enables multi-tenant architecture
   - Data isolation per hospital

## 🚀 Next Steps

1. ✅ Test login with approved user
2. ✅ Test login with unapproved user
3. ✅ Verify JWT token contains role and hospital
4. ⏭️ Implement role-based permissions on endpoints
5. ⏭️ Add admin approval endpoints
6. ⏭️ Add email notifications

---

**Status:** ✅ JWT Authentication working with CustomUser model  
**Security:** ✅ Approval workflow enforced  
**Ready for:** Role-based endpoint permissions
