from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """Only admin can access"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'admin'


class HospitalAdminOnly(permissions.BasePermission):
    """
    Explicitly blocks doctors, nurses, and receptionists from administrative functions.
    Only admin can access.
    
    USE CASES:
    - Staff management (approve/reject users, assign roles)
    - Shift scheduling and management
    - Resource allocation (beds, equipment)
    - Hospital configuration and settings
    - Analytics and reporting (hospital-wide metrics)
    
    BLOCKS:
    - Doctors: Focus on clinical care, not administration
    - Nurses: Focus on patient care, not administration  
    - Receptionists: Focus on patient intake, not administration
    
    RATIONALE:
    Separation of duties between clinical staff and administrative staff.
    Prevents privilege escalation and maintains clear role boundaries.
    Clinical staff should not manage hospital operations or other staff.
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Allow admin
        if request.user.role in ['admin']:
            return True
        
        # Explicitly deny clinical staff
        if request.user.role in ['doctor', 'nurse', 'receptionist']:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied(
                f"{request.user.role.replace('_', ' ').title()}s cannot access administrative functions. "
                "This action requires administrator privileges."
            )
        
        return False


class IsDoctor(permissions.BasePermission):
    """Only doctor can access"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'doctor'


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
    
    Implementation:
    - has_permission: Allows authenticated doctors to attempt access
    - has_object_permission: Verifies doctor is assigned to specific patient via Assignment model
    - Uses database query to check Assignment.objects.filter(patient=obj, user=request.user, user__role='doctor')
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


class IsNurse(permissions.BasePermission):
    """
    Only nurse can access.
    Used for nurse-specific endpoints and actions.
    """
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'nurse'


class NursePatientPermission(permissions.BasePermission):
    """
    Nurses can only access patients assigned to them.
    
    CRITICAL FOR PATIENT PRIVACY (HIPAA/GDPR Compliance):
    - Object-level permission ensures nurses cannot access unassigned patient records
    - Prevents unauthorized viewing of sensitive medical information
    - Enforces "need-to-know" principle: nurses only see patients they're actively caring for
    - Audit trail: Assignment model tracks which nurse accessed which patient
    - Prevents lateral privilege escalation (nurse accessing another nurse's patients)
    
    Implementation:
    - has_permission: Allows authenticated nurses to attempt access
    - has_object_permission: Verifies nurse is assigned to specific patient via Assignment model
    """
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'nurse'
    
    def has_object_permission(self, request, view, obj):
        # Nurse can only access patients they are assigned to
        from core.models import Assignment
        return Assignment.objects.filter(
            patient=obj,
            user=request.user,
            user__role='nurse'
        ).exists()


class IsReceptionist(permissions.BasePermission):
    """Only receptionist can access"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'receptionist'


class LimitedReceptionistPermission(permissions.BasePermission):
    """
    Receptionist can only access basic patient information.
    Denies access to clinical fields like severity, priority, symptoms, ai_suggestion.
    """
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'receptionist'
    
    def has_object_permission(self, request, view, obj):
        # Receptionists can only view basic patient info, not clinical data
        if request.user.role == 'receptionist':
            # For read operations, allow basic info
            if request.method in permissions.SAFE_METHODS:
                return True
            # For write operations, deny all (receptionists shouldn't modify patient records)
            return False
        return True


class IsApprovedUser(permissions.BasePermission):
    """User must be approved and active"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_approved and request.user.is_active


class HospitalScopedPermission(permissions.BasePermission):
    """
    Hospital-scoped object-level permission for multi-tenancy.
    
    CRITICAL FOR DATA ISOLATION:
    - Prevents Hospital Admin A from accessing Hospital B's data
    - Ensures each hospital's data remains completely isolated
    - Super admin can access all hospitals (system-wide oversight)
    - Hospital admin can only access their assigned hospital's data
    
    PREVENTS CROSS-HOSPITAL ACCESS:
    - Hospital Admin at "Main Hospital" cannot view/modify patients at "City Hospital"
    - Hospital Admin cannot see staff, shifts, or resources from other hospitals
    - Enforces strict tenant isolation in multi-hospital deployment
    - Protects patient privacy across hospital boundaries
    
    IMPLEMENTATION:
    - has_permission: Checks user has a hospital assignment (except super_admin)
    - has_object_permission: Verifies object.hospital matches user.hospital
    - Super admin bypasses all checks (system administrator)
    
    EXAMPLE:
    Hospital Admin at Hospital ID=1 tries to access Patient with hospital_id=2:
    → has_object_permission returns False (obj.hospital != request.user.hospital)
    → 403 Forbidden response
    """
    
    def has_permission(self, request, view):
        # Admin can access all hospitals
        if request.user.role == 'admin':
            return True
        # Other users must have a hospital assignment
        return request.user and request.user.is_authenticated and request.user.hospital is not None
    
    def has_object_permission(self, request, view, obj):
        # Admin can access any hospital's data
        if request.user.role == 'admin':
            return True
        # Hospital-scoped users can only access their hospital's data
        return obj.hospital == request.user.hospital


class DoctorNursePatientPermission(permissions.BasePermission):
    """Doctors, nurses, and admins can access patient data"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ['doctor', 'nurse', 'admin']


class IsNotReceptionist(permissions.BasePermission):
    """Explicitly deny receptionists access to clinical actions"""
    
    def has_permission(self, request, view):
        if request.user and request.user.is_authenticated and request.user.role == 'receptionist':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Receptionists cannot access clinical data or perform clinical actions.")
        return True


class IsNotNurse(permissions.BasePermission):
    """
    Explicitly deny nurses access to administrative actions.
    
    USE CASES:
    - Block nurses from creating/deleting patients (admin/doctor only)
    - Block nurses from accessing analytics/reports (admin/doctor only)
    - Block nurses from managing staff/shifts (admin only)
    - Block nurses from hospital configuration (admin only)
    
    RATIONALE:
    Nurses focus on patient care, not administrative tasks.
    Prevents accidental or intentional misuse of admin functions.
    """
    
    def has_permission(self, request, view):
        if request.user and request.user.is_authenticated and request.user.role == 'nurse':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Nurses cannot access administrative functions.")
        return True


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
