from django.contrib import admin
from .models import Hospital, Patient, Resource, Assignment, Shift, LabReport

@admin.register(Hospital)
class HospitalAdmin(admin.ModelAdmin):
    list_display = ['name', 'address', 'beds', 'ots']

@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ['name', 'admission_date', 'severity', 'priority', 'hospital']

@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ['name', 'type', 'availability', 'hospital']

@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ['patient', 'resource', 'allocation_date', 'assignment_time']

@admin.register(Shift)
class ShiftAdmin(admin.ModelAdmin):
    list_display = ['staff', 'start_time', 'end_time', 'location']

@admin.register(LabReport)
class LabReportAdmin(admin.ModelAdmin):
    list_display = ['patient', 'doctor', 'diagnosis', 'check_in_time', 'response_time']