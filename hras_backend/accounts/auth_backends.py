from django.contrib.auth.backends import ModelBackend
from .models import CustomUser


class ApprovedUserBackend(ModelBackend):
    """
    Custom authentication backend that checks both is_active and is_approved.
    
    Security: Prevents login for users who are not approved by admin,
    even if they have valid credentials.
    """
    
    def authenticate(self, request, username=None, password=None, **kwargs):
        # username is actually email in our case
        email = username or kwargs.get('email')
        
        if email is None or password is None:
            return None
        
        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return None
        
        # Check password
        if not user.check_password(password):
            return None
        
        # Security check: User must be both active AND approved
        if not user.is_active or not user.is_approved:
            return None
        
        return user
    
    def get_user(self, user_id):
        try:
            return CustomUser.objects.get(pk=user_id)
        except CustomUser.DoesNotExist:
            return None
