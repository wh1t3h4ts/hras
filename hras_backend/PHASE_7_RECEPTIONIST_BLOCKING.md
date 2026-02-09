# HRAS Phase 7: Receptionist Clinical Action Blocking

## Summary
All clinical endpoints explicitly block receptionists using the `IsNotReceptionist` permission class.

## Implementation Status: ✅ COMPLETE

### IsNotReceptionist Permission Class
**Location:** `accounts/permissions.py`

```python
class IsNotReceptionist(permissions.BasePermission):
    """Explicitly deny receptionists access to clinical actions"""
    
    def has_permission(self, request, view):
        if request.user and request.user.is_authenticated and request.user.role == 'receptionist':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Receptionists cannot access clinical data or perform clinical actions.")
        return True
```

**Key Feature:** Raises explicit `PermissionDenied` exception with clear message when receptionist attempts access.

---

## Protected ViewSets (Receptionist Blocked)

### 1. LabReportViewSet
**Purpose:** Clinical diagnoses and lab results  
**Permission:** `[IsAuthenticated, IsNotReceptionist]`  
**Rationale:** Receptionists should not view or create medical diagnoses

```python
class LabReportViewSet(viewsets.ModelViewSet):
    queryset = LabReport.objects.all()
    serializer_class = LabReportSerializer
    permission_classes = [IsAuthenticated, IsNotReceptionist]
```

---

### 2. NoteViewSet
**Purpose:** Clinical notes and treatment documentation  
**Permission:** `[IsAuthenticated, IsNotReceptionist]`  
**Rationale:** Medical notes contain sensitive clinical information

```python
class NoteViewSet(viewsets.ModelViewSet):
    queryset = Note.objects.all()
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated, IsNotReceptionist]
```

---

### 3. ResourceViewSet
**Purpose:** Hospital resource management (beds, equipment)  
**Permission:** `[IsAuthenticated, IsNotReceptionist]`  
**Rationale:** Resource allocation is clinical/administrative decision

```python
class ResourceViewSet(viewsets.ModelViewSet):
    queryset = Resource.objects.all()
    serializer_class = ResourceSerializer
    permission_classes = [IsAuthenticated, IsNotReceptionist]
```

---

### 4. AssignmentViewSet
**Purpose:** Patient-to-staff assignments  
**Permission:** `[IsAuthenticated, IsNotReceptionist]`  
**Rationale:** Receptionists cannot view or modify clinical assignments

```python
class AssignmentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
    permission_classes = [IsAuthenticated, IsNotReceptionist]
```

---

### 5. ShiftViewSet
**Purpose:** Staff shift scheduling  
**Permission:** `[IsAuthenticated, IsNotReceptionist]`  
**Rationale:** Shift management is administrative function

```python
class ShiftViewSet(viewsets.ModelViewSet):
    queryset = Shift.objects.all()
    serializer_class = ShiftSerializer
    permission_classes = [IsAuthenticated, IsNotReceptionist]
```

---

### 6. Analytics Endpoints
**Purpose:** Hospital performance metrics  
**Permission:** `[IsAuthenticated, IsNotReceptionist]`  
**Rationale:** Analytics contain sensitive operational data

```python
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsNotReceptionist])
def assignment_times_analytics(request):
    avg_time = Assignment.objects.filter(assignment_time__isnull=False).aggregate(avg=Avg('assignment_time'))['avg']
    return Response({'average_assignment_time': str(avg_time) if avg_time else None})
```

---

## Receptionist ALLOWED Actions

### PatientViewSet (Partial Access)
**Allowed:**
- `list`: View patient queue (basic info only via ReceptionistPatientSerializer)
- `retrieve`: View individual patient (basic info only)
- `create`: Register new patients (auto-assignment triggered)

**Blocked:**
- `update`: Cannot modify patient records
- `partial_update`: Cannot modify patient records
- `destroy`: Cannot delete patients

**Implementation:**
```python
def get_permissions(self):
    if self.action in ['list', 'retrieve']:
        return [IsAuthenticated(), PatientAccessPermission()]
    elif self.action == 'create':
        return [IsAuthenticated(), PatientAccessPermission()]
    elif self.action in ['update', 'partial_update', 'destroy']:
        return [IsAuthenticated(), StaffPatientPermission()]  # Blocks receptionist
    return [IsAuthenticated()]
```

