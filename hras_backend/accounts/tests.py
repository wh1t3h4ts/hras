from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from core.models import Hospital, Patient, Assignment, Resource

User = get_user_model()


class AccountSecurityTests(APITestCase):
    """Test least privilege implementation and security measures"""

    def setUp(self):
        """Set up test data"""
        # Create hospitals
        self.hospital1 = Hospital.objects.create(
            name="Test Hospital 1",
            address="123 Test St",
            beds=100,
            ots=5,
            specialties="Cardiology, Neurology"
        )
        self.hospital2 = Hospital.objects.create(
            name="Test Hospital 2",
            address="456 Test Ave",
            beds=80,
            ots=3,
            specialties="Orthopedics, Pediatrics"
        )

        # Create users
        self.super_admin = User.objects.create_user(
            email='superadmin@test.com',
            password='testpass123',
            first_name='Super',
            last_name='Admin',
            role='super_admin',
            is_approved=True,
            is_active=True
        )

        self.hospital_admin1 = User.objects.create_user(
            email='admin1@test.com',
            password='testpass123',
            first_name='Hospital',
            last_name='Admin1',
            role='hospital_admin',
            hospital=self.hospital1,
            is_approved=True,
            is_active=True
        )

        self.doctor1 = User.objects.create_user(
            email='doctor1@test.com',
            password='testpass123',
            first_name='Test',
            last_name='Doctor1',
            role='doctor',
            hospital=self.hospital1,
            is_approved=True,
            is_active=True
        )

        self.doctor2 = User.objects.create_user(
            email='doctor2@test.com',
            password='testpass123',
            first_name='Test',
            last_name='Doctor2',
            role='doctor',
            hospital=self.hospital2,
            is_approved=True,
            is_active=True
        )

        # Create resources
        self.resource1 = Resource.objects.create(
            name="Bed A101",
            type="Bed",
            availability=True,
            hospital=self.hospital1
        )

        # Create patients
        self.patient1 = Patient.objects.create(
            name="John Doe",
            admission_date="2024-01-15",
            severity="Moderate",
            priority="Medium",
            telephone="123-456-7890",
            emergency_contact="Jane Doe",
            symptoms="Chest pain",
            hospital=self.hospital1
        )

        self.patient2 = Patient.objects.create(
            name="Jane Smith",
            admission_date="2024-01-16",
            severity="High",
            priority="High",
            telephone="098-765-4321",
            emergency_contact="Bob Smith",
            symptoms="Severe headache",
            hospital=self.hospital2
        )

        # Create assignment for doctor1 to patient1
        Assignment.objects.create(
            patient=self.patient1,
            resource=self.resource1,
            user=self.doctor1,
            allocation_date="2024-01-15"
        )

    def test_registration_creates_inactive_unapproved_user(self):
        """Test that registration creates inactive and unapproved user"""
        url = reverse('register')
        data = {
            'email': 'newuser@test.com',
            'password': 'testpass123',
            'first_name': 'New',
            'last_name': 'User',
            'role': 'doctor',
            'hospital_id': self.hospital1.id
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Check user was created with correct status
        user = User.objects.get(email='newuser@test.com')
        self.assertFalse(user.is_active)
        self.assertFalse(user.is_approved)
        self.assertEqual(user.role, 'doctor')

    def test_login_fails_if_not_approved(self):
        """Test that login fails for unapproved users"""
        # Create unapproved user
        unapproved_user = User.objects.create_user(
            email='unapproved@test.com',
            password='testpass123',
            role='doctor',
            hospital=self.hospital1,
            is_approved=False,
            is_active=False
        )

        url = reverse('token_obtain_pair')
        data = {
            'username': 'unapproved@test.com',
            'password': 'testpass123'
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_approve_changes_status_and_allows_login(self):
        """Test that approval changes user status and allows login"""
        # Create pending user
        pending_user = User.objects.create_user(
            email='pending@test.com',
            password='testpass123',
            role='doctor',
            hospital=self.hospital1,
            is_approved=False,
            is_active=False
        )

        # Login as super admin
        self.client.force_authenticate(user=self.super_admin)

        # Approve user
        url = reverse('approve_user', kwargs={'pk': pending_user.id})
        response = self.client.patch(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Refresh user from database
        pending_user.refresh_from_db()
        self.assertTrue(pending_user.is_approved)
        self.assertTrue(pending_user.is_active)

        # Test login now works
        self.client.logout()
        url = reverse('token_obtain_pair')
        data = {
            'username': 'pending@test.com',
            'password': 'testpass123'
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_hospital_admin_cannot_access_other_hospitals(self):
        """Test that hospital admin cannot access patients from other hospitals"""
        # Login as hospital admin from hospital1
        self.client.force_authenticate(user=self.hospital_admin1)

        # Try to access patient from hospital2
        url = reverse('patient-detail', kwargs={'pk': self.patient2.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # Should be able to access patient from own hospital
        url = reverse('patient-detail', kwargs={'pk': self.patient1.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_doctor_cannot_access_unassigned_patient(self):
        """Test that doctor cannot access patients they are not assigned to"""
        # Login as doctor1 (assigned to patient1)
        self.client.force_authenticate(user=self.doctor1)

        # Try to access patient2 (not assigned)
        url = reverse('patient-detail', kwargs={'pk': self.patient2.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # Should be able to access assigned patient
        url = reverse('patient-detail', kwargs={'pk': self.patient1.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_privilege_escalation_blocked(self):
        """Test that non-super-admin cannot change user roles"""
        # Login as hospital admin
        self.client.force_authenticate(user=self.hospital_admin1)

        # Try to change a user's role
        url = f'/api/users/{self.doctor1.id}/'
        data = {'role': 'super_admin'}
        response = self.client.patch(url, data, format='json', HTTP_AUTHORIZATION=f'Bearer {self.get_token(self.hospital_admin1)}')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Verify role was not changed
        self.doctor1.refresh_from_db()
        self.assertEqual(self.doctor1.role, 'doctor')

    def test_super_admin_can_change_roles(self):
        """Test that super admin can change user roles"""
        # Change a user's role
        url = f'/api/users/{self.doctor1.id}/'
        data = {'role': 'nurse'}
        response = self.client.patch(url, data, format='json', HTTP_AUTHORIZATION=f'Bearer {self.get_token(self.super_admin)}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify role was changed
        self.doctor1.refresh_from_db()
        self.assertEqual(self.doctor1.role, 'nurse')

    def get_token(self, user):
        """Helper method to get JWT token for a user"""
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)