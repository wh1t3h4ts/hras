# Super Admin Privileges - Complete Implementation

## ✅ Super Admin Full Privileges

The super_admin role now has complete control over the HRAS system including user verification, role management, and task assignment.

---

## 🔐 Permission System

### Custom Permissions Created:

1. **IsSuperAdmin** - Only super_admin can access
2. **IsHospitalAdminOrSuperAdmin** - Hospital admin or super_admin
3. **IsApprovedUser** - User must be approved and active

**File:** `accounts/permissions.py`

---

## 📡 Super Admin API Endpoints

### Base URL: `/api/accounts/`

### 1. User Management

#### List All Users
```http
GET /api/accounts/users/
Authorization: Bearer <super_admin_token>
```

**Response:**
```json
[
  {
    "id": 1,
    "email": "user@hospital.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "doctor",
    "is_approved": false,
    "is_active": false,
    "hospital": 1,
    "hospital_name": "General Hospital",
    "date_joined": "2026-02-09T10:00:00Z"
  }
]
```

#### Get Pending Approvals
```http
GET /api/accounts/users/pending/
Authorization: Bearer <super_admin_token>
```

**Returns:** All users with `is_approved=False`

---

### 2. Account Verification

#### Approve User
```http
POST /api/accounts/users/{id}/approve/
Authorization: Bearer <super_admin_token>
```

**Actions:**
- Sets `is_approved = True`
- Sets `is_active = True`
- User can now login

**Response:**
```json
{
  "message": "User user@hospital.com has been approved.",
  "user": { ... }
}
```

#### Reject User
```http
POST /api/accounts/users/{id}/reject/
Authorization: Bearer <super_admin_token>
```

**Actions:**
- Sets `is_approved = False`
- Sets `is_active = False`
- User cannot login

---

### 3. Account Activation Control

#### Deactivate User
```http
POST /api/accounts/users/{id}/deactivate/
Authorization: Bearer <super_admin_token>
```

**Security:** Cannot deactivate other super_admin accounts

#### Activate User
```http
POST /api/accounts/users/{id}/activate/
Authorization: Bearer <super_admin_token>
```

---

### 4. Hospital Assignment (Task Assignment)

#### Assign User to Hospital
```http
PATCH /api/accounts/users/{id}/assign_hospital/
Authorization: Bearer <super_admin_token>
Content-Type: application/json

{
  "hospital_id": 1
}
```

**Use Case:** Assign staff to specific hospitals for task management

**Response:**
```json
{
  "message": "User user@hospital.com assigned to General Hospital.",
  "user": { ... }
}
```

---

### 5. Role Management

#### Change User Role
```http
PATCH /api/accounts/users/{id}/change_role/
Authorization: Bearer <super_admin_token>
Content-Type: application/json

{
  "role": "hospital_admin"
}
```

**Valid Roles:**
- `super_admin`
- `hospital_admin`
- `doctor`
- `nurse`
- `receptionist`

**Response:**
```json
{
  "message": "User user@hospital.com role changed to hospital_admin.",
  "user": { ... }
}
```

---

### 6. Full CRUD Operations

#### Create User
```http
POST /api/accounts/users/
Authorization: Bearer <super_admin_token>
Content-Type: application/json

{
  "email": "newuser@hospital.com",
  "password": "SecurePass123",
  "first_name": "Jane",
  "last_name": "Smith",
  "role": "nurse",
  "hospital_id": 1
}
```

#### Update User
```http
PUT /api/accounts/users/{id}/
Authorization: Bearer <super_admin_token>
Content-Type: application/json

{
  "first_name": "Updated",
  "last_name": "Name",
  "role": "doctor"
}
```

#### Delete User
```http
DELETE /api/accounts/users/{id}/
Authorization: Bearer <super_admin_token>
```

---

## 🎯 Super Admin Workflow Examples

### Example 1: Approve New Registration

```bash
# 1. User registers
curl -X POST http://localhost:8000/api/accounts/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@hospital.com",
    "password": "SecurePass123",
    "password_confirm": "SecurePass123",
    "first_name": "John",
    "last_name": "Doe",
    "role": "doctor"
  }'

# 2. Super admin checks pending users
curl -X GET http://localhost:8000/api/accounts/users/pending/ \
  -H "Authorization: Bearer <super_admin_token>"

# 3. Super admin approves user
curl -X POST http://localhost:8000/api/accounts/users/1/approve/ \
  -H "Authorization: Bearer <super_admin_token>"

# 4. User can now login
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@hospital.com",
    "password": "SecurePass123"
  }'
```

### Example 2: Assign Tasks via Hospital Assignment

