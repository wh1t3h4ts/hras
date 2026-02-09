from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Patient
from .utils.assignment import assign_patient, AssignmentTimeoutError
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Patient)
def auto_assign_patient(sender, instance, created, **kwargs):
    """
    Automatically assign patient to staff when created.
    
    PERFORMANCE: Assignment completes within 10 seconds or times out.
    
    Triggers immediate assignment for:
    - Receptionist-created patients (primary use case)
    - Admin-created patients (testing/manual entry)
    - Any new patient registration
    
    Per KSEF 2026 requirements: Automatic assignment reduces wait times
    from 2-5 minutes (manual) to <10 seconds (automatic).
    """
    if created:
        try:
            assignment = assign_patient(instance)
            if assignment:
                logger.info(f"Auto-assigned patient {instance.id} to {assignment.user.role} {assignment.user.id}")
            else:
                logger.warning(f"Could not auto-assign patient {instance.id} - no staff/beds available")
        except AssignmentTimeoutError:
            logger.error(f"Assignment timeout for patient {instance.id} - exceeded 10 seconds")
        except Exception as e:
            logger.error(f"Error auto-assigning patient {instance.id}: {str(e)}")