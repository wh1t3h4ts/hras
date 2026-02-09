# Doctor Role Implementation - Phase 3 Complete ✅

## Overview
Updated PatientViewSet with doctor-specific permissions, serializer switching, and queryset scoping to enforce strict least-privilege access control.

---

## Phase 3: PatientViewSet Restrictions

### 1. Permission Classes (get_permissions)

```python
def get_permissions(self):
    """
    Dynamic permission assignment based on action.
    
    DOCTOR RESTRICTIONS:
    - list/retrieve/update/partial_update: Allowed (queryset filtered to assigned patients)
    - create/destroy: DENIED (requires IsNotDoctor permission)
    """
    if self.action in ['list', 'retrieve']:
        return [IsAuthenticated(), PatientAccessPermission()]
    elif self.action == 'create':
        # Deny doctors and nurses from creating patients (admin/receptionist only)
        from accounts.permissions import IsNotNurse, IsNotDoctor
        return [IsAuthenticated(), PatientAccessPermission(), IsNotNurse(), IsNotDoctor()]
    elif self.action in ['update', 'partial_update']:
        # Allow doctors and nurses to update assigned patients (limited fields via serializer)
        return [IsAuthenticated(), StaffPatientPermission()]
    elif self.action == 'destroy':
        # Deny doctors and nurses from deleting patients (admin only)
        from accounts.permissions import IsNotNurse, IsNotDoctor
        return [IsAuthenticated(), StaffPatientPermission(), IsNotNurse(), IsNotDoctor()]
    return [IsAuthenticated()]
```

#### Permission Breakdown by Action:

| Action | Doctor Access | Permission Classes |
|--------|--------------|-------------------|
| **list** | ✅ Allowed (assigned patients only) | IsAuthenticated, PatientAccessPermission |
| **retrieve** | ✅ Allowed (assigned patients only) | IsAuthenticated, PatientAccessPermission |
| **create** | ❌ DENIED | IsAuthenticated, PatientAccessPermission, IsNotDoctor |
| **update** | ✅ Allowed (assigned patients only) | IsAuthenticated, StaffPatientPermission |
| **partial_update** | ✅ Allowed (assigned patients only) | IsAuthenticated, StaffPatientPermission |
| **destroy** | ❌ DENIED | IsAuthenticated, StaffPatientPermission, IsNotDoctor |

---

### 2. Serializer Switching (get_serializer_class)

```python
def get_serializer_class(self):
    """
    Return role-specific serializer.
    
    DOCTOR: DoctorPatientSerializer (clinical fields, lab reports, notes, observations)
    NURSE: NursePatientSerializer (limited fields, read-only priority/assignments)
    RECEPTIONIST: ReceptionistPatientSerializer (basic fields only)
    OTHERS: PatientSerializer (full access)
    """
    if self.request.user.is_authenticated:
        if self.request.user.role == 'doctor' and self.action in ['list', 'retrieve', 'update', 'partial_update']:
            return DoctorPatientSerializer
        elif self.request.user.role == 'nurse' and self.action in ['list', 'retrieve', 'update', 'partial_update']:
            return NursePatientSerializer
        elif self.request.user.role == 'receptionist' and self.action in ['list', 'retrieve']:
            return ReceptionistPatientSerializer
    return PatientSerializer
```

#### Serializer Selection by Role:

| Role | Actions | Serializer | Fields Included |
|------|---------|-----------|----------------|
| **doctor** | list, retrieve, update, partial_update | DoctorPatientSerializer | Clinical data, lab reports, notes, observations |
| **nurse** | list, retrieve, update, partial_update | NursePatientSerializer | Care-related data, limited fields |
| **receptionist** | list, retrieve | ReceptionistPatientSerializer | Basic demographics only |
| **admin** | all | PatientSerializer | Full access |

---

### 3. Queryset Scoping (get_queryset)

