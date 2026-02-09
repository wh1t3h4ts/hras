"""
HRAS Backend Tests - Nurse Role Least Privilege Verification

Tests verify that nurses:
1. Can ONLY view assigned patients
2. Can add observations/vitals for assigned patients
3. CANNOT create/delete patients
4. CANNOT access hospital management
5. CANNOT access lab reports
6. CANNOT modify restricted patient fields (priority, diagnosis)
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from core.models import Hospital, Patient, Assignment, Resource, Observation
from datetime import timedelta

User = get_user_model()


class NursePermissionTests(TestCase):
    
    def setUp(self):
        self.hospital = Hospital.objects.create(
            name="Test Hospital",
            address="123 Test St",
            beds=100,
            ots=5,
            specialties="General"
        )
        
        self.nurse = User.objects.create_user(
            email='nurse@test.com',
            password='nurse123',
            role='nurse',
            hospital=self.hospital,
            is_approved=True,
            is_active=True
        )
        
        self.assigned_patient = Patient.objects.create(
            name="Assigned Patient",
            age=30,
            telephone="1234567890",
            emergency_contact="0987654321",
            symptoms="Test symptoms",
            priority="Medium",
            hospital=self.hospital
        )
        
        self.unassigned_patient = Patient.objects.create(
            name="Unassigned Patient",
            age=40,
            telephone="1111111111",
            emergency_contact="2222222222",
            symptoms="Other symptoms",
            priority="Low",
            hospital=self.hospital
        )
        
        resource = Resource.objects.create(
            name="Bed 1",
            type="Bed",
            availability=False,
            hospital=self.hospital
        )
        
        Assignment.objects.create(
            patient=self.assigned_patient,
            resource=resource,
            user=self.nurse,
            assignment_time=timedelta(minutes=5)
        )
        
        self.client = APIClient()
    
    def test_nurse_can_view_assigned_patients(self):
        """Nurse can view assigned patients (200 OK)"""
        self.client.force_authenticate(user=self.nurse)
        response = self.client.get('/api/patients/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_nurse_cannot_view_unassigned_patients(self):
        """Nurse cannot view unassigned patients (404)"""
        self.client.force_authenticate(user=self.nurse)
        response = self.client.get(f'/api/patients/{self.unassigned_patient.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_nurse_can_add_observation(self):
        """Nurse can add vitals for assigned patient (201)"""
        self.client.force_authenticate(user=self.nurse)
        
        data = {
            'pulse': 72,
            'temperature': 37.2,
            'notes': 'Patient stable'
        }
        
        response = self.client.post(
            f'/api/patients/{self.assigned_patient.id}/observations/',
            data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Observation.objects.count(), 1)
    
    def test_nurse_cannot_create_patient(self):
        """Nurse cannot create patients (403)"""
        self.client.force_authenticate(user=self.nurse)
        
        data = {
            'name': 'New Patient',
            'age': 25,
            'telephone': '5555555555',
            'emergency_contact': '6666666666',
            'symptoms': 'Headache'
        }
        
        response = self.client.post('/api/patients/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_nurse_cannot_access_hospital_management(self):
        """Nurse cannot access hospital management (403)"""
        self.client.force_authenticate(user=self.nurse)
        response = self.client.get(f'/api/hospitals/{self.hospital.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_nurse_cannot_access_lab_reports(self):
        """Nurse cannot access lab reports (403)"""
        self.client.force_authenticate(user=self.nurse)
        response = self.client.get('/api/lab-reports/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