```bash
# Assign doctor to Hospital A
curl -X PATCH http://localhost:8000/api/accounts/users/1/assign_hospital/ \
  -H "Authorization: Bearer <super_admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"hospital_id": 1}'

# Assign nurse to Hospital B
curl -X PATCH http://localhost:8000/api/accounts/users/2/assign_hospital/ \
  -H "Authorization: Bearer <super_admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"hospital_id": 2}'
```

### Example 3: Promote User to Admin

```bash
# Change role from doctor to hospital_admin
curl -X PATCH http://localhost:8000/api/accounts/users/1/change_role/ \
  -H "Authorization: Bearer <super_admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"role": "hospital_admin"}'
```

---

## 🔒 Security Features

### 1. Permission Checks
- All endpoints require authentication
- Super admin endpoints check `role == 'super_admin'`
- Hospital admin can only view users in their hospital
- Regular users can only view themselves

### 2. Protected Actions
- Cannot deactivate super_admin accounts
- Cannot register as super_admin (must be created via Django admin)
- Role changes validated against ROLE_CHOICES
- Hospital assignment validates hospital exists

### 3. Audit Trail
All user changes are tracked via:
- `date_joined` timestamp
- `is_approved` flag
- `is_active` flag
- Hospital assignment history

---

## 📋 Permission Matrix

| Action | Super Admin | Hospital Admin | Doctor/Nurse | Receptionist |
|--------|-------------|----------------|--------------|--------------|
| View all users | ✅ | ✅ (own hospital) | ❌ | ❌ |
| View pending users | ✅ | ❌ | ❌ | ❌ |
| Approve users | ✅ | ❌ | ❌ | ❌ |
| Reject users | ✅ | ❌ | ❌ | ❌ |
| Activate/Deactivate | ✅ | ❌ | ❌ | ❌ |
| Assign hospital | ✅ | ❌ | ❌ | ❌ |
| Change role | ✅ | ❌ | ❌ | ❌ |
| Create user | ✅ | ❌ | ❌ | ❌ |
| Update user | ✅ | ❌ | ❌ | ❌ |
| Delete user | ✅ | ❌ | ❌ | ❌ |

---

## 🧪 Testing Super Admin Privileges

### 1. Create Super Admin
```bash
python manage.py createsuperuser
# Email: admin@hras.com
# Password: (secure password)
```

### 2. Login as Super Admin
```bash
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hras.com",
    "password": "your_password"
  }'
```

### 3. Test Pending Users Endpoint
```bash
curl -X GET http://localhost:8000/api/accounts/users/pending/ \
  -H "Authorization: Bearer <token>"
```

### 4. Test Approve User
```bash
curl -X POST http://localhost:8000/api/accounts/users/1/approve/ \
  -H "Authorization: Bearer <token>"
```

### 5. Test Assign Hospital
```bash
curl -X PATCH http://localhost:8000/api/accounts/users/1/assign_hospital/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"hospital_id": 1}'
```

---

## 📁 Files Created/Modified

1. **accounts/permissions.py** (Created)
   - IsSuperAdmin permission
   - IsHospitalAdminOrSuperAdmin permission
   - IsApprovedUser permission

2. **accounts/views.py** (Updated)
   - UserManagementViewSet with all admin actions
   - Approve/reject endpoints
   - Hospital assignment
   - Role management

3. **accounts/urls.py** (Updated)
   - Router for UserManagementViewSet
   - All admin endpoints registered

---

## 🎯 Super Admin Capabilities Summary

### ✅ Account Verification
- View all pending registrations
- Approve user accounts
- Reject user accounts
- Activate/deactivate accounts

### ✅ Task Assignment
- Assign users to hospitals
- Change user roles
- Manage hospital staff allocation

### ✅ User Management
- Create new users directly
- Update user information
- Delete user accounts
- View all users across all hospitals

### ✅ Role Management
- Promote users to admin roles
- Demote users to lower roles
- Assign specialized roles (doctor, nurse, etc.)

### ✅ Security Control
- Cannot deactivate other super admins
- All actions require super_admin role
- Audit trail maintained
- Permission-based access control

---

## 🚀 Next Steps

1. ✅ Test all super admin endpoints
2. ⏭️ Create frontend admin dashboard
3. ⏭️ Add email notifications for approvals
4. ⏭️ Add bulk user operations
5. ⏭️ Add user activity logs
6. ⏭️ Add role-based dashboard routing

---

**Status:** ✅ Super Admin has full privileges  
**Security:** ✅ Permission-based access control  
**Ready for:** Frontend admin dashboard implementation
