from django.db import models
from simple_history.models import HistoricalRecords

class Hospital(models.Model):
    name = models.CharField(max_length=100)
    address = models.TextField()
    beds = models.IntegerField()
    ots = models.IntegerField()  # Operating Theaters
    specialties = models.TextField()  # List of specialties
    
    # Audit trail for hospital configuration changes
    historical_records = HistoricalRecords()

    def __str__(self):
        return self.name

class Patient(models.Model):
    name = models.CharField(max_length=100)
    age = models.IntegerField(default=0)
    admission_date = models.DateField(auto_now_add=True)
    severity = models.CharField(max_length=50, default='Unknown')
    priority = models.CharField(max_length=20, choices=[('Low', 'Low'), ('Medium', 'Medium'), ('High', 'High'), ('Critical', 'Critical')], default='Low')
    telephone = models.CharField(max_length=15)
    emergency_contact = models.CharField(max_length=100)
    symptoms = models.TextField(blank=True)
    ai_suggestion = models.TextField(blank=True, null=True)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE)
    created_by = models.ForeignKey('accounts.CustomUser', on_delete=models.SET_NULL, null=True, blank=True, related_name='created_patients')
    
    # Audit trail for patient record changes - critical for HIPAA compliance and PoLP
    historical_records = HistoricalRecords()

    def __str__(self):
        return self.name

class Resource(models.Model):
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=50)  # Bed, Staff, Equipment
    availability = models.BooleanField(default=True)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE)

    def __str__(self):
        return self.name

class Assignment(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE)
    user = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, related_name='assignments')
    allocation_date = models.DateField(auto_now_add=True)
    assignment_time = models.DurationField(null=True, blank=True)  # Time from admission to assignment
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Audit trail for resource assignments
    historical_records = HistoricalRecords()

    def __str__(self):
        return f"Assignment {self.id} for {self.patient}"

class Shift(models.Model):
    staff = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    location = models.CharField(max_length=100)  # Could be hospital name or room
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='shifts')
    
    # Audit trail for shift scheduling changes
    historical_records = HistoricalRecords()

    def __str__(self):
        return f"Shift for {self.staff} from {self.start_time} to {self.end_time}"

class LabReport(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    doctor = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, limit_choices_to={'role': 'doctor'})
    diagnosis = models.TextField()
    check_in_time = models.DateTimeField(auto_now_add=True)
    response_time = models.DateTimeField(null=True, blank=True)  # Time when doctor responds/completes
    
    # Audit trail for lab reports and diagnoses
    historical_records = HistoricalRecords()

    def __str__(self):
        return f"Lab Report for {self.patient} by {self.doctor}"

class AIChatMessage(models.Model):
    conversation_id = models.CharField(max_length=100)
    message = models.TextField()
    response = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.user.email} - {self.conversation_id}"

class AIUsage(models.Model):
    feature = models.CharField(max_length=50)  # 'triage' or 'chat'
    usage_count = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.feature}: {self.usage_count}"

class Note(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='notes')
    created_by = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE)
    note_type = models.CharField(max_length=20, choices=[
        ('general', 'General Note'),
        ('medical', 'Medical Update'),
        ('treatment', 'Treatment Note'),
        ('lab', 'Lab Results'),
        ('discharge', 'Discharge Note'),
    ], default='general')
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Audit trail for patient notes and documentation
    historical_records = HistoricalRecords()

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Note for {self.patient.name} by {self.created_by.email}"


class Observation(models.Model):
    """
    Vital signs and observations recorded by nurses.
    
    NURSE-SPECIFIC MODEL:
    - Allows nurses to document patient vitals and observations
    - Automatically links to recording nurse for accountability
    - Timestamped for accurate medical records
    - Separate from clinical notes (doctors) and diagnosis
    
    LEAST PRIVILEGE IMPLEMENTATION:
    - Nurses can CREATE observations for assigned patients
    - Nurses can READ observations for assigned patients
    - Nurses CANNOT modify/delete observations (audit integrity)
    - Doctors can view all observations for their patients
    
    HIPAA COMPLIANCE:
    - Audit trail: Who recorded what and when
    - Immutable records: No updates/deletes after creation
    - Access control: Only assigned care team can view
    """
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='observations')
    nurse = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, limit_choices_to={'role': 'nurse'})
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # Vital signs
    blood_pressure_systolic = models.IntegerField(null=True, blank=True, help_text="Systolic BP (mmHg)")
    blood_pressure_diastolic = models.IntegerField(null=True, blank=True, help_text="Diastolic BP (mmHg)")
    temperature = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True, help_text="Temperature (°C)")
    pulse = models.IntegerField(null=True, blank=True, help_text="Heart rate (bpm)")
    respiratory_rate = models.IntegerField(null=True, blank=True, help_text="Breaths per minute")
    oxygen_saturation = models.IntegerField(null=True, blank=True, help_text="SpO2 (%)")
    
    # Observations and notes
    notes = models.TextField(blank=True, help_text="Nurse observations and patient status")
    
    # Audit trail
    historical_records = HistoricalRecords()
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['patient', '-timestamp']),
            models.Index(fields=['nurse', '-timestamp']),
        ]
    
    def __str__(self):
        return f"Observation for {self.patient.name} by {self.nurse.get_full_name()} at {self.timestamp}"


