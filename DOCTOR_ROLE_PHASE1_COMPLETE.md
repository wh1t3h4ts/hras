# Doctor Role Implementation - Phase 1 Complete ✅

## Overview
Implemented strict least-privilege permission classes for the 'doctor' role in the Hospital Resource Allocation System (HRAS).

---

## Phase 1: Permission Classes

### 1. IsDoctor Permission
**Location:** `accounts/permissions.py`

```python
class IsDoctor(permissions.BasePermission):
    """Only doctor can access"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'doctor'
```

**Purpose:** Basic authentication check for doctor role access.

---

### 2. DoctorPatientPermission (Object-Level)
**Location:** `accounts/permissions.py`

```python
class DoctorPatientPermission(permissions.BasePermission):
    """
    Doctors can only access patients assigned to them.
    
    CRITICAL FOR PATIENT CONFIDENTIALITY (HIPAA/GDPR Compliance):
    - Object-level permission ensures doctors cannot access unassigned patient records
    - Prevents unauthorized viewing of sensitive medical information (diagnosis, prescriptions, lab results)
    - Enforces "need-to-know" principle: doctors only see patients under their direct care
    - Audit trail: Assignment model tracks which doctor accessed which patient and when
    - Prevents lateral privilege escalation (doctor accessing another doctor's patients)
    - Legal protection: Unauthorized access to medical records can result in HIPAA violations ($50,000+ fines)
    """
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'doctor'
    
    def has_object_permission(self, request, view, obj):
        # Doctor can only access patients they are assigned to
        from core.models import Assignment
        return Assignment.objects.filter(
            patient=obj,
            user=request.user,
            user__role='doctor'
        ).exists()
```

**Why Object-Level Permission is Essential:**

1. **HIPAA Compliance**: Unauthorized access to patient medical records is a federal violation
2. **Patient Confidentiality**: Doctors should only see patients under their direct care
3. **Need-to-Know Principle**: Minimizes exposure of sensitive medical data
4. **Audit Trail**: Assignment model tracks which doctor accessed which patient
5. **Prevents Lateral Privilege Escalation**: Doctor A cannot access Doctor B's patients
6. **Legal Protection**: Clear access controls protect hospital from liability
7. **Professional Ethics**: Aligns with medical ethics and professional standards

---

### 3. IsNotDoctor Permission (Helper)
**Location:** `accounts/permissions.py`

```python
class IsNotDoctor(permissions.BasePermission):
    """
    Explicitly deny doctors access to administrative actions.
    
    USE CASES:
    - Block doctors from managing hospital settings (admin only)
    - Block doctors from approving/rejecting users (admin only)
    - Block doctors from managing resources/beds (admin only)
    - Block doctors from creating/deleting staff accounts (admin only)
    
    RATIONALE:
    Doctors focus on clinical care and patient management, not system administration.
    Separation of duties: clinical staff vs. administrative staff.
    Prevents privilege escalation and maintains clear role boundaries.
    """
    
    def has_permission(self, request, view):
        if request.user and request.user.is_authenticated and request.user.role == 'doctor':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Doctors cannot access administrative functions.")
        return True
```

**Purpose:** Explicitly blocks doctors from administrative endpoints with clear error messages.

---

## Role Confirmation

### CustomUser Model
**Location:** `accounts/models.py`

```python
ROLE_CHOICES = [
    ('super_admin', 'Super Admin'),
    ('hospital_admin', 'Hospital Admin'),
    ('doctor', 'Doctor'),  # ✅ CONFIRMED
    ('nurse', 'Nurse'),
    ('receptionist', 'Receptionist'),
]
```

✅ 'doctor' role is confirmed in CustomUser.ROLE_CHOICES

---

## Security Architecture

### Three-Layer Permission Model

1. **Role-Based Access (IsDoctor)**
   - First layer: Verify user has 'doctor' role
   - Blocks non-doctors from doctor endpoints

2. **Object-Level Access (DoctorPatientPermission)**
   - Second layer: Verify doctor is assigned to specific patient
   - Uses Assignment model to check patient-doctor relationship
   - Prevents doctors from accessing unassigned patients

3. **Explicit Denial (IsNotDoctor)**
   - Third layer: Block doctors from admin functions
   - Raises PermissionDenied with clear error message
   - Prevents privilege escalation

---

## Next Steps

### Phase 2: Create DoctorPatientSerializer
- Restrict fields to clinical data only
- Exclude administrative fields (billing, hospital management)
- Include: diagnosis, prescriptions, lab_reports, treatment_plan, ai_suggestion
- Exclude: hospital settings, user management, resource allocation

### Phase 3: Apply Permissions to Views
- Update PatientViewSet with DoctorPatientPermission
- Add IsNotDoctor to HospitalViewSet, UserManagementViewSet
- Implement queryset filtering for doctors (only assigned patients)

### Phase 4: Frontend Doctor Dashboard
- Create DoctorDashboard.jsx
- Display assigned patients only
- Add clinical action buttons (diagnose, prescribe, order labs)
- Implement patient details modal with full clinical data

### Phase 5: Testing
- Backend permission tests
- Frontend manual test checklist
- Integration tests for doctor workflows

---

## Files Modified

1. ✅ `accounts/permissions.py` - Added DoctorPatientPermission and IsNotDoctor
2. ✅ `accounts/models.py` - Confirmed 'doctor' in ROLE_CHOICES

---

## Compliance Notes

- **HIPAA**: Object-level permissions enforce minimum necessary access
- **GDPR**: Data access limited to assigned patients only
- **Audit Trail**: Assignment model tracks doctor-patient relationships
- **Legal Protection**: Clear access controls reduce liability exposure

---

**Status:** Phase 1 Complete ✅
**Next:** Phase 2 - Create DoctorPatientSerializer
