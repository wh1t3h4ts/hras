from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from .models import Hospital, Patient, Resource, Assignment, Shift, LabReport, Note, Observation, Diagnosis, TestOrder, Prescription

User = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Check if user is approved and active
        if not self.user.is_approved or not self.user.is_active:
            raise serializers.ValidationError("Account is not approved or inactive.")
        
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'role': self.user.role,
            'hospital': {
                'id': self.user.hospital.id,
                'name': self.user.hospital.name
            } if self.user.hospital else None
        }
        return data

class HospitalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hospital
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'password', 'first_name', 'last_name', 'role', 'is_approved', 'is_active', 'hospital', 'hospital_name', 'date_joined']
        extra_kwargs = {
            'password': {'write_only': True},
            'is_approved': {'read_only': True},
            'is_active': {'read_only': True},
        }

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user
    
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

class PatientSerializer(serializers.ModelSerializer):
    """
    Full patient serializer with automatic assignment enforcement.
    
    ASSIGNMENT FIELDS (READ-ONLY):
    - assigned_staff: Computed from Assignment model (system-assigned only)
    - assignment_time: Time from admission to assignment (system-tracked)
    
    RATIONALE:
    Per KSEF 2026 project requirements, patient assignment must be automatic
    to ensure fair distribution, eliminate bias, and reduce wait times.
    Manual assignment is blocked for all users except super_admin (emergency override).
    """
    assigned_staff = serializers.SerializerMethodField(read_only=True)
    assignment_time = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Patient
        fields = '__all__'
        read_only_fields = ['hospital', 'created_by', 'admission_date', 'assigned_staff', 'assignment_time']

    def get_assigned_staff(self, obj):
        assignment = Assignment.objects.filter(patient=obj).first()
        if assignment and assignment.user:
            return {
                'id': assignment.user.id,
                'name': assignment.user.get_full_name(),
                'role': assignment.user.role,
            }
        return None

    def get_assignment_time(self, obj):
        assignment = Assignment.objects.filter(patient=obj).first()
        return assignment.assignment_time if assignment else None
    
    def validate(self, data):
        """
        Block manual assignment attempts at serializer level.
        
        This is a defense-in-depth measure - view-level checks are primary,
        but serializer validation provides additional protection.
        """
        request = self.context.get('request')
        if request and request.user.role != 'super_admin':
            # Ensure no assignment-related fields in data
            forbidden_fields = ['assigned_doctor', 'assigned_nurse', 'assigned_staff']
            for field in forbidden_fields:
                if field in data:
                    raise serializers.ValidationError({
                        field: "Manual patient assignment is not allowed. System assigns automatically."
                    })
        return data

class ResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resource
        fields = '__all__'

class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = '__all__'

class ShiftSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shift
        fields = ['id', 'staff', 'start_time', 'end_time', 'location']
        read_only_fields = ['id']

class LabReportSerializer(serializers.ModelSerializer):
    response_time = serializers.SerializerMethodField()

    class Meta:
        model = LabReport
        fields = '__all__'

    def get_response_time(self, obj):
        if obj.response_time:
            return obj.response_time
        return None

class NoteSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    created_by_role = serializers.CharField(source='created_by.role', read_only=True)

    class Meta:
        model = Note
        fields = ['id', 'patient', 'created_by', 'created_by_name', 'created_by_role', 'note_type', 'text', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by', 'created_by_name', 'created_by_role']


class ReceptionistPatientSerializer(serializers.ModelSerializer):
    """
    Restricted serializer for receptionists implementing least privilege principle.
    
    INCLUDED FIELDS (Basic Patient Data):
    - id, name, age, telephone, emergency_contact: Basic demographics
    - symptoms, severity, priority: Initial triage information
    - admission_date: When patient arrived
    - assigned_staff: Read-only, system-assigned doctor or nurse
    - status: Read-only, derived from priority
    
    EXCLUDED FIELDS (Clinical/Sensitive Data):
    - ai_suggestion: AI-generated clinical recommendations (clinical staff only)
    - diagnosis: Medical diagnosis (doctors only)
    - lab_reports: Laboratory test results (clinical staff only)
    - notes: Clinical notes and treatment plans (clinical staff only)
    - treatment: Treatment details (clinical staff only)
    - hospital: Auto-assigned from receptionist's hospital
    - created_by: Auto-set to current user
    
    RATIONALE:
    Receptionists handle patient intake and queue management but should not
    access clinical decisions, diagnoses, or treatment information per HIPAA
    and principle of least privilege.
    """
    assigned_staff = serializers.SerializerMethodField(read_only=True)
    status = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Patient
        fields = [
            'id', 'name', 'age', 'telephone', 'emergency_contact',
            'symptoms', 'severity', 'priority', 'admission_date',
            'assigned_staff', 'status'
        ]
        read_only_fields = ['id', 'admission_date', 'assigned_staff', 'status']

    def get_assigned_staff(self, obj):
        """Return basic info about assigned staff (doctor or nurse)"""
        assignment = Assignment.objects.filter(patient=obj).first()
        if assignment:
            return {
                'id': assignment.user.id,
                'name': assignment.user.get_full_name(),
                'role': assignment.user.role,
            }
        return None

    def get_status(self, obj):
        """Derive patient status from priority level"""
        priority_status_map = {
            'Critical': 'Urgent',
            'High': 'Priority',
            'Medium': 'Waiting',
            'Low': 'Queued'
        }
        return priority_status_map.get(obj.priority, 'Queued')


class NursePatientSerializer(serializers.ModelSerializer):
    """
    Restricted serializer for nurses implementing least privilege principle.
    
    INCLUDED FIELDS (Care-Related Data):
    - id, name, age, admission_date: Basic patient identification
    - assigned_nurse, assigned_doctor: Care team information
    - priority: Patient urgency level (read-only for nurses)
    - symptoms: Patient complaints and observations
    - severity: Current condition severity
    - telephone, emergency_contact: Contact information for emergencies
    
    EXCLUDED FIELDS (Protected Clinical Decision-Making):
    - ai_suggestion: AI triage recommendations (doctors only - clinical decision support)
    - diagnosis: Final medical diagnosis (doctors only - requires medical license)
    - lab_reports: Full laboratory results (doctors interpret, nurses see summaries only)
    - prescriptions: Medication orders (doctors prescribe, nurses administer per orders)
    - discharge_notes: Final discharge summary (doctors only - legal document)
    - billing: Financial information (admin only - not relevant to patient care)
    - treatment_plan: Overall treatment strategy (doctors create, nurses execute)
    
    READ-ONLY FIELDS FOR NURSES:
    - priority: Set by doctors/triage, nurses cannot override urgency
    - assigned_doctor: Staff assignments controlled by admin/system
    - admission_date: Historical data, cannot be modified
    
    RATIONALE FOR RESTRICTIONS:
    1. Scope of Practice: Nurses provide care per doctor's orders, not independent diagnosis
    2. Legal Liability: Diagnosis/prescriptions require medical license (MD/DO)
    3. Clinical Hierarchy: Treatment decisions flow from doctors to nurses
    4. HIPAA Minimum Necessary: Nurses access only data needed for direct patient care
    5. Audit Compliance: Clear separation of clinical decision-making roles
    
    NURSE CAPABILITIES:
    - View assigned patients only (via NursePatientPermission)
    - Update symptoms/observations during care
    - View care team assignments
    - Access emergency contact information
    - Cannot modify clinical decisions (priority, diagnosis, treatment)
    """
    assigned_nurse = serializers.SerializerMethodField(read_only=True)
    assigned_doctor = serializers.SerializerMethodField(read_only=True)
    status = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Patient
        fields = [
            'id', 'name', 'age', 'admission_date',
            'assigned_nurse', 'assigned_doctor',
            'priority', 'severity', 'symptoms',
            'telephone', 'emergency_contact',
            'status'
        ]
        read_only_fields = [
            'id', 'admission_date', 'assigned_nurse', 'assigned_doctor',
            'priority', 'status', 'name', 'age'
        ]

    def validate(self, data):
        """
        Validate that nurses cannot modify restricted fields.
        
        BLOCKED FIELDS FOR NURSES:
        - priority: Clinical decision by doctors/triage
        - name, age: Demographics (admin/receptionist only)
        - Any field not in allowed list
        
        ALLOWED UPDATES:
        - symptoms: Nurses can update patient complaints/observations
        - severity: Nurses can update current condition assessment
        - telephone, emergency_contact: Contact info updates
        """
        request = self.context.get('request')
        if request and request.user.role == 'nurse':
            # List of fields nurses are NOT allowed to update
            forbidden_fields = ['priority', 'name', 'age', 'admission_date', 'hospital', 'created_by']
            
            for field in forbidden_fields:
                if field in data:
                    raise serializers.ValidationError({
                        field: f"Nurses cannot modify the '{field}' field. This requires doctor or administrator authorization."
                    })
        
        return data

    def update(self, instance, validated_data):
        """
        Update patient with nurse-allowed fields only.
        Double-check that restricted fields are not modified.
        """
        request = self.context.get('request')
        if request and request.user.role == 'nurse':
            # Ensure priority is never changed by nurses
            if 'priority' in validated_data:
                validated_data.pop('priority')
            # Ensure name/age are never changed by nurses
            if 'name' in validated_data:
                validated_data.pop('name')
            if 'age' in validated_data:
                validated_data.pop('age')
        
        return super().update(instance, validated_data)

    def get_assigned_nurse(self, obj):
        """Return nurse assigned to this patient"""
        assignment = Assignment.objects.filter(patient=obj, user__role='nurse').first()
        if assignment:
            return {
                'id': assignment.user.id,
                'name': assignment.user.get_full_name(),
            }
        return None

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
            'Critical': 'Urgent',
            'High': 'Priority',
            'Medium': 'Stable',
            'Low': 'Routine'
        }
        return priority_status_map.get(obj.priority, 'Unknown')


