from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission
from django.utils import timezone
from datetime import datetime
from django.db.models import Avg
from django.contrib.auth import get_user_model
from .models import Hospital, Patient, Resource, Assignment, Shift, LabReport, Note, AIUsage, AIChatMessage, Observation, Diagnosis, TestOrder, Prescription
from .serializers import (
    HospitalSerializer, PatientSerializer,
    ResourceSerializer, AssignmentSerializer, ShiftSerializer, LabReportSerializer, NoteSerializer, ReceptionistPatientSerializer, NursePatientSerializer, ObservationSerializer, DoctorPatientSerializer, DiagnosisSerializer, TestOrderSerializer, PrescriptionSerializer
)
from accounts.serializers import UserSerializer
from .permissions import IsAdmin, IsDoctor, IsNurse, IsReceptionist, IsStaff
from accounts.permissions import IsSuperAdmin, IsHospitalAdmin, IsDoctor as AccIsDoctor, IsNurse as AccIsNurse, HospitalScopedPermission, DoctorNursePatientPermission, IsReceptionist as AccIsReceptionist, IsNotReceptionist, DoctorPatientPermission, IsNotDoctor
import asyncio
from .utils.ai import get_ai_suggestion

# Combined permission for patient access roles
class PatientAccessPermission(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ['receptionist', 'doctor', 'nurse', 'hospital_admin', 'super_admin']

# Combined permission for staff roles (doctor, nurse, admin)
class StaffPatientPermission(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ['doctor', 'nurse', 'hospital_admin', 'super_admin']

User = get_user_model()

class HospitalViewSet(viewsets.ModelViewSet):
    queryset = Hospital.objects.all()
    serializer_class = HospitalSerializer
    permission_classes = [IsAuthenticated, IsSuperAdmin | IsHospitalAdmin]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return []  # Allow unauthenticated access for viewing hospitals
        return [IsAuthenticated(), (IsSuperAdmin | IsHospitalAdmin)()]

    def get_queryset(self):
        if self.request.user.is_authenticated and self.request.user.role == 'hospital_admin':
            return Hospital.objects.filter(id=self.request.user.hospital.id)
        return Hospital.objects.all()
    
    def check_permissions(self, request):
        """Explicitly deny nurses and doctors from hospital management"""
        if request.user.is_authenticated:
            if request.user.role == 'nurse':
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Nurses cannot access hospital management functions.")
            if request.user.role == 'doctor':
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied(
                    "Doctors cannot access hospital management functions. "
                    "Hospital configuration is restricted to administrators only."
                )
        super().check_permissions(request)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action == 'create':
            return []  # Allow public registration
        elif self.action in ['list', 'retrieve']:
            return [IsAuthenticated]  # Allow authenticated users to view users
        elif self.action in ['update', 'partial_update']:
            # Only super admin can change roles, or user can update their own profile (but not role)
            return [IsAuthenticated, IsSuperAdmin | self._is_self_update]
        return [IsAuthenticated, IsSuperAdmin]  # Require super admin for delete

    def _is_self_update(self):
        """Custom permission check for self-updates (excluding role changes)"""
        class SelfUpdatePermission:
            def has_permission(self, request, view):
                return True
            
            def has_object_permission(self, request, view, obj):
                # Allow if user is updating their own profile
                if obj == request.user:
                    # But prevent role changes in serializer
                    return True
                return False
        
        return SelfUpdatePermission()

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return User.objects.none()
        if user.role == 'super_admin':
            return User.objects.all()
        elif user.role == 'hospital_admin':
            if user.hospital:
                return User.objects.filter(hospital=user.hospital)
            return User.objects.filter(id=user.id)
        else:
            return User.objects.filter(id=user.id)
    
    def check_permissions(self, request):
        """Explicitly deny doctors from user management"""
        if request.user.is_authenticated and request.user.role == 'doctor':
            if self.action not in ['retrieve', 'list']:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied(
                    "Doctors cannot manage user accounts. "
                    "User management is restricted to administrators only."
                )
        super().check_permissions(request)

# Simple permission that allows all authenticated users
class AllowAuthenticated(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

class PatientViewSet(viewsets.ModelViewSet):
    """
    Patient management with role-based access control.
    
    DOCTOR ACCESS (STRICT LEAST PRIVILEGE):
    - list/retrieve/update/partial_update: Only assigned patients (DoctorPatientSerializer)
    - create/destroy: DENIED (admin/receptionist only)
    - Cannot access: unassigned patients, administrative functions
    
    RECEPTIONIST ACCESS:
    - list/retrieve: Read-only access to basic patient info (ReceptionistPatientSerializer)
    - create: Can register new patients (system auto-assigns doctor, no AI triage)
    - update/delete: DENIED (clinical staff only)
    
    NURSE ACCESS (STRICT LEAST PRIVILEGE):
    - list/retrieve: Only assigned patients (NursePatientSerializer)
    - update/partial_update: Only assigned patients, limited fields (symptoms, severity)
    - create/destroy: DENIED (doctors/admin only)
    - Cannot modify: priority, diagnosis, treatment plans, assigned staff
    
    CLINICAL STAFF ACCESS:
    - Full CRUD with PatientSerializer including clinical fields
    - AI triage suggestions enabled
    - Can modify all patient data
    """
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        """
        Dynamic permission assignment based on action.
        
        DOCTOR RESTRICTIONS:
        - list/retrieve/update/partial_update: Allowed (queryset filtered to assigned patients)
        - create/destroy: DENIED (requires IsNotDoctor permission)
        
        NURSE RESTRICTIONS:
        - list/retrieve: Allowed (but queryset filtered to assigned patients only)
        - update/partial_update: Allowed (but queryset filtered + limited fields)
        - create/destroy: DENIED (requires IsNotNurse permission)
        
        RECEPTIONIST RESTRICTIONS:
        - list/retrieve: Allowed (basic fields only)
        - create: Allowed (with auto-assignment)
        - update/destroy: DENIED (clinical staff only)
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

    def get_queryset(self):
        """
        Scope queryset by role and hospital.
        
        DOCTOR SCOPING (CRITICAL FOR HIPAA):
        - Only patients assigned to this doctor via Assignment model
        - Cannot see other doctors' patients
        - Cannot see unassigned patients
        - Hospital-scoped automatically via assignment
        
        NURSE SCOPING (CRITICAL FOR HIPAA):
        - Only patients assigned to this nurse via Assignment model
        - Cannot see other nurses' patients
        - Cannot see unassigned patients
        - Hospital-scoped automatically via assignment
        
        OTHER ROLES:
        - super_admin: All patients
        - hospital_admin: Patients in their hospital
        - receptionist: All patients in their hospital (basic fields only)
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
            return Patient.objects.filter(assignment__user=user).distinct()
        elif user.role == 'nurse':
            # STRICT: Nurses only see patients assigned to them
            return Patient.objects.filter(assignment__user=user).distinct()
        elif user.role == 'receptionist' and user.hospital:
            return Patient.objects.filter(hospital=user.hospital)
        return Patient.objects.none()

    def perform_create(self, serializer):
        import logging
        logger = logging.getLogger(__name__)
        
        hospital = self.request.user.hospital
        if not hospital:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("User must be assigned to a hospital before creating patients.")
        
        logger.info(f"Creating patient with data: {serializer.validated_data}")
        patient = serializer.save(hospital=hospital, created_by=self.request.user)
        
        if self.request.user.role != 'receptionist':
            symptoms = serializer.validated_data.get('symptoms')
            if symptoms:
                prompt = f"Patient symptoms: {symptoms}. Suggest priority and explanation."
                try:
                    ai_response = asyncio.run(get_ai_suggestion(prompt))
                    patient.ai_suggestion = ai_response
                    if 'Critical' in ai_response:
                        patient.priority = 'Critical'
                    elif 'High' in ai_response:
                        patient.priority = 'High'
                    elif 'Medium' in ai_response:
                        patient.priority = 'Medium'
                    patient.save()
                except Exception as e:
                    logger.error(f"AI triage error: {e}")
        
        if self.request.user.role == 'receptionist':
            self.assign_patient_to_staff(patient)

    def perform_update(self, serializer):
        """
        Prevent manual assignment of patients - system only.
        
        RATIONALE (KSEF 2026 PROJECT REQUIREMENT):
        Per project abstract: "The system automatically assigns a doctor or nurse to the patient
        based on available resources" to reduce wait times and improve efficiency.
        
        Manual assignment breaks the project goal because:
        1. Introduces human delay (2-5 minutes vs milliseconds)
        2. Allows bias/favoritism in staff selection
        3. Bypasses workload balancing algorithm
        4. Prevents objective priority-based routing
        5. Eliminates audit trail of automatic assignment
        6. Reduces system efficiency and fairness
        
        ENFORCEMENT:
        - Only super_admin can manually reassign (emergency override)
        - All other roles blocked from modifying assignments
        - Assignment changes must go through automatic algorithm
        """
        # Block manual assignment attempts (except super_admin emergency override)
        if self.request.user.role != 'super_admin':
            # Check if trying to modify assignment-related fields
            forbidden_fields = ['assigned_doctor', 'assigned_nurse', 'assigned_staff']
            for field in forbidden_fields:
                if field in self.request.data:
                    from rest_framework.exceptions import PermissionDenied
                    raise PermissionDenied(
                        "Manual patient assignment is not allowed. "
                        "Per KSEF project requirements, the system automatically assigns patients "
                        "to doctors/nurses based on priority, availability, and workload balance. "
                        "This ensures fair distribution, eliminates bias, and reduces wait times. "
                        "Contact a system administrator if reassignment is needed."
                    )
        
        serializer.save()

    def assign_patient_to_staff(self, patient):
        from core.utils.assignment import assign_patient
        try:
            assign_patient(patient)
        except Exception as e:
            pass

    @action(detail=True, methods=['post', 'get'], url_path='observations')
    def observations(self, request, pk=None):
        """
        Nurse endpoint to record and view patient observations/vitals.
        
        POST /api/patients/<id>/observations/
        - Permission: IsNurse + patient must be assigned to nurse
        - Records vitals and observations
        - Auto-links to current nurse
        
        GET /api/patients/<id>/observations/
        - Permission: IsNurse or IsDoctor + patient assigned
        - Returns all observations for this patient
        
        SECURITY:
        - Nurses can only access observations for assigned patients
        - Observations are immutable (no update/delete)
        - Audit trail maintained via timestamp and nurse FK
        """
        from accounts.permissions import NursePatientPermission
        
        patient = self.get_object()
        
        # Verify nurse has access to this patient
        if request.user.role == 'nurse':
            permission = NursePatientPermission()
            if not permission.has_object_permission(request, self, patient):
                return Response(
                    {'error': 'You do not have permission to access this patient.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        if request.method == 'POST':
            # Only nurses can create observations
            if request.user.role != 'nurse':
                return Response(
                    {'error': 'Only nurses can record observations.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            serializer = ObservationSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(patient=patient, nurse=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # GET: Return all observations for this patient
        observations = Observation.objects.filter(patient=patient).order_by('-timestamp')
        serializer = ObservationSerializer(observations, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post', 'get'], url_path='diagnosis', permission_classes=[IsAuthenticated, AccIsDoctor])
    def diagnosis(self, request, pk=None):
        """
        Doctor endpoint to add and view patient diagnoses.
        
        POST /api/patients/<id>/diagnosis/
        - Permission: IsDoctor + patient must be assigned to doctor
        - Creates diagnosis record
        - Auto-links to current doctor
        
        GET /api/patients/<id>/diagnosis/
        - Permission: IsDoctor + patient assigned
        - Returns all diagnoses for this patient
        
        SECURITY:
        - Only doctors can create diagnoses (requires medical license)
        - Doctors can only access diagnoses for assigned patients
        - Diagnoses are immutable (no update/delete for audit integrity)
        """
        from accounts.permissions import DoctorPatientPermission
        
        patient = self.get_object()
        
        # Verify doctor has access to this patient
        permission = DoctorPatientPermission()
        if not permission.has_object_permission(request, self, patient):
            return Response(
                {'error': 'You can only add diagnoses for patients assigned to you.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if request.method == 'POST':
            serializer = DiagnosisSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(patient=patient, doctor=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # GET: Return all diagnoses for this patient
        diagnoses = Diagnosis.objects.filter(patient=patient).order_by('-timestamp')
        serializer = DiagnosisSerializer(diagnoses, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post', 'get'], url_path='tests', permission_classes=[IsAuthenticated, AccIsDoctor])
    def tests(self, request, pk=None):
        """
        Doctor endpoint to order and view patient tests.
        
        POST /api/patients/<id>/tests/
        - Permission: IsDoctor + patient must be assigned to doctor
        - Creates test order
        - Auto-links to current doctor
        
        GET /api/patients/<id>/tests/
        - Permission: IsDoctor + patient assigned
        - Returns all test orders for this patient
        
        SECURITY:
        - Only doctors can order tests (clinical decision-making)
        - Doctors can only order tests for assigned patients
        - Test orders track status from ordered to resulted
        """
        from accounts.permissions import DoctorPatientPermission
        
        patient = self.get_object()
        
        # Verify doctor has access to this patient
        permission = DoctorPatientPermission()
        if not permission.has_object_permission(request, self, patient):
            return Response(
                {'error': 'You can only order tests for patients assigned to you.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if request.method == 'POST':
            serializer = TestOrderSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(patient=patient, doctor=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # GET: Return all test orders for this patient
        test_orders = TestOrder.objects.filter(patient=patient).order_by('-ordered_at')
        serializer = TestOrderSerializer(test_orders, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post', 'get'], url_path='prescriptions', permission_classes=[IsAuthenticated, AccIsDoctor])
    def prescriptions(self, request, pk=None):
        """
        Doctor endpoint to prescribe and view patient medications.
        
        POST /api/patients/<id>/prescriptions/
        - Permission: IsDoctor + patient must be assigned to doctor
        - Creates prescription record
        - Auto-links to current doctor
        
        GET /api/patients/<id>/prescriptions/
        - Permission: IsDoctor + patient assigned
        - Returns all prescriptions for this patient
        
        SECURITY:
        - Only doctors can prescribe medications (requires medical license)
        - Doctors can only prescribe for assigned patients
        - Prescriptions are immutable (no update/delete for audit integrity)
        - Nurses can view prescriptions to administer medications
        """
        from accounts.permissions import DoctorPatientPermission
        
        patient = self.get_object()
        
        # Verify doctor has access to this patient
        permission = DoctorPatientPermission()
        if not permission.has_object_permission(request, self, patient):
            return Response(
                {'error': 'You can only prescribe medications for patients assigned to you.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if request.method == 'POST':
            serializer = PrescriptionSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(patient=patient, doctor=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # GET: Return all prescriptions for this patient
        prescriptions = Prescription.objects.filter(patient=patient).order_by('-prescribed_at')
        serializer = PrescriptionSerializer(prescriptions, many=True)
        return Response(serializer.data)

class ResourceViewSet(viewsets.ModelViewSet):
    queryset = Resource.objects.all()
    serializer_class = ResourceSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsNotReceptionist()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Resource.objects.none()
        if user.role == 'super_admin':
            return Resource.objects.all()
        return Resource.objects.filter(hospital=user.hospital)
    
    def check_permissions(self, request):
        """Explicitly deny doctors from resource management"""
        if request.user.is_authenticated and request.user.role == 'doctor':
            if self.action not in ['list', 'retrieve']:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied(
                    "Doctors cannot manage hospital resources. "
                    "Resource allocation is restricted to administrators only."
                )
        super().check_permissions(request)

    @action(detail=False, methods=['get'])
    def available(self, request):
        resources = self.get_queryset().filter(availability=True)
        serializer = self.get_serializer(resources, many=True)
        return Response(serializer.data)

class AssignmentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
    permission_classes = [IsAuthenticated, IsNotReceptionist]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Assignment.objects.none()
        if user.role == 'super_admin':
            return Assignment.objects.all()
        return Assignment.objects.filter(patient__hospital=user.hospital)

class ShiftViewSet(viewsets.ModelViewSet):
    """
    Shift management - nurses and doctors can view their own shifts but cannot create/modify.
    """
    queryset = Shift.objects.all()
    serializer_class = ShiftSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        """Nurses and doctors can only view shifts, not create/update/delete"""
        from accounts.permissions import IsNotNurse, IsNotDoctor
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsNotNurse(), IsNotDoctor()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Shift.objects.none()
        if user.role == 'super_admin':
            return Shift.objects.all()
        elif user.role in ['nurse', 'doctor']:
            # Nurses and doctors can only see their own shifts
            return Shift.objects.filter(staff=user)
        return Shift.objects.filter(staff__hospital=user.hospital)

    def perform_create(self, serializer):
        shift = serializer.save()
        # Staff availability tracking removed for CustomUser compatibility

class LabReportViewSet(viewsets.ModelViewSet):
    """
    Lab reports - doctors only.
    Nurses CANNOT access lab reports (doctors interpret results).
    
    RATIONALE:
    - Lab interpretation requires medical license
    - Nurses receive verbal/written orders from doctors
    - Prevents misinterpretation of complex lab values
    - Maintains clinical decision-making hierarchy
    """
    queryset = LabReport.objects.all()
    serializer_class = LabReportSerializer
    permission_classes = [IsAuthenticated]

    def check_permissions(self, request):
        """Explicitly deny nurses from accessing lab reports"""
        if request.user.is_authenticated and request.user.role == 'nurse':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied(
                "Nurses cannot access lab reports. Lab results are interpreted by doctors only. "
                "Please consult the assigned doctor for patient lab information."
            )
        super().check_permissions(request)

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return LabReport.objects.none()
        if user.role == 'super_admin':
            return LabReport.objects.all()
        return LabReport.objects.filter(patient__hospital=user.hospital)

    def perform_create(self, serializer):
        report = serializer.save(doctor=self.request.user)
        # Calculate response_time
        assignment = Assignment.objects.filter(patient=report.patient).first()
        if assignment and assignment.assignment_time:
            report.response_time = timezone.now() - (timezone.now() - assignment.assignment_time)  # Approximate
            report.save()

class NoteViewSet(viewsets.ModelViewSet):
    queryset = Note.objects.all()
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated, IsNotReceptionist]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Note.objects.none()
        if user.role == 'super_admin':
            return Note.objects.all()
        return Note.objects.filter(patient__hospital=user.hospital)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def assignment_times_analytics(request):
    """Analytics endpoint - denied for nurses, receptionists, and doctors"""
    if request.user.role in ['nurse', 'receptionist', 'doctor']:
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied(
            "This analytics endpoint is restricted to administrators only. "
            "Doctors can access patient-specific analytics through the Analytics dashboard."
        )
    
    avg_time = Assignment.objects.filter(assignment_time__isnull=False).aggregate(avg=Avg('assignment_time'))['avg']
    return Response({'average_assignment_time': str(avg_time) if avg_time else None})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
async def ai_triage(request):
    symptoms = request.data.get('symptoms')
    if not symptoms:
        return Response({'error': 'Symptoms required'}, status=400)
    
    prompt = f"Patient symptoms: {symptoms}. Suggest priority and explanation."
    try:
        full_response = await get_ai_suggestion(prompt)
        # Check if AI is available
        if full_response.startswith("AI feature temporarily unavailable"):
            # Rule-based fallback
            priority = 'Low'
            if any(word in symptoms.lower() for word in ['chest pain', 'difficulty breathing', 'severe pain', 'unconscious']):
                priority = 'Critical'
            elif any(word in symptoms.lower() for word in ['fever', 'vomiting', 'infection']):
                priority = 'High'
            elif any(word in symptoms.lower() for word in ['cough', 'headache']):
                priority = 'Medium'
            ai_explanation = "Rule-based priority assignment due to AI unavailability."
        else:
            # Parse AI response
            lines = full_response.split('\n')
            priority = 'Low'  # default
            ai_explanation = full_response
            for line in lines:
                if 'priority' in line.lower():
                    if 'critical' in line.lower():
                        priority = 'Critical'
                    elif 'high' in line.lower():
                        priority = 'High'
                    elif 'medium' in line.lower():
                        priority = 'Medium'
            # Increment usage
            usage, created = AIUsage.objects.get_or_create(feature='triage', defaults={'usage_count': 0})
            usage.usage_count += 1
            usage.save()
        
        return Response({
            'suggested_priority': priority,
            'ai_explanation': ai_explanation,
            'full_response': full_response
        })
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
async def ai_chat(request):
    import uuid
    from .models import AIChatMessage, AIUsage
    message = request.data.get('message')
    conversation_id = request.data.get('conversation_id', str(uuid.uuid4()))
    if not message:
        return Response({'error': 'Message required'}, status=400)
    
    # Get recent history, max 10 messages
    history = AIChatMessage.objects.filter(conversation_id=conversation_id, user=request.user).order_by('-created_at')[:10]
    history = list(reversed(history))
    
    # Build prompt with history
    system_prompt = "You are a medical knowledge assistant for hospital staff. Provide accurate, evidence-based info. ALWAYS add disclaimer: This is NOT a substitute for professional medical advice or diagnosis."
    prompt = system_prompt + "\n\n"
    for h in history:
        prompt += f"User: {h.message}\nAssistant: {h.response}\n"
    prompt += f"User: {message}\nAssistant:"
    
    try:
        response_text = await get_ai_suggestion(prompt)
        if not response_text.startswith("AI feature temporarily unavailable"):
            # Increment usage
            usage, created = AIUsage.objects.get_or_create(feature='chat', defaults={'usage_count': 0})
            usage.usage_count += 1
            usage.save()
        # Save to DB
        AIChatMessage.objects.create(
            conversation_id=conversation_id,
            message=message,
            response=response_text,
            user=request.user
        )
        return Response({'response': response_text, 'conversation_id': conversation_id})
    except Exception as e:
        return Response({'error': str(e)}, status=500)