from django.core.management.base import BaseCommand
from core.models import Hospital
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Setup initial hospital and assign all users to it'

    def handle(self, *args, **options):
        # Create or get hospital
        hospital, created = Hospital.objects.get_or_create(
            name='Kenyatta National Hospital',
            defaults={
                'address': 'Hospital Road, Nairobi',
                'beds': 100,
                'ots': 10,
                'specialties': 'General, Emergency, Surgery, Pediatrics'
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created hospital: {hospital.name}'))
        else:
            self.stdout.write(self.style.WARNING(f'Hospital already exists: {hospital.name}'))
        
        # Assign all users without hospital to this hospital
        users_without_hospital = User.objects.filter(hospital__isnull=True)
        count = users_without_hospital.update(hospital=hospital)
        
        self.stdout.write(self.style.SUCCESS(f'Assigned {count} users to {hospital.name}'))
        self.stdout.write(self.style.SUCCESS('Setup complete!'))