class ObservationSerializer(serializers.ModelSerializer):
    """
    Serializer for nurse observations and vital signs.
    
    NURSE WORKFLOW:
    - Nurses record vitals during patient rounds
    - Auto-links to recording nurse (set in view)
    - Timestamped automatically
    - Immutable after creation (no updates/deletes)
    
    FIELDS:
    - patient: Auto-set from URL parameter
    - nurse: Auto-set from request.user
    - timestamp: Auto-generated
    - Vitals: BP, temp, pulse, respiratory rate, SpO2
    - notes: Free-text observations
    """
    nurse_name = serializers.CharField(source='nurse.get_full_name', read_only=True)
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    
    class Meta:
        model = Observation
        fields = [
            'id', 'patient', 'patient_name', 'nurse', 'nurse_name', 'timestamp',
            'blood_pressure_systolic', 'blood_pressure_diastolic',
            'temperature', 'pulse', 'respiratory_rate', 'oxygen_saturation',
            'notes'
        ]
        read_only_fields = ['id', 'patient', 'nurse', 'timestamp', 'patient_name', 'nurse_name']


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
    - hospital: Hospital assignment (admin only - doctors work at assigned hospital)
    - created_by: User who created record (admin/receptionist - not clinically relevant)
    - billing information: Financial data (admin/billing department only)
    - resource allocation: Bed/equipment assignment (admin only)
    - shift scheduling: Staff scheduling (admin only)
    - user management: Staff accounts (admin only)
    - hospital configuration: System settings (admin only)
    
    READ-ONLY FIELDS FOR DOCTORS:
    - id, admission_date: Historical data, cannot be modified
    - assigned_doctor: Staff assignments controlled by admin/system
    - observations: Nurse vitals (doctors read, nurses write)
    - status: Derived field
    
    DOCTOR CAPABILITIES:
    - View assigned patients only (via DoctorPatientPermission)
    - Update clinical fields: symptoms, priority, severity, ai_suggestion
    - Create/view lab reports and clinical notes
    - View nurse observations and vitals
    - Update patient demographics: name, age, telephone, emergency_contact
    - Cannot access administrative functions (hospital management, user accounts, billing)
    
    RATIONALE FOR RESTRICTIONS:
    1. Scope of Practice: Doctors focus on clinical care, not administration
    2. Separation of Duties: Clinical vs. administrative responsibilities
    3. HIPAA Minimum Necessary: Access only data needed for patient treatment
    4. Audit Compliance: Clear boundaries between clinical and administrative roles
    5. Security: Prevents privilege escalation to administrative functions
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



