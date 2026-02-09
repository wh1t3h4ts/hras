from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from core.models import Hospital, Patient, Assignment, Resource, Diagnosis, TestOrder, Prescription

User = get_user_model()


class DoctorPermissionTests(TestCase):
    """Test suite for doctor role permissions and access control"""

    def setUp(self):
        """Set up test data"""
        # Create hospital
        self.hospital = Hospital.objects.create(
            name="Test Hospital",
            address="123 Test St",
            beds=100,
            ots=5,
            specialties="General, Emergency"
        )

        # Create doctor user
        self.doctor = User.objects.create_user(
            email="doctor@test.com",
            password="testpass123",
            first_name="John",
            last_name="Doe",
            role="doctor",
            is_approved=True,
            hospital=self.hospital
        )

        # Create another doctor
        self.other_doctor = User.objects.create_user(
            email="doctor2@test.com",
            password="testpass123",
            first_name="Jane",
            last_name="Smith",
            role="doctor",
            is_approved=True,
            hospital=self.hospital
        )

        # Create admin user
        self.admin = User.objects.create_user(
            email="admin@test.com",
            password="testpass123",
            first_name="Admin",
            last_name="User",
            role="hospital_admin",
            is_approved=True,
            hospital=self.hospital
        )

        # Create assigned patient
        self.assigned_patient = Patient.objects.create(
            name="Assigned Patient",
            age=45,
            telephone="1234567890",
            emergency_contact="0987654321",
            symptoms="Chest pain",
            priority="High",
            hospital=self.hospital,
            created_by=self.admin
        )

        # Create unassigned patient
        self.unassigned_patient = Patient.objects.create(
            name="Unassigned Patient",
            age=30,
            telephone="1111111111",
            emergency_contact="2222222222",
            symptoms="Headache",
            priority="Low",
            hospital=self.hospital,
            created_by=self.admin
        )

        # Create resource for assignment
        self.resource = Resource.objects.create(
            name="Bed 1",
            type="Bed",
            availability=True,
            hospital=self.hospital
        )

        # Assign patient to doctor
        Assignment.objects.create(
            patient=self.assigned_patient,
            resource=self.resource,
            user=self.doctor
        )

        # Assign unassigned patient to other doctor
        Assignment.objects.create(
            patient=self.unassigned_patient,
            resource=self.resource,
            user=self.other_doctor
        )

        self.client = APIClient()

    def test_doctor_can_view_assigned_patients(self):
        """Test that doctor can view only assigned patients"""
        self.client.force_authenticate(user=self.doctor)
        response = self.client.get('/api/patients/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Assigned Patient')

    def test_doctor_cannot_view_unassigned_patients(self):
        """Test that doctor cannot view patients assigned to other doctors"""
        self.client.force_authenticate(user=self.doctor)
        response = self.client.get(f'/api/patients/{self.unassigned_patient.id}/')
        
        # Should return 404 because queryset is filtered
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_doctor_can_add_diagnosis(self):
        """Test that doctor can add diagnosis to assigned patient"""
        self.client.force_authenticate(user=self.doctor)
        response = self.client.post(
            f'/api/patients/{self.assigned_patient.id}/diagnosis/',
            {'diagnosis_text': 'Acute myocardial infarction'},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Diagnosis.objects.count(), 1)
        self.assertEqual(Diagnosis.objects.first().doctor, self.doctor)

    def test_doctor_can_order_tests(self):
        """Test that doctor can order tests for assigned patient"""
        self.client.force_authenticate(user=self.doctor)
        response = self.client.post(
            f'/api/patients/{self.assigned_patient.id}/tests/',
            {
                'test_type': 'ECG',
                'notes': 'Urgent - chest pain evaluation'
            },
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(TestOrder.objects.count(), 1)
        self.assertEqual(TestOrder.objects.first().doctor, self.doctor)

    def test_doctor_can_prescribe_medication(self):
        """Test that doctor can prescribe medication to assigned patient"""
        self.client.force_authenticate(user=self.doctor)
        response = self.client.post(
            f'/api/patients/{self.assigned_patient.id}/prescriptions/',
            {
                'medication': 'Aspirin',
                'dosage': '325mg',
                'frequency': 'Once daily',
                'duration': '30 days',
                'instructions': 'Take with food'
            },
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Prescription.objects.count(), 1)
        self.assertEqual(Prescription.objects.first().doctor, self.doctor)

    def test_doctor_cannot_create_patient(self):
        """Test that doctor cannot register new patients"""
        self.client.force_authenticate(user=self.doctor)
        response = self.client.post(
            '/api/patients/',
            {
                'name': 'New Patient',
                'age': 50,
                'telephone': '3333333333',
                'emergency_contact': '4444444444',
                'symptoms': 'Fever',
                'priority': 'Medium'
            },
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('cannot', response.data['detail'].lower())

    def test_doctor_cannot_delete_patient(self):
        """Test that doctor cannot delete patients"""
        self.client.force_authenticate(user=self.doctor)
        response = self.client.delete(f'/api/patients/{self.assigned_patient.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('cannot', response.data['detail'].lower())

    def test_doctor_cannot_access_hospital_management(self):
        """Test that doctor cannot access hospital management"""
        self.client.force_authenticate(user=self.doctor)
        
        # Try to update hospital
        response = self.client.patch(
            f'/api/hospitals/{self.hospital.id}/',
            {'beds': 150},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('hospital management', response.data['detail'].lower())

    def test_doctor_cannot_create_user(self):
        """Test that doctor cannot create user accounts"""
        self.client.force_authenticate(user=self.doctor)
        response = self.client.post(
            '/api/users/',
            {
                'email': 'newuser@test.com',
                'password': 'testpass123',
                'first_name': 'New',
                'last_name': 'User',
                'role': 'nurse'
            },
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('user', response.data['detail'].lower())

    def test_doctor_cannot_create_shift(self):
        """Test that doctor cannot create shifts"""
        self.client.force_authenticate(user=self.doctor)
        response = self.client.post(
            '/api/shifts/',
            {
                'staff': self.doctor.id,
                'start_time': '2024-01-15T08:00:00Z',
                'end_time': '2024-01-15T16:00:00Z',
                'location': 'Emergency',
                'hospital': self.hospital.id
            },
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_doctor_can_view_own_shifts(self):
        """Test that doctor can view their own shifts"""
        from core.models import Shift
        from datetime import datetime, timezone
        
        # Create shift for doctor
        Shift.objects.create(
            staff=self.doctor,
            start_time=datetime(2024, 1, 15, 8, 0, tzinfo=timezone.utc),
            end_time=datetime(2024, 1, 15, 16, 0, tzinfo=timezone.utc),
            location='Emergency',
            hospital=self.hospital
        )
        
        self.client.force_authenticate(user=self.doctor)
        response = self.client.get('/api/shifts/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_doctor_cannot_add_diagnosis_to_unassigned_patient(self):
        """Test that doctor cannot add diagnosis to unassigned patient"""
        self.client.force_authenticate(user=self.doctor)
        response = self.client.post(
            f'/api/patients/{self.unassigned_patient.id}/diagnosis/',
            {'diagnosis_text': 'Migraine'},
            format='json'
        )
        
        # Should return 404 because patient is not in doctor's queryset
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_doctor_uses_correct_serializer(self):
        """Test that doctor gets DoctorPatientSerializer with clinical fields"""
        self.client.force_authenticate(user=self.doctor)
        response = self.client.get(f'/api/patients/{self.assigned_patient.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check for clinical fields
        self.assertIn('ai_suggestion', response.data)
        self.assertIn('symptoms', response.data)
        self.assertIn('priority', response.data)
        # Check that administrative fields are excluded
        self.assertNotIn('hospital', response.data)
        self.assertNotIn('created_by', response.data)
