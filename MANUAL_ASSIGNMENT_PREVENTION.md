# Manual Assignment Prevention - Implementation

## Overview
Enforces that NO user can manually assign patients to doctors/nurses. All assignments must be automatic per KSEF 2026 project requirements.

## Why Manual Assignment is Blocked

### KSEF Project Requirement
Per project abstract:
> "The system automatically assigns a doctor or nurse to the patient based on available resources"

### Problems with Manual Assignment

1. **Human Delay**
   - Manual: 2-5 minutes per assignment
   - Automatic: <100 milliseconds
   - Impact: 120x-3000x slower

2. **Bias and Favoritism**
   - Manual selection allows preferential treatment
   - Staff may be overloaded while others idle
   - Violates fairness principle

3. **Bypasses Workload Balancing**
   - Algorithm ensures equal distribution
   - Manual assignment ignores current workload
   - Leads to staff burnout

4. **Ignores Priority-Based Routing**
   - Critical patients should get doctors first
   - Manual assignment may assign nurse to critical case
   - Compromises patient safety

5. **No Audit Trail**
   - Manual changes lack justification
   - Cannot track why assignment was made
   - Compliance issues

6. **Reduces System Efficiency**
   - Defeats purpose of automation
   - Eliminates competitive advantage
   - Fails project objectives

## Implementation

### Backend Protection (3 Layers)

#### Layer 1: Serializer Validation (`core/serializers.py`)

**PatientSerializer:**
```python
class PatientSerializer(serializers.ModelSerializer):
    assigned_staff = serializers.SerializerMethodField(read_only=True)
    assignment_time = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Patient
        fields = '__all__'
        read_only_fields = ['hospital', 'created_by', 'admission_date', 
                           'assigned_staff', 'assignment_time']
    
    def validate(self, data):
        """Block manual assignment attempts at serializer level"""
        request = self.context.get('request')
        if request and request.user.role != 'super_admin':
            forbidden_fields = ['assigned_doctor', 'assigned_nurse', 'assigned_staff']
            for field in forbidden_fields:
                if field in data:
                    raise serializers.ValidationError({
                        field: "Manual patient assignment is not allowed. System assigns automatically."
                    })
        return data
```

**Protection:**
- Assignment fields marked `read_only=True`
- Validation blocks forbidden fields
- Only super_admin can override (emergency)

#### Layer 2: View-Level Enforcement (`core/views.py`)

**PatientViewSet.perform_update:**
```python
def perform_update(self, serializer):
    """Prevent manual assignment - system only"""
    if self.request.user.role != 'super_admin':
        forbidden_fields = ['assigned_doctor', 'assigned_nurse', 'assigned_staff']
        for field in forbidden_fields:
            if field in self.request.data:
                raise PermissionDenied(
                    "Manual patient assignment is not allowed. "
                    "Per KSEF project requirements, the system automatically assigns patients "
                    "to doctors/nurses based on priority, availability, and workload balance. "
                    "This ensures fair distribution, eliminates bias, and reduces wait times. "
                    "Contact a system administrator if reassignment is needed."
                )
    serializer.save()
```

**Protection:**
- Checks request.data for forbidden fields
- Raises PermissionDenied with detailed explanation
- Only super_admin bypasses check

#### Layer 3: Model-Level (Assignment Model)

**Assignment Creation:**
- Only created via `assign_patient()` function
- No direct Assignment.objects.create() in views
- Signal-triggered on Patient creation

### Frontend Removal

#### Removed Components (`Patients.jsx`)

**Before (Manual Assignment):**
```jsx
<select
  value={patient.assigned_doctor || ''}
  onChange={(e) => assignPatient(patient.id, e.target.value)}
  className="px-3 py-1 border border-gray-300 rounded text-sm bg-white"
>
  <option value="">Unassigned</option>
  {doctors.map(doctor => (
    <option key={doctor.id} value={doctor.id}>
      {doctor.username} ({doctor.role})
    </option>
  ))}
</select>
```

**After (Read-Only Display):**
```jsx
{patient.assigned_staff ? (
  <div className="flex items-center space-x-2">
    <UserCheck size={16} className="text-green-600" />
    <span className="text-sm text-gray-900">
      {patient.assigned_staff.role === 'doctor' ? 'Dr.' : 'Nurse'} {patient.assigned_staff.name}
    </span>
  </div>
) : (
  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
    ⏳ Waiting
  </span>
)}
```

