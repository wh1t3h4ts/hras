from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RegisterView, UserManagementViewSet, StaffViewSet

router = DefaultRouter()
router.register(r'users', UserManagementViewSet, basename='user-management')
router.register(r'staff', StaffViewSet, basename='staff')

urlpatterns = [
    # Public registration endpoint (no authentication required)
    path('register/', RegisterView.as_view(), name='register'),
    
    # Super Admin user management endpoints
    path('', include(router.urls)),
]