```python
def get_queryset(self):
    """
    Scope queryset by role and hospital.
    
    DOCTOR SCOPING (CRITICAL FOR HIPAA):
    - Only patients assigned to this doctor via Assignment model
    - Cannot see other doctors' patients
    - Cannot see unassigned patients
    - Hospital-scoped automatically via assignment
    """
    user = self.request.user
    if not user.is_authenticated:
        return Patient.objects.none()
    
    if user.role == 'super_admin':
        return Patient.objects.all()
    elif user.role == 'hospital_admin' and user.hospital:
        return Patient.objects.filter(hospital=user.hospital)
    elif user.role == 'doctor':
        # STRICT: Doctors only see patients assigned to them
        return Patient.objects.filter(assignment__user=user, assignment__user__role='doctor').distinct()
    elif user.role == 'nurse':
        # STRICT: Nurses only see patients assigned to them
        return Patient.objects.filter(assignment__user=user, assignment__user__role='nurse').distinct()
    elif user.role == 'receptionist' and user.hospital:
        return Patient.objects.filter(hospital=user.hospital)
    return Patient.objects.none()
```

#### Queryset Filtering by Role:

| Role | Queryset Filter | Patients Visible |
|------|----------------|------------------|
| **super_admin** | `Patient.objects.all()` | All patients |
| **hospital_admin** | `hospital=user.hospital` | All patients in their hospital |
| **doctor** | `assignment__user=user, assignment__user__role='doctor'` | Only assigned patients |
| **nurse** | `assignment__user=user, assignment__user__role='nurse'` | Only assigned patients |
| **receptionist** | `hospital=user.hospital` | All patients in their hospital |

---

## Security Architecture

### Three-Layer Protection for Doctors

#### Layer 1: Permission Check (get_permissions)
- **create/destroy**: Blocked by `IsNotDoctor` permission
- **list/retrieve/update**: Allowed by `PatientAccessPermission` / `StaffPatientPermission`

#### Layer 2: Queryset Filtering (get_queryset)
- Filters to only patients where `assignment__user=request.user` and `assignment__user__role='doctor'`
- Prevents doctors from accessing unassigned patients
- Uses `.distinct()` to avoid duplicates from multiple assignments

#### Layer 3: Serializer Restriction (get_serializer_class)
- Returns `DoctorPatientSerializer` for doctors
- Excludes administrative fields (hospital, created_by, billing)
- Includes clinical fields (lab_reports, notes, observations)

---

## Doctor Capabilities Summary

### ✅ Doctors CAN:
1. **List Patients**: View all patients assigned to them
2. **Retrieve Patient**: View detailed clinical data for assigned patients
3. **Update Patient**: Modify clinical fields (symptoms, priority, severity, ai_suggestion)
4. **Partial Update**: Update specific clinical fields
5. **View Lab Reports**: Access lab results for assigned patients (nested in serializer)
6. **View Notes**: Access clinical notes for assigned patients (nested in serializer)
7. **View Observations**: Access nurse vitals for assigned patients (nested, read-only)

### ❌ Doctors CANNOT:
1. **Create Patients**: Patient registration is admin/receptionist only
2. **Delete Patients**: Patient deletion is admin only
3. **Access Unassigned Patients**: Queryset filtered to assigned patients only
4. **Modify Administrative Fields**: hospital, created_by excluded from serializer
5. **Access Billing**: Billing information excluded from serializer
6. **Manage Hospital**: Hospital settings blocked by IsNotDoctor
7. **Create Staff Accounts**: User management blocked by IsNotDoctor

---

## HIPAA Compliance

### Patient Confidentiality
- **Need-to-Know Principle**: Doctors only access patients under their direct care
- **Assignment Model**: Tracks which doctor is assigned to which patient
- **Audit Trail**: Assignment.created_at and Assignment.updated_at track access
- **Queryset Filtering**: Database-level filtering prevents unauthorized access

### Minimum Necessary Access
- **Clinical Fields Only**: DoctorPatientSerializer excludes administrative data
- **No Billing Access**: Financial information excluded
- **No System Admin**: Hospital configuration blocked

### Legal Protection
- **Clear Boundaries**: Explicit permission denials with error messages
- **Audit Compliance**: HistoricalRecords on Patient model tracks all changes
- **Role Separation**: Clinical vs. administrative duties clearly defined

---

## API Endpoint Behavior

### GET /api/patients/ (List)
**Doctor Request:**
```python
# Queryset: Only assigned patients
# Serializer: DoctorPatientSerializer
# Response: List of assigned patients with clinical data
```