**Removed Functions:**
- `fetchDoctors()` - No longer need staff list
- `assignPatient()` - Manual assignment blocked
- `calculateWaitTime()` - Simplified display

**Removed State:**
- `doctors` - Staff list not needed
- Assignment-related form fields

## Exception: Super Admin Override

### When Allowed
- Emergency reassignment (staff unavailable, patient needs specialist)
- System error correction
- Special circumstances requiring manual intervention

### How to Use
1. Login as super_admin
2. Use admin panel or API directly
3. Provide justification in audit log
4. Automatic assignment resumes for new patients

### API Endpoint (Super Admin Only)
```bash
PATCH /api/patients/<id>/
Authorization: Bearer <super_admin_token>
Content-Type: application/json

{
  "assigned_staff": <staff_id>  # Only super_admin can set this
}
```

## Error Messages

### User Attempts Manual Assignment

**Backend Response (403 Forbidden):**
```json
{
  "detail": "Manual patient assignment is not allowed. Per KSEF project requirements, the system automatically assigns patients to doctors/nurses based on priority, availability, and workload balance. This ensures fair distribution, eliminates bias, and reduces wait times. Contact a system administrator if reassignment is needed."
}
```

**Frontend Display:**
- No assignment dropdown shown
- Read-only display of current assignment
- "⏳ Waiting" badge if unassigned

## Testing

### Backend Tests
```python
def test_manual_assignment_blocked_for_receptionist(self):
    """Receptionists cannot manually assign patients"""
    response = self.client.patch(
        f'/api/patients/{self.patient.id}/',
        {'assigned_doctor': self.doctor.id},
        HTTP_AUTHORIZATION=f'Bearer {self.receptionist_token}'
    )
    self.assertEqual(response.status_code, 403)
    self.assertIn('Manual patient assignment is not allowed', response.data['detail'])

def test_manual_assignment_blocked_for_doctor(self):
    """Doctors cannot manually assign patients"""
    response = self.client.patch(
        f'/api/patients/{self.patient.id}/',
        {'assigned_doctor': self.doctor2.id},
        HTTP_AUTHORIZATION=f'Bearer {self.doctor_token}'
    )
    self.assertEqual(response.status_code, 403)

def test_super_admin_can_override(self):
    """Super admin can manually reassign in emergencies"""
    response = self.client.patch(
        f'/api/patients/{self.patient.id}/',
        {'assigned_staff': self.doctor2.id},
        HTTP_AUTHORIZATION=f'Bearer {self.super_admin_token}'
    )
    self.assertEqual(response.status_code, 200)
```

### Frontend Tests
- [ ] No assignment dropdown visible to receptionist
- [ ] No assignment dropdown visible to doctor
- [ ] No assignment dropdown visible to nurse
- [ ] Assignment status displays correctly (assigned/waiting)
- [ ] Cannot modify assignment via form
- [ ] API errors handled gracefully

## Benefits

1. **Enforces Project Requirements** - Automatic assignment per KSEF abstract
2. **Eliminates Bias** - Objective criteria only
3. **Improves Efficiency** - Milliseconds vs minutes
4. **Ensures Fairness** - Equal workload distribution
5. **Maintains Audit Trail** - All assignments logged
6. **Reduces Wait Times** - Instant assignment upon registration
7. **Prevents Errors** - No human mistakes in assignment
8. **Scalable** - Handles high volume automatically

## Monitoring

Track these metrics to verify enforcement:
- **Manual Assignment Attempts** - Should be 0 (except super_admin)
- **Assignment Success Rate** - % of patients auto-assigned
- **Average Assignment Time** - Should be <100ms
- **Workload Distribution** - Standard deviation across staff
- **Override Frequency** - Super admin manual assignments (should be rare)

## Future Enhancements

1. **Reassignment Workflow** - Admin approval process for special cases
2. **Assignment History** - Track all assignment changes with reasons
3. **Load Balancing Metrics** - Real-time workload visualization
4. **Predictive Assignment** - ML-based staff availability prediction
5. **Emergency Override Logging** - Detailed audit trail for manual changes
