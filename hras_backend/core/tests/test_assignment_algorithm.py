"""
Test suite for automatic patient assignment algorithm.

Tests priority-based assignment, workload balancing, resource allocation,
and edge cases per KSEF 2026 project requirements.
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from core.models import Hospital, Patient, Assignment, Resource
from core.utils.assignment import assign_patient, _find_available_staff
from datetime import date

User = get_user_model()


class AutomaticAssignmentTestCase(TestCase):
    """Test automatic patient assignment algorithm"""
    
    def setUp(self):
        """Create test hospital, staff, and resources"""
        
        # Create hospital
        self.hospital = Hospital.objects.create(
            name="Test Hospital",
            address="123 Test St",
            beds=50,
            ots=5,
            specialties="General, Emergency"
        )
        
        # Create doctors
        self.doctor1 = User.objects.create_user(
            email="doctor1@test.com",
            password="test123",
            first_name="John",
            last_name="Doe",
            role="doctor",
            hospital=self.hospital,
            is_approved=True,
            is_active=True
        )
        
        self.doctor2 = User.objects.create_user(
            email="doctor2@test.com",
            password="test123",
            first_name="Jane",
            last_name="Smith",
            role="doctor",
            hospital=self.hospital,
            is_approved=True,
            is_active=True
        )
        
        # Create nurses
        self.nurse1 = User.objects.create_user(
            email="nurse1@test.com",
            password="test123",
            first_name="Alice",
            last_name="Johnson",
            role="nurse",
            hospital=self.hospital,
            is_approved=True,
            is_active=True
        )
        
        self.nurse2 = User.objects.create_user(
            email="nurse2@test.com",
            password="test123",
            first_name="Bob",
            last_name="Williams",
            role="nurse",
            hospital=self.hospital,
            is_approved=True,
            is_active=True
        )
        
        # Create receptionist
        self.receptionist = User.objects.create_user(
            email="receptionist@test.com",
            password="test123",
            first_name="Carol",
            last_name="Brown",
            role="receptionist",
            hospital=self.hospital,
            is_approved=True,
            is_active=True
        )
        
        # Create beds
        for i in range(1, 11):
            Resource.objects.create(
                name=f"Bed {i}",
                type="Bed",
                availability=True,
                hospital=self.hospital
            )
    
    def test_critical_patient_assigned_to_doctor(self):
        """Critical priority patients should be assigned to doctors first"""
        
        patient = Patient.objects.create(
            name="Critical Patient",
            age=45,
            priority="Critical",
            severity="Critical",
            symptoms="Chest pain, difficulty breathing",
            telephone="0712345678",
            emergency_contact="0723456789",
            hospital=self.hospital,
            created_by=self.receptionist
        )
        
        assignment = assign_patient(patient)
        
        self.assertIsNotNone(assignment)
        self.assertEqual(assignment.user.role, "doctor")
        self.assertEqual(assignment.patient, patient)
        self.assertFalse(assignment.resource.availability)
    
    def test_low_priority_assigned_to_nurse(self):
        """Low priority patients should be assigned to nurses first"""
        
        patient = Patient.objects.create(
            name="Low Priority Patient",
            age=30,
            priority="Low",
            severity="Low",
            symptoms="Minor headache",
            telephone="0712345678",
            emergency_contact="0723456789",
            hospital=self.hospital,
            created_by=self.receptionist
        )
        
        assignment = assign_patient(patient)
        
        self.assertIsNotNone(assignment)
        self.assertEqual(assignment.user.role, "nurse")
        self.assertEqual(assignment.patient, patient)
    
    def test_workload_balancing(self):
        """Staff with lowest workload should be assigned first"""
        
        # Assign 2 patients to doctor1
        for i in range(2):
            patient = Patient.objects.create(
                name=f"Patient {i}",
                age=40,
                priority="High",
                severity="High",
                symptoms="Test symptoms",
                telephone="0712345678",
                emergency_contact="0723456789",
                hospital=self.hospital
            )
            bed = Resource.objects.filter(availability=True).first()
            Assignment.objects.create(
                patient=patient,
                user=self.doctor1,
                resource=bed
            )
            bed.availability = False
            bed.save()
        
        # New high priority patient should go to doctor2 (lower workload)
        new_patient = Patient.objects.create(
            name="New Patient",
            age=50,
            priority="High",
            severity="High",
            symptoms="Severe pain",
            telephone="0712345678",
            emergency_contact="0723456789",
            hospital=self.hospital
        )
        
        assignment = assign_patient(new_patient)
        
        self.assertIsNotNone(assignment)
        self.assertEqual(assignment.user, self.doctor2)
    
    def test_fallback_to_nurse_when_no_doctors(self):
        """High priority should fallback to nurse if no doctors available"""
        
        # Mark all doctors as inactive
        User.objects.filter(role="doctor", hospital=self.hospital).update(is_active=False)
        
        patient = Patient.objects.create(
            name="High Priority Patient",
            age=55,
            priority="High",
            severity="High",
            symptoms="Severe symptoms",
            telephone="0712345678",
            emergency_contact="0723456789",
            hospital=self.hospital
        )
        
        assignment = assign_patient(patient)
        
        self.assertIsNotNone(assignment)
        self.assertEqual(assignment.user.role, "nurse")
    
    def test_no_assignment_when_no_staff(self):
        """Should return None when no staff available"""
        
        # Mark all staff as inactive
        User.objects.filter(hospital=self.hospital).update(is_active=False)
        
        patient = Patient.objects.create(
            name="Patient",
            age=40,
            priority="Medium",
            severity="Medium",
            symptoms="Test symptoms",
            telephone="0712345678",
            emergency_contact="0723456789",
            hospital=self.hospital
        )
        
        assignment = assign_patient(patient)
        
        self.assertIsNone(assignment)
    
    def test_no_assignment_when_no_beds(self):
        """Should return None when no beds available"""
        
        # Mark all beds as occupied
        Resource.objects.filter(hospital=self.hospital, type="Bed").update(availability=False)
        
        patient = Patient.objects.create(
            name="Patient",
            age=40,
            priority="Medium",
            severity="Medium",
            symptoms="Test symptoms",
            telephone="0712345678",
            emergency_contact="0723456789",
            hospital=self.hospital
        )
        
        assignment = assign_patient(patient)
        
        self.assertIsNone(assignment)
    
    def test_assignment_time_recorded(self):
        """Assignment time should be calculated and recorded"""
        
        patient = Patient.objects.create(
            name="Patient",
            age=40,
            priority="Medium",
            severity="Medium",
            symptoms="Test symptoms",
            telephone="0712345678",
            emergency_contact="0723456789",
            hospital=self.hospital
        )
        
        assignment = assign_patient(patient)
        
        self.assertIsNotNone(assignment)
        self.assertIsNotNone(assignment.assignment_time)
        self.assertGreaterEqual(assignment.assignment_time.total_seconds(), 0)
    
    def test_bed_marked_occupied(self):
        """Assigned bed should be marked as unavailable"""
        
        available_beds_before = Resource.objects.filter(
            hospital=self.hospital,
            type="Bed",
            availability=True
        ).count()
        
        patient = Patient.objects.create(
            name="Patient",
            age=40,
            priority="Medium",
            severity="Medium",
            symptoms="Test symptoms",
            telephone="0712345678",
            emergency_contact="0723456789",
            hospital=self.hospital
        )
        
        assignment = assign_patient(patient)
        
        available_beds_after = Resource.objects.filter(
            hospital=self.hospital,
            type="Bed",
            availability=True
        ).count()
        
        self.assertIsNotNone(assignment)
        self.assertEqual(available_beds_before - 1, available_beds_after)
        self.assertFalse(assignment.resource.availability)
    
    def test_find_available_staff_returns_lowest_workload(self):
        """_find_available_staff should return staff with lowest workload"""
        
        # Give doctor1 more assignments
        for i in range(3):
            patient = Patient.objects.create(
                name=f"Patient {i}",
                age=40,
                priority="High",
                symptoms="Test",
                telephone="0712345678",
                emergency_contact="0723456789",
                hospital=self.hospital
            )
            bed = Resource.objects.filter(availability=True).first()
            Assignment.objects.create(
                patient=patient,
                user=self.doctor1,
                resource=bed
            )
            bed.availability = False
            bed.save()
        
        # Find available doctor
        available_doctor = _find_available_staff(self.hospital, "doctor")
        
        self.assertEqual(available_doctor, self.doctor2)
    
    def test_unapproved_staff_not_assigned(self):
        """Unapproved staff should not be assigned patients"""
        
        # Mark all doctors as unapproved
        User.objects.filter(role="doctor", hospital=self.hospital).update(is_approved=False)
        
        patient = Patient.objects.create(
            name="Patient",
            age=40,
            priority="Critical",
            severity="Critical",
            symptoms="Emergency",
            telephone="0712345678",
            emergency_contact="0723456789",
            hospital=self.hospital
        )
        
        assignment = assign_patient(patient)
        
        # Should fallback to nurse
        self.assertIsNotNone(assignment)
        self.assertEqual(assignment.user.role, "nurse")
    
    def test_medium_priority_assigned_to_nurse(self):
        """Medium priority patients should be assigned to nurses first"""
        
        patient = Patient.objects.create(
            name="Medium Priority Patient",
            age=35,
            priority="Medium",
            severity="Medium",
            symptoms="Moderate pain",
            telephone="0712345678",
            emergency_contact="0723456789",
            hospital=self.hospital
        )
        
        assignment = assign_patient(patient)
        
        self.assertIsNotNone(assignment)
        self.assertEqual(assignment.user.role, "nurse")