class DiagnosisSerializer(serializers.ModelSerializer):
    """Serializer for doctor diagnoses"""
    doctor_name = serializers.CharField(source='doctor.get_full_name', read_only=True)
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    
    class Meta:
        model = Diagnosis
        fields = ['id', 'patient', 'patient_name', 'doctor', 'doctor_name', 'diagnosis_text', 'timestamp']
        read_only_fields = ['id', 'patient', 'doctor', 'timestamp', 'patient_name', 'doctor_name']


class TestOrderSerializer(serializers.ModelSerializer):
    """Serializer for doctor test orders"""
    doctor_name = serializers.CharField(source='doctor.get_full_name', read_only=True)
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    
    class Meta:
        model = TestOrder
        fields = ['id', 'patient', 'patient_name', 'doctor', 'doctor_name', 'test_type', 'status', 'notes', 'ordered_at', 'updated_at']
        read_only_fields = ['id', 'patient', 'doctor', 'ordered_at', 'updated_at', 'patient_name', 'doctor_name']


class PrescriptionSerializer(serializers.ModelSerializer):
    """Serializer for doctor prescriptions"""
    doctor_name = serializers.CharField(source='doctor.get_full_name', read_only=True)
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    
    class Meta:
        model = Prescription
        fields = ['id', 'patient', 'patient_name', 'doctor', 'doctor_name', 'medication', 'dosage', 'frequency', 'duration', 'instructions', 'prescribed_at']
        read_only_fields = ['id', 'patient', 'doctor', 'prescribed_at', 'patient_name', 'doctor_name']


class HospitalAdminHospitalSerializer(serializers.ModelSerializer):
    """
    Restricted serializer for hospital admins managing their hospital.
    
    Hospital admins can view and edit basic hospital information but cannot modify
    critical operational data that should be controlled by super admins.
    
    INCLUDED FIELDS (Editable by Hospital Admin):
    - name: Hospital name
    - address: Hospital address  
    - beds: Number of beds
    - ots: Operating theaters
    - specialties: Medical specialties offered
    
    READ-ONLY FIELDS:
    - id: Auto-generated identifier
    - created_at: Audit timestamp (not implemented in current model)
    
    EXCLUDED FIELDS:
    - No global permissions or system-level settings
    - Hospital admins are restricted to their own hospital only
    """
    
    class Meta:
        model = Hospital
        fields = ['id', 'name', 'address', 'beds', 'ots', 'specialties']
        read_only_fields = ['id']


class HospitalAdminStaffSerializer(serializers.ModelSerializer):
    """
    Restricted serializer for hospital admins managing staff at their hospital.
    
    Hospital admins can view and manage staff accounts within their hospital
    but cannot access sensitive authentication data or global permissions.
    
    INCLUDED FIELDS:
    - id: Staff member identifier
    - name: Full name (first_name + last_name)
    - email: Email address for login
    - role: Job role (doctor/nurse/receptionist)
    - is_active: Account active status
    
    EXCLUDED FIELDS (Security & Privacy):
    - password: Never exposed in API responses (hashed storage only)
    - is_superuser: Global superuser permissions (super_admin only)
    - is_staff: Django staff status (internal framework permission)
    - is_approved: Approval status (managed by super_admin)
    - date_joined: Account creation timestamp (audit data)
    - hospital: Auto-assigned to admin's hospital
    
    RATIONALE FOR EXCLUSIONS:
    1. Password: Security risk - passwords are hashed and should never be exposed
    2. Global permissions (is_superuser, is_staff): Hospital admins cannot grant system-wide access
    3. Sensitive audit data: Creation timestamps and approval status are controlled by super admins
    """
    name = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'role', 'is_active']
    
    def get_name(self, obj):
        """Return full name of staff member"""
        return obj.get_full_name()