**Example Response:**
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "age": 45,
    "admission_date": "2024-01-15",
    "assigned_doctor": {"id": 5, "name": "Dr. Smith"},
    "priority": "High",
    "severity": "Moderate",
    "symptoms": "Chest pain, shortness of breath",
    "ai_suggestion": "High priority - cardiac evaluation recommended",
    "telephone": "555-1234",
    "emergency_contact": "555-5678",
    "lab_reports": [...],
    "notes": [...],
    "observations": [...],
    "status": "Active Treatment"
  }
]
```

### GET /api/patients/{id}/ (Retrieve)
**Doctor Request:**
```python
# Permission: PatientAccessPermission
# Queryset: Filtered to assigned patients
# Serializer: DoctorPatientSerializer
# Response: Full clinical data for assigned patient
```

### POST /api/patients/ (Create)
**Doctor Request:**
```python
# Permission: IsNotDoctor
# Response: 403 Forbidden
# Error: "Doctors cannot access administrative functions."
```

### PATCH /api/patients/{id}/ (Partial Update)
**Doctor Request:**
```python
# Permission: StaffPatientPermission
# Queryset: Filtered to assigned patients
# Serializer: DoctorPatientSerializer
# Allowed Fields: symptoms, priority, severity, ai_suggestion, name, age, telephone, emergency_contact
# Read-Only Fields: id, admission_date, assigned_doctor, observations, status
```

### DELETE /api/patients/{id}/ (Destroy)
**Doctor Request:**
```python
# Permission: IsNotDoctor
# Response: 403 Forbidden
# Error: "Doctors cannot access administrative functions."
```

---

## Comparison: Doctor vs. Nurse vs. Receptionist

| Feature | Doctor | Nurse | Receptionist |
|---------|--------|-------|--------------|
| **List Patients** | ✅ Assigned only | ✅ Assigned only | ✅ All in hospital |
| **Retrieve Patient** | ✅ Assigned only | ✅ Assigned only | ✅ All in hospital |
| **Create Patient** | ❌ Denied | ❌ Denied | ✅ Allowed |
| **Update Patient** | ✅ Clinical fields | ✅ Limited fields | ❌ Denied |
| **Delete Patient** | ❌ Denied | ❌ Denied | ❌ Denied |
| **View Lab Reports** | ✅ Nested | ❌ Denied | ❌ Denied |
| **View Notes** | ✅ Nested | ❌ Denied | ❌ Denied |
| **View Observations** | ✅ Nested (read-only) | ✅ Create/view | ❌ Denied |
| **AI Suggestion** | ✅ Included | ❌ Excluded | ❌ Excluded |
| **Billing Access** | ❌ Excluded | ❌ Excluded | ❌ Excluded |

---

## Testing Checklist

### Backend Tests (To Be Created)
- [ ] Doctor can list only assigned patients
- [ ] Doctor can retrieve assigned patient with full clinical data
- [ ] Doctor cannot retrieve unassigned patient (404)
- [ ] Doctor can update clinical fields on assigned patient
- [ ] Doctor cannot create patient (403)
- [ ] Doctor cannot delete patient (403)
- [ ] DoctorPatientSerializer includes lab_reports, notes, observations
- [ ] DoctorPatientSerializer excludes hospital, created_by, billing
- [ ] Queryset filtering works correctly for doctors
- [ ] IsNotDoctor blocks create/destroy actions

### Frontend Tests (To Be Created)
- [ ] Doctor dashboard shows only assigned patients
- [ ] Doctor can view patient details with clinical data
- [ ] Doctor can update patient symptoms, priority, severity
- [ ] Doctor cannot see "Add Patient" button
- [ ] Doctor cannot see "Delete Patient" button
- [ ] Doctor sees lab reports, notes, observations in patient details
- [ ] Doctor cannot access hospital management
- [ ] Doctor cannot access user management

---

## Files Modified

1. ✅ `core/views.py` - Updated PatientViewSet with doctor restrictions
   - Added IsNotDoctor to create/destroy permissions
   - Added DoctorPatientSerializer to get_serializer_class()
   - Updated get_queryset() to filter doctors to assigned patients only
   - Imported DoctorPatientSerializer and IsNotDoctor

---

## Next Steps

### Phase 4: Frontend Doctor Dashboard
- Create DoctorDashboard.jsx
- Display assigned patients with clinical data
- Add patient details modal with lab reports, notes, observations
- Add clinical action buttons (update symptoms, priority, severity)
- Hide "Add Patient" and "Delete Patient" buttons for doctors

### Phase 5: Testing
- Backend permission tests
- Serializer field tests
- Queryset filtering tests
- Frontend manual test checklist

---

**Status:** Phase 3 Complete ✅
**Next:** Phase 4 - Frontend Doctor Dashboard