class Diagnosis(models.Model):
    """
    Medical diagnosis recorded by doctors.
    
    DOCTOR-SPECIFIC MODEL:
    - Only doctors can create diagnoses (requires medical license)
    - Links diagnosis to specific doctor for accountability
    - Timestamped for medical record accuracy
    - Immutable after creation (audit integrity)
    
    LEAST PRIVILEGE:
    - Doctors can CREATE diagnoses for assigned patients only
    - Doctors can READ diagnoses for assigned patients
    - Doctors CANNOT modify/delete diagnoses (audit trail)
    - Nurses/receptionists CANNOT access diagnoses
    """
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='diagnoses')
    doctor = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, limit_choices_to={'role': 'doctor'})
    diagnosis_text = models.TextField(help_text="Medical diagnosis and clinical findings")
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # Audit trail
    historical_records = HistoricalRecords()
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name_plural = 'Diagnoses'
        indexes = [
            models.Index(fields=['patient', '-timestamp']),
            models.Index(fields=['doctor', '-timestamp']),
        ]
    
    def __str__(self):
        return f"Diagnosis for {self.patient.name} by Dr. {self.doctor.get_full_name()}"


class TestOrder(models.Model):
    """
    Laboratory and diagnostic test orders by doctors.
    
    DOCTOR-SPECIFIC MODEL:
    - Only doctors can order tests (clinical decision-making)
    - Tracks test status from order to result
    - Links to ordering doctor for accountability
    
    STATUS WORKFLOW:
    - ordered: Test has been ordered
    - pending: Test is in progress
    - resulted: Test results are available
    - cancelled: Test order cancelled
    """
    STATUS_CHOICES = [
        ('ordered', 'Ordered'),
        ('pending', 'Pending'),
        ('resulted', 'Resulted'),
        ('cancelled', 'Cancelled'),
    ]
    
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='test_orders')
    doctor = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, limit_choices_to={'role': 'doctor'})
    test_type = models.CharField(max_length=200, help_text="Type of test (e.g., CBC, X-Ray, MRI)")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ordered')
    notes = models.TextField(blank=True, help_text="Additional instructions or notes")
    ordered_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Audit trail
    historical_records = HistoricalRecords()
    
    class Meta:
        ordering = ['-ordered_at']
        indexes = [
            models.Index(fields=['patient', '-ordered_at']),
            models.Index(fields=['doctor', '-ordered_at']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.test_type} for {self.patient.name} - {self.status}"


class Prescription(models.Model):
    """
    Medication prescriptions by doctors.
    
    DOCTOR-SPECIFIC MODEL:
    - Only doctors can prescribe medications (requires medical license)
    - Tracks medication, dosage, and instructions
    - Links to prescribing doctor for accountability
    - Immutable after creation (audit integrity)
    
    LEAST PRIVILEGE:
    - Doctors can CREATE prescriptions for assigned patients only
    - Doctors can READ prescriptions for assigned patients
    - Nurses can READ prescriptions to administer medications
    - Nurses CANNOT create/modify prescriptions
    """
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='prescriptions')
    doctor = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, limit_choices_to={'role': 'doctor'})
    medication = models.CharField(max_length=200, help_text="Medication name")
    dosage = models.CharField(max_length=100, help_text="Dosage (e.g., 500mg, 10ml)")
    frequency = models.CharField(max_length=100, help_text="Frequency (e.g., twice daily, every 6 hours)")
    duration = models.CharField(max_length=100, blank=True, help_text="Duration (e.g., 7 days, 2 weeks)")
    instructions = models.TextField(blank=True, help_text="Special instructions for patient")
    prescribed_at = models.DateTimeField(auto_now_add=True)
    
    # Audit trail
    historical_records = HistoricalRecords()
    
    class Meta:
        ordering = ['-prescribed_at']
        indexes = [
            models.Index(fields=['patient', '-prescribed_at']),
            models.Index(fields=['doctor', '-prescribed_at']),
        ]
    
    def __str__(self):
        return f"{self.medication} for {self.patient.name}"