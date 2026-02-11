from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer
from . import views

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

router = DefaultRouter()
router.register(r'hospitals', views.HospitalViewSet)
router.register(r'users', views.UserViewSet)
router.register(r'patients', views.PatientViewSet)
router.register(r'resources', views.ResourceViewSet)
router.register(r'assignments', views.AssignmentViewSet)
router.register(r'shifts', views.ShiftViewSet)
router.register(r'lab-reports', views.LabReportViewSet)
router.register(r'notes', views.NoteViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('analytics/assignment-times/', views.assignment_times_analytics, name='assignment_times'),
    # path('analytics/response-times/', views.response_times_analytics, name='response_times'),
    path('patients/ai-triage/', views.ai_triage, name='ai_triage'),
    path('ai-chat/', views.ai_chat, name='ai_chat'),
    path('ai-status/', views.ai_status, name='ai_status'),
]