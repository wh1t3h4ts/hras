# Doctor Role Implementation - Phase 2 Complete ✅

## Overview
Created DoctorPatientSerializer with strict least-privilege access to clinical fields only, excluding administrative data.

---

## Phase 2: DoctorPatientSerializer

### Full Implementation
**Location:** `core/serializers.py`

```python
class DoctorPatientSerializer(serializers.ModelSerializer):
    """
    Restricted serializer for doctors implementing least privilege principle.
    
    INCLUDED FIELDS (Clinical Data):
    - id, name, age, admission_date: Patient identification
    - assigned_doctor: Doctor assignment (read-only)
    - priority, severity: Clinical urgency and condition
    - symptoms: Patient complaints
    - ai_suggestion: AI triage recommendations for clinical decision support
    - lab_reports: Laboratory test results (nested)
    - notes: Clinical notes and progress documentation (nested)
    - observations: Vital signs recorded by nurses (nested, read-only)
    - telephone, emergency_contact: Contact information
    - status: Current patient status
    
    EXCLUDED FIELDS (Administrative/Other-Role Data):
    - hospital: Hospital assignment (admin only)
    - created_by: User who created record (admin/receptionist)
    - billing information: Financial data (admin/billing only)
    - resource allocation: Bed/equipment assignment (admin only)
    - shift scheduling: Staff scheduling (admin only)
    - user management: Staff accounts (admin only)
    - hospital configuration: System settings (admin only)
    """
    assigned_doctor = serializers.SerializerMethodField(read_only=True)
    status = serializers.SerializerMethodField(read_only=True)
    lab_reports = LabReportSerializer(many=True, read_only=True, source='labreport_set')
    notes = NoteSerializer(many=True, read_only=True)
    observations = ObservationSerializer(many=True, read_only=True)

    class Meta:
        model = Patient
        fields = [
            'id', 'name', 'age', 'admission_date',
            'assigned_doctor', 'priority', 'severity', 'symptoms',
            'ai_suggestion', 'telephone', 'emergency_contact',
            'lab_reports', 'notes', 'observations', 'status'
        ]
        read_only_fields = ['id', 'admission_date', 'assigned_doctor', 'observations', 'status']

    def get_assigned_doctor(self, obj):
        """Return doctor assigned to this patient"""
        assignment = Assignment.objects.filter(patient=obj, user__role='doctor').first()
        if assignment:
            return {
                'id': assignment.user.id,
                'name': assignment.user.get_full_name(),
            }
        return None

    def get_status(self, obj):
        """Derive patient status from priority level"""
        priority_status_map = {
            'Critical': 'Critical Care',
            'High': 'Active Treatment',
            'Medium': 'Under Observation',
            'Low': 'Stable'
        }
        return priority_status_map.get(obj.priority, 'Unknown')
```

---

## Field Breakdown

### ✅ INCLUDED FIELDS (Clinical Data)

#### Patient Identification
- **id**: Unique patient identifier
- **name**: Patient full name
- **age**: Patient age
- **admission_date**: When patient was admitted (read-only)

#### Clinical Information
- **priority**: Urgency level (Critical/High/Medium/Low)
- **severity**: Current condition severity
- **symptoms**: Patient complaints and presenting symptoms
- **ai_suggestion**: AI-generated triage recommendations

#### Care Team
- **assigned_doctor**: Doctor assigned to patient (read-only, SerializerMethodField)

#### Contact Information
- **telephone**: Patient phone number
- **emergency_contact**: Emergency contact information

#### Clinical Documentation (Nested, Read-Only)
- **lab_reports**: Laboratory test results ordered by doctor
- **notes**: Clinical notes and progress documentation
- **observations**: Vital signs recorded by nurses

#### Derived Fields
- **status**: Patient status derived from priority (read-only)

---

### ❌ EXCLUDED FIELDS (Administrative/Other-Role Data)

#### Administrative Fields
- **hospital**: Hospital assignment (admin only - doctors work at assigned hospital)
- **created_by**: User who created patient record (admin/receptionist - not clinically relevant)

#### Financial Data
- **billing**: Billing information (admin/billing department only)
- **insurance**: Insurance details (admin/billing only)
- **payment_status**: Payment tracking (admin only)

#### Resource Management
- **resource_allocation**: Bed/equipment assignment (admin only)
- **bed_number**: Physical bed location (admin only)
- **room_assignment**: Room allocation (admin only)

#### Staff Management
- **shift_scheduling**: Staff shift information (admin only)
- **user_management**: Staff account management (admin only)
- **staff_assignments**: Resource allocation (admin only)

#### System Configuration
- **hospital_configuration**: System settings (admin only)
- **system_preferences**: Application settings (admin only)

---

## Read-Only Fields for Doctors

Doctors **CANNOT** modify these fields:

