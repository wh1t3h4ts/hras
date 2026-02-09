import pytest
from django.test import TestCase
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Hospital, Patient, Resource, Assignment, Shift, LabReport
from accounts.models import CustomUser as User

class ModelTestCase(TestCase):
    def setUp(self):
        self.hospital = Hospital.objects.create(name="Test Hospital", address="123 Test St", beds=100, ots=10, specialties="Cardiology")
        self.user = User.objects.create_user(username="testuser", email="test@example.com", password="password", hospital=self.hospital, role="doctor")

    def test_hospital_creation(self):
        self.assertEqual(self.hospital.name, "Test Hospital")

    def test_user_creation(self):
        self.assertEqual(self.user.username, "testuser")
        self.assertEqual(self.user.role, "doctor")

class APITestCase(TestCase):
    def setUp(self):
        from rest_framework.test import APIClient
        self.client = APIClient()
        self.hospital = Hospital.objects.create(name="Test Hospital", address="123 Test St", beds=100, ots=10, specialties="Cardiology")
        self.user = User.objects.create_user(username="testuser", email="test@example.com", password="password", hospital=self.hospital, role="doctor")
        self.client.force_authenticate(user=self.user)

    def test_hospital_list(self):
        response = self.client.get('/api/hospitals/')
        self.assertEqual(response.status_code, 200)

    def test_patient_creation(self):
        data = {
            "name": "John Doe",
            "admission_date": "2023-01-01",
            "severity": "High",
            "priority": 1,
            "telephone": "1234567890",
            "emergency_contact": "Jane Doe"
        }
        response = self.client.post('/api/patients/', data)
        self.assertEqual(response.status_code, 201)

class AssignmentLogicTestCase(TestCase):
    def setUp(self):
        self.hospital = Hospital.objects.create(name="Test Hospital", address="123 Test St", beds=100, ots=10, specialties="Cardiology")
        self.patient = Patient.objects.create(
            name="John Doe",
            admission_date=timezone.now().date(),
            severity="High",
            priority=1,
            telephone="1234567890",
            emergency_contact="Jane Doe",
            hospital=self.hospital
        )
        self.doctor = User.objects.create_user(username="doctor", email="doc@example.com", password="password", hospital=self.hospital, role="doctor")
        self.nurse = User.objects.create_user(username="nurse", email="nurse@example.com", password="password", hospital=self.hospital, role="nurse")
        self.bed = Resource.objects.create(name="Bed 1", type="Bed", availability=True, hospital=self.hospital)
        Shift.objects.create(staff=self.doctor, start_time=timezone.now(), end_time=timezone.now() + timedelta(hours=8))

    def test_assignment_logic(self):
        # Simulate assignment
        assignment_time = timezone.now() - datetime.combine(self.patient.admission_date, datetime.min.time()).replace(tzinfo=timezone.now().tzinfo)
        assignment = Assignment.objects.create(
            patient=self.patient,
            resource=self.bed,
            assignment_time=assignment_time
        )
        self.assertIsNotNone(assignment.assignment_time)

class ReceptionistPermissionTestCase(TestCase):
    def setUp(self):
        from rest_framework.test import APIClient
        self.client = APIClient()
        self.hospital1 = Hospital.objects.create(name="Hospital 1", address="123 St", beds=100, ots=10, specialties="General")
        self.hospital2 = Hospital.objects.create(name="Hospital 2", address="456 St", beds=100, ots=10, specialties="General")
        
        # Create users
        self.super_admin = User.objects.create_user(username="super", email="super@example.com", password="pass", role="super_admin")
        self.hospital_admin = User.objects.create_user(username="admin", email="admin@example.com", password="pass", hospital=self.hospital1, role="hospital_admin")
        self.doctor = User.objects.create_user(username="doctor", email="doc@example.com", password="pass", hospital=self.hospital1, role="doctor")
        self.receptionist = User.objects.create_user(username="receptionist", email="rec@example.com", password="pass", hospital=self.hospital1, role="receptionist")
        self.receptionist_other = User.objects.create_user(username="rec2", email="rec2@example.com", password="pass", hospital=self.hospital2, role="receptionist")
        
        # Create patients
        self.patient1 = Patient.objects.create(
            name="Patient 1", admission_date=timezone.now().date(), severity="Low", priority="Low",
            telephone="123", emergency_contact="Contact", symptoms="Symptoms", hospital=self.hospital1
        )
        self.patient2 = Patient.objects.create(
            name="Patient 2", admission_date=timezone.now().date(), severity="High", priority="High",
            telephone="456", emergency_contact="Contact2", symptoms="Symptoms2", hospital=self.hospital2
        )
        
        # Create lab report
        self.lab_report = LabReport.objects.create(
            patient=self.patient1, doctor=self.doctor, diagnosis="Diagnosis", check_in_time=timezone.now()
        )

    def test_receptionist_can_create_patient(self):
        self.client.force_authenticate(user=self.receptionist)
        data = {
            "name": "New Patient",
            "age": 30,
            "telephone": "789",
            "emergency_contact": "Emergency",
            "symptoms": "Fever",
            "severity": "Medium"
        }
        response = self.client.post('/api/patients/', data)
        self.assertEqual(response.status_code, 201)

    def test_receptionist_cannot_update_patient_clinical_fields(self):
        self.client.force_authenticate(user=self.receptionist)
        data = {"ai_suggestion": "AI suggestion"}  # Clinical field
        response = self.client.patch(f'/api/patients/{self.patient1.id}/', data)
        self.assertEqual(response.status_code, 403)

    def test_receptionist_cannot_access_lab_reports(self):
        self.client.force_authenticate(user=self.receptionist)
        response = self.client.get('/api/lab-reports/')
        self.assertEqual(response.status_code, 403)

    def test_receptionist_sees_only_own_hospital_patients(self):
        self.client.force_authenticate(user=self.receptionist)
        response = self.client.get('/api/patients/')
        self.assertEqual(response.status_code, 200)
        patient_ids = [p['id'] for p in response.data]
        self.assertIn(self.patient1.id, patient_ids)
        self.assertNotIn(self.patient2.id, patient_ids)

    def test_receptionist_cannot_create_lab_report(self):
        self.client.force_authenticate(user=self.receptionist)
        data = {"patient": self.patient1.id, "diagnosis": "New diagnosis"}
        response = self.client.post('/api/lab-reports/', data)
        self.assertEqual(response.status_code, 403)

    def test_receptionist_cannot_update_lab_report(self):
        self.client.force_authenticate(user=self.receptionist)
        data = {"diagnosis": "Updated diagnosis"}
        response = self.client.patch(f'/api/lab-reports/{self.lab_report.id}/', data)
        self.assertEqual(response.status_code, 403)