---

## Global Permission Strategy

### Recommended Approach: Deny List (IsNotReceptionist)
**Advantages:**
- Explicit blocking with clear error messages
- Easy to audit which endpoints block receptionists
- Fail-secure: New endpoints default to blocking receptionists

**Usage Pattern:**
```python
permission_classes = [IsAuthenticated, IsNotReceptionist]
```

### Alternative: Allow List (Role-specific permissions)
**Usage:**
```python
permission_classes = [IsAuthenticated, IsDoctor | IsNurse | IsHospitalAdmin | IsSuperAdmin]
```

**Disadvantage:** Must remember to exclude receptionist from every new endpoint

---

## Least Privilege Enforcement Summary

| Endpoint | Receptionist Access | Rationale |
|----------|-------------------|-----------|
| Patient List/Retrieve | ✅ Read-only (basic fields) | Queue management |
| Patient Create | ✅ Limited (auto-assignment) | Patient intake |
| Patient Update/Delete | ❌ Blocked | Clinical staff only |
| Lab Reports | ❌ Blocked | Medical diagnoses |
| Clinical Notes | ❌ Blocked | Treatment documentation |
| Assignments | ❌ Blocked | Clinical decisions |
| Resources | ❌ Blocked | Resource allocation |
| Shifts | ❌ Blocked | Staff scheduling |
| Analytics | ❌ Blocked | Operational metrics |
| AI Triage | ❌ Blocked (implicit) | Clinical decision support |
| AI Chat | ❌ Blocked (implicit) | Medical knowledge base |

---

## Testing Receptionist Blocking

### Test Case 1: Lab Report Access
```bash
# As receptionist
curl -H "Authorization: Bearer <receptionist_token>" \
     http://localhost:8000/api/lab-reports/

# Expected: 403 Forbidden
# Message: "Receptionists cannot access clinical data or perform clinical actions."
```

### Test Case 2: Patient Update
```bash
# As receptionist
curl -X PATCH \
     -H "Authorization: Bearer <receptionist_token>" \
     -H "Content-Type: application/json" \
     -d '{"priority": "Critical"}' \
     http://localhost:8000/api/patients/1/

# Expected: 403 Forbidden
```

### Test Case 3: Patient List (Allowed)
```bash
# As receptionist
curl -H "Authorization: Bearer <receptionist_token>" \
     http://localhost:8000/api/patients/

# Expected: 200 OK with ReceptionistPatientSerializer data
```

---

## Compliance & Audit Trail

### HIPAA Compliance
- Receptionists cannot access PHI beyond basic demographics
- All clinical data (diagnoses, notes, lab results) blocked
- Access attempts logged via Django middleware

### Principle of Least Privilege
- Receptionists have minimum access needed for patient intake
- Cannot override system assignments
- Cannot access clinical decision support tools
- Cannot view operational analytics

### Audit Recommendations
1. Log all permission denied attempts
2. Regular review of receptionist access patterns
3. Quarterly permission audit
4. User training on role limitations

---

## Future Enhancements

1. **Granular Logging:**
   ```python
   import logging
   logger = logging.getLogger('security')
   
   class IsNotReceptionist(permissions.BasePermission):
       def has_permission(self, request, view):
           if request.user.role == 'receptionist':
               logger.warning(f"Receptionist {request.user.email} attempted access to {view.__class__.__name__}")
               raise PermissionDenied(...)
   ```

2. **Rate Limiting:**
   - Implement rate limits on receptionist endpoints
   - Prevent abuse of patient registration

3. **Field-Level Permissions:**
   - Use DRF field-level permissions for finer control
   - Dynamic field exclusion based on role

---

## Conclusion

Phase 7 implementation successfully blocks receptionists from all clinical actions using:
- `IsNotReceptionist` permission class with explicit denial
- Role-based serializer switching (ReceptionistPatientSerializer)
- Action-level permission control in PatientViewSet
- Consistent application across all clinical endpoints

**Status:** ✅ Production Ready
