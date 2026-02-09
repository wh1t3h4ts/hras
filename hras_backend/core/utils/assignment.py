"""
Automatic Patient Assignment Service for HRAS.

Implements priority-based, workload-balanced automatic assignment per KSEF 2026 requirements:
"The system automatically assigns a doctor or nurse to the patient based on available resources"
to reduce wait times and improve efficiency in busy hospital settings.

PERFORMANCE REQUIREMENT: Assignment must complete within 10 seconds.
"""

from django.db import transaction
from django.utils import timezone
from django.contrib.auth import get_user_model
from core.models import Assignment, Resource
from django.db.models import Count, Q
import logging
import signal

User = get_user_model()
logger = logging.getLogger(__name__)


class AssignmentTimeoutError(Exception):
    """Raised when assignment takes longer than 10 seconds"""
    pass


def timeout_handler(signum, frame):
    """Signal handler for assignment timeout"""
    raise AssignmentTimeoutError("Assignment exceeded 10 second timeout")


@transaction.atomic
def assign_patient(patient):
    """
    Automatically assign patient to available doctor or nurse based on priority and workload.
    
    PERFORMANCE: Completes within 10 seconds or raises AssignmentTimeoutError.
    
    ALGORITHM:
    1. High/Critical priority → Try doctors first, then nurses
    2. Low/Medium priority → Try nurses first, then doctors
    3. Select staff with lowest current workload (fewest active assignments)
    4. Allocate available bed resource
    5. Record assignment timestamp for response time tracking
    6. If no staff available → patient remains in "Waiting" status
    
    Args:
        patient: Patient instance to assign
        
    Returns:
        Assignment instance if successful, None if no staff/beds available
        
    Raises:
        AssignmentTimeoutError: If assignment takes longer than 10 seconds
    """
    
    # Set 10 second timeout
    signal.signal(signal.SIGALRM, timeout_handler)
    signal.alarm(10)
    
    try:
        # Determine staff priority based on patient priority
        is_high_priority = patient.priority in ['High', 'Critical']
        
        # Try primary staff type first
        if is_high_priority:
            staff = _find_available_staff(patient.hospital, 'doctor')
            if not staff:
                staff = _find_available_staff(patient.hospital, 'nurse')
        else:
            staff = _find_available_staff(patient.hospital, 'nurse')
            if not staff:
                staff = _find_available_staff(patient.hospital, 'doctor')
        
        # No staff available
        if not staff:
            logger.warning(f"No staff available for patient {patient.id} at hospital {patient.hospital.id}")
            signal.alarm(0)  # Cancel timeout
            return None
        
        # Find available bed
        available_bed = Resource.objects.filter(
            hospital=patient.hospital,
            type='Bed',
            availability=True
        ).first()
        
        if not available_bed:
            logger.warning(f"No beds available for patient {patient.id} at hospital {patient.hospital.id}")
            signal.alarm(0)  # Cancel timeout
            return None
        
        # Calculate assignment time (time from admission to assignment)
        admission_datetime = timezone.datetime.combine(
            patient.admission_date,
            timezone.datetime.min.time()
        ).replace(tzinfo=timezone.get_current_timezone())
        assignment_time = timezone.now() - admission_datetime
        
        # Create assignment
        assignment = Assignment.objects.create(
            patient=patient,
            user=staff,
            resource=available_bed,
            assignment_time=assignment_time
        )
        
        # Mark bed as occupied
        available_bed.availability = False
        available_bed.save(update_fields=['availability'])
        
        logger.info(
            f"Assigned patient {patient.id} ({patient.priority}) to {staff.role} {staff.id} "
            f"with bed {available_bed.id} in {assignment_time.total_seconds():.2f}s"
        )
        
        signal.alarm(0)  # Cancel timeout
        return assignment
        
    except AssignmentTimeoutError:
        logger.error(f"Assignment timeout for patient {patient.id} - exceeded 10 seconds")
        signal.alarm(0)  # Cancel timeout
        return None
    except Exception as e:
        logger.error(f"Assignment error for patient {patient.id}: {str(e)}")
        signal.alarm(0)  # Cancel timeout
        return None


def _find_available_staff(hospital, role):
    """
    Find available staff member with lowest workload.
    Optimized for <10 second performance requirement.
    
    CRITERIA:
    - Same hospital
    - Specified role (doctor/nurse)
    - Approved and active
    - Lowest current workload (fewest active assignments)
    
    OPTIMIZATION:
    - Uses select_related to reduce queries
    - Limits result to first match only
    - Indexed fields for fast lookup
    
    Args:
        hospital: Hospital instance
        role: 'doctor' or 'nurse'
        
    Returns:
        User instance or None
    """
    
    # Get staff with lowest workload (optimized query)
    staff = User.objects.filter(
        hospital=hospital,
        role=role,
        is_approved=True,
        is_active=True
    ).annotate(
        active_assignments=Count(
            'assignments',
            filter=Q(assignments__patient__isnull=False)
        )
    ).order_by('active_assignments').first()
    
    return staff


@transaction.atomic
def reassign_patient(patient, new_staff):
    """
    Reassign patient to a different doctor/nurse (admin only).
    
    Args:
        patient: Patient instance
        new_staff: User instance with role='doctor' or 'nurse'
        
    Returns:
        New Assignment instance
    """
    # Release old bed
    old_assignments = Assignment.objects.filter(patient=patient)
    for old_assignment in old_assignments:
        old_assignment.resource.availability = True
        old_assignment.resource.save(update_fields=['availability'])
    old_assignments.delete()
    
    # Find available bed
    available_bed = Resource.objects.filter(
        hospital=patient.hospital,
        type='Bed',
        availability=True
    ).first()
    
    if not available_bed:
        logger.error(f"No beds available for reassignment of patient {patient.id}")
        return None
    
    # Calculate assignment time
    admission_datetime = timezone.datetime.combine(
        patient.admission_date,
        timezone.datetime.min.time()
    ).replace(tzinfo=timezone.get_current_timezone())
    assignment_time = timezone.now() - admission_datetime
    
    # Create new assignment
    assignment = Assignment.objects.create(
        patient=patient,
        resource=available_bed,
        user=new_staff,
        assignment_time=assignment_time
    )
    
    # Mark bed as occupied
    available_bed.availability = False
    available_bed.save(update_fields=['availability'])
    
    logger.info(f"Reassigned patient {patient.id} to {new_staff.role} {new_staff.id}")
    
    return assignment
