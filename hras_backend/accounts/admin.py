from django.contrib import admin
from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    """Admin configuration for CustomUser model"""
    
    list_display = ['email', 'role', 'hospital', 'is_approved', 'is_active', 'date_joined']
    list_filter = ['is_approved', 'role']
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('-date_joined',)
    actions = ['approve_users', 'reject_users']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Role & Approval', {'fields': ('role', 'is_approved', 'hospital')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'first_name', 'last_name', 'role', 'is_approved', 'hospital'),
        }),
    )
    
    readonly_fields = ('date_joined', 'last_login')
    
    def approve_users(self, request, queryset):
        queryset.update(is_approved=True, is_active=True)
        self.message_user(request, f'{queryset.count()} user(s) approved.')
    
    approve_users.short_description = 'Approve selected users'
    
    def reject_users(self, request, queryset):
        queryset.update(is_approved=False, is_active=False)
        self.message_user(request, f'{queryset.count()} user(s) rejected.')
    
    reject_users.short_description = 'Reject selected users'
    
    def save_model(self, request, obj, form, change):
        """Hash the password when saving the user"""
        if 'password' in form.cleaned_data and form.cleaned_data['password']:
            obj.set_password(form.cleaned_data['password'])
        super().save_model(request, obj, form, change)