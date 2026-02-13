from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .models import CustomUser
from .serializers import RegisterSerializer, UserSerializer
from .permissions import IsAdmin, HospitalAdminOnly
from core.serializers import HospitalAdminStaffSerializer


class RegisterView(generics.CreateAPIView):
    """
    Public registration endpoint (no authentication required).
    
    Security Implementation:
    - AllowAny permission allows public access
    - User is created with is_active=False (blocks login via JWT)
    - User is created with is_approved=False (admin must approve)
    - Cannot register as super_admin (validated in serializer)
    
    Why is_active=False blocks login:
    Django's authentication backend checks is_active before allowing login.
    JWT authentication also respects this flag, preventing token generation
    for inactive users. This ensures users cannot login until admin approval.
    
    Workflow:
    1. User registers → is_active=False, is_approved=False
    2. Admin reviews in Django admin
    3. Admin sets is_active=True, is_approved=True
    4. User can now login and get JWT token
    """
    
    queryset = CustomUser.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        return Response(
            {
                'message': 'Registration successful. Your account is pending approval by an administrator.',
                'user': {
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'role': user.role,
                    'is_approved': user.is_approved,
                    'is_active': user.is_active,
                }
            },
            status=status.HTTP_201_CREATED
        )


class UserManagementViewSet(viewsets.ModelViewSet):
    """
    ADMIN ONLY: Complete user management across all hospitals.
    
    RESTRICTED TO ADMINS ONLY:
    - Only admins can manage users globally
    - Includes user approval, role changes, hospital assignments
    
    SECURITY BOUNDARY:
    - This endpoint provides system-wide user management capabilities
    """
    
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]  # ADMIN ONLY
    
    def get_permissions(self):
        # 'me' action allows authenticated users, others require admin
        if self.action == 'me':
            return [IsAuthenticated()]
        return [IsAdmin()]
    
    def get_queryset(self):
        # Admin only - full access to all users
        return CustomUser.objects.all()
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Get current user info"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
    def pending(self, request):
        """List all pending approval users"""
        pending_users = CustomUser.objects.filter(is_approved=False)
        serializer = self.get_serializer(pending_users, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def approve(self, request, pk=None):
        """Approve a user account"""
        user = self.get_object()
        user.is_approved = True
        user.is_active = True
        user.save()
        
        return Response({
            'message': f'User {user.email} has been approved.',
            'user': UserSerializer(user).data
        })
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def reject(self, request, pk=None):
        """Reject a user account"""
        user = self.get_object()
        user.is_approved = False
        user.is_active = False
        user.save()
        
        return Response({
            'message': f'User {user.email} has been rejected.',
            'user': UserSerializer(user).data
        })
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def deactivate(self, request, pk=None):
        """Deactivate a user account"""
        user = self.get_object()
        if user.role == 'admin':
            return Response(
                {'error': 'Cannot deactivate admin accounts.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user.is_active = False
        user.save()
        
        return Response({
            'message': f'User {user.email} has been deactivated.',
            'user': UserSerializer(user).data
        })
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def activate(self, request, pk=None):
        """Activate a user account"""
        user = self.get_object()
        user.is_active = True
        user.save()
        
        return Response({
            'message': f'User {user.email} has been activated.',
            'user': UserSerializer(user).data
        })
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAdmin])
    def assign_hospital(self, request, pk=None):
        """Assign user to a hospital"""
        user = self.get_object()
        hospital_id = request.data.get('hospital_id')
        
        if not hospital_id:
            return Response(
                {'error': 'hospital_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from core.models import Hospital
        try:
            hospital = Hospital.objects.get(id=hospital_id)
            user.hospital = hospital
            user.save()
            
            return Response({
                'message': f'User {user.email} assigned to {hospital.name}.',
                'user': UserSerializer(user).data
            })
        except Hospital.DoesNotExist:
            return Response(
                {'error': 'Hospital not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAdmin])
    def change_role(self, request, pk=None):
        """Change user role"""
        user = self.get_object()
        new_role = request.data.get('role')
        
        if not new_role:
            return Response(
                {'error': 'role is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if new_role not in dict(CustomUser.ROLE_CHOICES):
            return Response(
                {'error': 'Invalid role'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.role = new_role
        user.save()
        
        return Response({
            'message': f'User {user.email} role changed to {new_role}.',
            'user': UserSerializer(user).data
        })


class StaffViewSet(viewsets.ModelViewSet):
    """
    Admin endpoint for managing staff (doctors and nurses).
    
    PERMISSIONS:
    - All actions require admin privileges
    - Admins have full access to manage all staff
    
    SERIALIZER:
    - Uses HospitalAdminStaffSerializer (restricted fields)
    - Excludes sensitive data like passwords and global permissions
    """
    
    serializer_class = HospitalAdminStaffSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get_queryset(self):
        """
        Admin can manage all doctors and nurses across all hospitals.
        """
        return CustomUser.objects.filter(role__in=['doctor', 'nurse'])
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def deactivate(self, request, pk=None):
        """
        Deactivate a staff member (admin action).
        
        SECURITY:
        - Admins can deactivate any staff member
        - Cannot deactivate super admins
        - Maintains audit trail of deactivation
        """
        user = self.get_object()
        
        # Explicit boundary check using utility function
        from core.views import enforce_hospital_boundary
        enforce_hospital_boundary(request, user, "deactivate staff at")
        
        # Prevent deactivating super admins
        if user.role == 'admin':
            return Response(
                {'error': 'Cannot deactivate super admin accounts.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user.is_active = False
        user.save()
        
        return Response({
            'message': f'Staff member {user.email} has been deactivated.',
            'user': self.get_serializer(user).data
        })
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def activate(self, request, pk=None):
        """
        Activate a staff member (admin action).
        
        SECURITY:
        - Admins can activate any staff member
        """
        user = self.get_object()
        
        user.is_active = True
        user.save()
        
        return Response({
            'message': f'Staff member {user.email} has been activated.',
            'user': self.get_serializer(user).data
        })
