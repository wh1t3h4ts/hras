from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from core.models import Patient, Assignment, Resource
from django.utils import timezone

User = get_user_model()

class Command(BaseCommand):
    help = 'Assign existing patients to doctors for testing'

    def handle(self, *args, **options):
        # Get all unassigned patients
        assigned_patient_ids = Assignment.objects.values_list('patient_id', flat=True)
        unassigned_patients = Patient.objects.exclude(id__in=assigned_patient_ids)
        
        self.stdout.write(f"Found {unassigned_patients.count()} unassigned patients")
        
        for patient in unassigned_patients:
            # Find available doctor at patient's hospital
            doctor = User.objects.filter(
                hospital=patient.hospital,
                role='doctor',
                is_approved=True,
                is_active=True
            ).first()
            
            if not doctor:
                self.stdout.write(self.style.WARNING(f"No doctor available for patient {patient.id}"))
                continue
            
            # Find available bed
            bed = Resource.objects.filter(
                hospital=patient.hospital,
                type='Bed',
                availability=True
            ).first()
            
            if not bed:
                self.stdout.write(self.style.WARNING(f"No bed available for patient {patient.id}"))
                continue
            
            # Create assignment
            admission_datetime = timezone.datetime.combine(
                patient.admission_date,
                timezone.datetime.min.time()
            ).replace(tzinfo=timezone.get_current_timezone())
            assignment_time = timezone.now() - admission_datetime
            
            Assignment.objects.create(
                patient=patient,
                user=doctor,
                resource=bed,
                assignment_time=assignment_time
            )
            
            bed.availability = False
            bed.save()
            
            self.stdout.write(self.style.SUCCESS(
                f"Assigned patient {patient.id} ({patient.name}) to Dr. {doctor.get_full_name()}"
            ))
        
        self.stdout.write(self.style.SUCCESS("Assignment complete!"))