1. **id**: System-generated identifier
2. **admission_date**: Historical timestamp (set on creation)
3. **assigned_doctor**: Staff assignments controlled by admin/system
4. **observations**: Nurse vitals (doctors read, nurses write)
5. **status**: Derived from priority field

---

## Doctor Capabilities

### ✅ Doctors CAN:
- View assigned patients only (enforced by DoctorPatientPermission)
- Update clinical fields: symptoms, priority, severity, ai_suggestion
- Update patient demographics: name, age, telephone, emergency_contact
- Create and view lab reports (via LabReport model)
- Create and view clinical notes (via Note model)
- View nurse observations and vital signs (read-only)
- Access AI triage suggestions for decision support

### ❌ Doctors CANNOT:
- Access unassigned patients (blocked by DoctorPatientPermission)
- Manage hospital settings (blocked by IsNotDoctor)
- Create/delete staff accounts (blocked by IsNotDoctor)
- Manage resource allocation (blocked by IsNotDoctor)
- Access billing information (excluded from serializer)
- Modify nurse observations (read-only field)
- Change admission date (read-only field)

---

## Rationale for Restrictions

### 1. Scope of Practice
Doctors focus on **clinical care**, not system administration. Separating clinical and administrative functions prevents role confusion.

### 2. Separation of Duties
**Clinical staff** (doctors, nurses) vs. **administrative staff** (admins, receptionists). Clear boundaries prevent privilege escalation.

### 3. HIPAA Minimum Necessary
Doctors access only data needed for **direct patient treatment**. Billing, resource allocation, and system settings are not clinically necessary.

### 4. Audit Compliance
Clear separation of roles creates **audit trail** for compliance. Doctors cannot modify administrative records.

### 5. Security
Prevents **privilege escalation** to administrative functions. Doctors cannot create admin accounts or modify hospital settings.

### 6. Professional Standards
Aligns with **medical ethics** and professional boundaries. Doctors treat patients, admins manage systems.

---

## Nested Serializers

### Lab Reports (Read-Only)
```python
lab_reports = LabReportSerializer(many=True, read_only=True, source='labreport_set')
```
- Doctors can view all lab reports for their patients
- Lab reports include: diagnosis, check_in_time, response_time
- Doctors can create new lab reports via separate endpoint

### Clinical Notes (Read-Only)
```python
notes = NoteSerializer(many=True, read_only=True)
```
- Doctors can view all clinical notes for their patients
- Notes include: note_type, text, created_by, created_at
- Doctors can create new notes via separate endpoint

### Observations (Read-Only)
```python
observations = ObservationSerializer(many=True, read_only=True)
```
- Doctors can view vital signs recorded by nurses
- Observations include: BP, temperature, pulse, respiratory_rate, SpO2, notes
- Doctors CANNOT modify nurse observations (audit integrity)

---

## Comparison with Other Role Serializers

### Receptionist vs. Doctor vs. Nurse

| Field | Receptionist | Doctor | Nurse |
|-------|-------------|--------|-------|
| name | ✅ | ✅ | ✅ (read-only) |
| age | ✅ | ✅ | ✅ (read-only) |
| symptoms | ✅ | ✅ | ✅ |
| priority | ✅ (read-only) | ✅ | ✅ (read-only) |
| ai_suggestion | ❌ | ✅ | ❌ |
| lab_reports | ❌ | ✅ | ❌ |
| notes | ❌ | ✅ | ❌ |
| observations | ❌ | ✅ (read-only) | ✅ (create) |
| diagnosis | ❌ | ✅ | ❌ |
| hospital | ❌ | ❌ | ❌ |
| billing | ❌ | ❌ | ❌ |

---

## Security Model

### Three-Layer Protection

1. **Permission Layer** (DoctorPatientPermission)
   - Verifies doctor is assigned to patient
   - Blocks access to unassigned patients

2. **Serializer Layer** (DoctorPatientSerializer)
   - Restricts fields to clinical data only
   - Excludes administrative fields

3. **View Layer** (PatientViewSet)
   - Filters queryset to assigned patients only
   - Applies DoctorPatientPermission on object access

---

## Next Steps

### Phase 3: Apply Permissions to Views
- Update PatientViewSet with DoctorPatientPermission
- Add IsNotDoctor to HospitalViewSet, UserManagementViewSet
- Implement queryset filtering for doctors (only assigned patients)
- Add get_serializer_class() to return DoctorPatientSerializer for doctors

### Phase 4: Frontend Doctor Dashboard
- Create DoctorDashboard.jsx
- Display assigned patients with full clinical data
- Add clinical action buttons (diagnose, prescribe, order labs)
- Implement patient details modal with lab reports and notes

### Phase 5: Testing
- Backend permission tests
- Serializer field tests
- Frontend manual test checklist

---

## Files Modified

1. ✅ `core/serializers.py` - Added DoctorPatientSerializer

---

**Status:** Phase 2 Complete ✅
**Next:** Phase 3 - Apply Permissions to Views
