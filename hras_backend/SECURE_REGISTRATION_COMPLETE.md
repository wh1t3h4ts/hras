# HRAS Secure Registration with Approval - Implementation Complete

## ✅ Phase 1: Custom User Model (Completed)

### Files Created:
1. **accounts/models.py** - CustomUser model with role-based access
2. **accounts/admin.py** - Django admin interface for user management
3. **accounts/apps.py** - App configuration
4. **accounts/__init__.py** - Package initialization

### CustomUser Model Features:
- **Email-based authentication** (USERNAME_FIELD = 'email')
- **Role field** with choices:
  - super_admin
  - hospital_admin
  - doctor
  - nurse
  - receptionist
- **is_approved** boolean (default=False) - Admin must approve
- **hospital** ForeignKey (nullable) - Hospital assignment
- **Custom UserManager** with create_user/create_superuser methods

### Settings Updated:
```python
INSTALLED_APPS = [
    ...
    'accounts',  # Custom user model app
    'core',
]

AUTH_USER_MODEL = 'accounts.CustomUser'
```

---

## ✅ Phase 2: Secure Registration Endpoint (Completed)

### Files Created:
1. **accounts/serializers.py** - RegisterSerializer with validation
2. **accounts/views.py** - RegisterView (public endpoint)
3. **accounts/urls.py** - URL routing

### Security Implementation:

#### 1. RegisterSerializer
```python
class RegisterSerializer(serializers.ModelSerializer):
    - Validates role is NOT 'super_admin'
    - Requires password confirmation
    - Hashes password using set_password()
    - Sets is_active=False and is_approved=False on creation
```

**Key Validations:**
- Email must be unique
- Password minimum 8 characters
- Password confirmation must match
- Cannot register as super_admin
- First name and last name required

#### 2. RegisterView
```python
class RegisterView(generics.CreateAPIView):
    permission_classes = [AllowAny]  # Public access
    serializer_class = RegisterSerializer
```

**Security Features:**
- **AllowAny permission** - No authentication required to register
- **is_active=False** - Blocks login until admin approval
- **is_approved=False** - Tracks approval status
- Returns clear message about pending approval

#### 3. Why is_active=False Blocks Login:

**Django Authentication Flow:**
1. User attempts login with email/password
2. Django checks `is_active` flag
3. If `is_active=False`, authentication fails
4. JWT token generation is blocked
5. User cannot access protected endpoints

**Approval Workflow:**
```
1. User registers → is_active=False, is_approved=False
2. Admin reviews in Django admin panel
3. Admin sets is_active=True, is_approved=True
4. User can now login and receive JWT token
5. User can access role-based endpoints
```

---

## 🔐 Principle of Least Privilege (PoLP) Implementation

### 1. Registration Level
- ✅ Users cannot self-assign super_admin role
- ✅ New users start inactive (cannot login)
- ✅ New users start unapproved (admin review required)
- ✅ Hospital assignment optional (admin can assign later)

### 2. Role Hierarchy
```
super_admin > hospital_admin > doctor > nurse > receptionist
```

### 3. Default Permissions
- **New User**: No access (inactive)
- **Approved User**: Role-based access only
- **Super Admin**: Full system access
- **Hospital Admin**: Hospital-level management
- **Doctor/Nurse/Receptionist**: Limited to assigned tasks

---

## 📡 API Endpoints

### POST /api/accounts/register/
**Public endpoint (no authentication required)**

**Request:**
```json
{
  "email": "doctor@hospital.com",
  "password": "SecurePass123",
  "password_confirm": "SecurePass123",
  "first_name": "John",
  "last_name": "Doe",
  "role": "doctor",
  "hospital_id": 1
}
```

**Response (201 Created):**
```json
{
  "message": "Registration successful. Your account is pending approval by an administrator.",
  "user": {
    "email": "doctor@hospital.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "doctor",
    "is_approved": false,
    "is_active": false
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "role": ["Cannot register as super admin. Contact system administrator."]
}
```

---

## 🛠️ Database Migration Commands

```bash
# Create migrations for CustomUser model
python manage.py makemigrations accounts

# Apply migrations
python manage.py migrate

# Create superuser (for admin access)
python manage.py createsuperuser
# Email: admin@hras.com
# Password: (secure password)
```

---

## 🔒 Security Features

### 1. Password Security
- ✅ Minimum 8 characters
- ✅ Hashed using Django's set_password()
- ✅ Never stored in plain text
- ✅ Password confirmation required

### 2. Role Security
- ✅ Cannot self-assign super_admin
- ✅ Role choices validated at serializer level
- ✅ Role-based permissions enforced

### 3. Approval Security
- ✅ is_active=False blocks all authentication
- ✅ is_approved=False tracks admin review
- ✅ Admin must explicitly approve users
- ✅ Prevents unauthorized access

### 4. Hospital Assignment
- ✅ Optional during registration
- ✅ Admin can assign/change later
- ✅ Validates hospital exists
- ✅ Supports multi-hospital system

---

## 📋 Admin Panel Features

### User Management
- View all registered users
- Filter by role, approval status, hospital
- Search by email, name
- Approve/reject users
- Assign hospitals
- Change roles (with proper permissions)

### Approval Process
1. Navigate to Django admin: http://localhost:8000/admin/
2. Go to "Users" section
3. Find pending users (is_approved=False)
4. Review user details
5. Check "Is active" and "Is approved"
6. Save user
7. User can now login

---

## 🧪 Testing the Implementation

### 1. Test Registration
```bash
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
```

### 2. Verify User Cannot Login
```bash
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@hospital.com",
    "password": "TestPass123"
  }'
# Should return error: "No active account found"
```

### 3. Approve User in Admin
- Login to admin panel
- Find user
- Set is_active=True, is_approved=True
- Save

### 4. Verify User Can Now Login
```bash
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@hospital.com",
    "password": "TestPass123"
  }'
# Should return JWT tokens
```

---

## 🎯 Next Steps (Future Phases)

### Phase 3: Admin Approval Endpoints
- GET /api/accounts/pending/ - List pending users
- POST /api/accounts/approve/<id>/ - Approve user
- POST /api/accounts/reject/<id>/ - Reject user

### Phase 4: Role-Based Permissions
- Custom permission classes
- View-level permission checks
- Object-level permissions

### Phase 5: Email Notifications
- Send email on registration
- Send email on approval/rejection
- Password reset functionality

---

## ✅ Implementation Checklist

- [x] CustomUser model with role field
- [x] Email as USERNAME_FIELD
- [x] is_approved boolean field
- [x] hospital ForeignKey
- [x] CustomUserManager
- [x] AUTH_USER_MODEL setting
- [x] RegisterSerializer with validation
- [x] Password hashing
- [x] Role validation (no super_admin)
- [x] RegisterView with AllowAny
- [x] is_active=False on registration
- [x] is_approved=False on registration
- [x] URL routing
- [x] Django admin configuration
- [x] Documentation

---

## 📚 Files Structure

```
hras_backend/
├── accounts/
│   ├── migrations/
│   │   └── __init__.py
│   ├── __init__.py
│   ├── admin.py          # Django admin config
│   ├── apps.py           # App configuration
│   ├── models.py         # CustomUser model
│   ├── serializers.py    # RegisterSerializer
│   ├── views.py          # RegisterView
│   └── urls.py           # URL routing
├── hras_backend/
│   └── settings.py       # AUTH_USER_MODEL setting
└── manage.py
```

---

**Status:** ✅ Secure registration with approval workflow complete!  
**Security Level:** High - Implements PoLP from registration  
**Ready for:** Phase 3 (Admin approval endpoints)
