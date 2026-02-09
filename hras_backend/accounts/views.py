from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .models import CustomUser
from .serializers import RegisterSerializer, UserSerializer
from .permissions import IsSuperAdmin, IsHospitalAdminOrSuperAdmin


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
    Super Admin endpoint for managing all users.
    
    Permissions:
    - List/Retrieve: Hospital Admin or Super Admin
    - Create/Update/Delete: Super Admin only
    - Approve/Reject: Super Admin only
    """
    
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    
    def get_permissions(self):
        if self.action == 'me':
            return [IsAuthenticated()]
        elif self.action in ['list', 'retrieve']:
            return [IsHospitalAdminOrSuperAdmin()]
        return [IsSuperAdmin()]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return CustomUser.objects.all()
        elif user.role == 'hospital_admin' and user.hospital:
            return CustomUser.objects.filter(hospital=user.hospital)
        return CustomUser.objects.filter(id=user.id)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Get current user info"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsSuperAdmin])
    def pending(self, request):
        """List all pending approval users"""
        pending_users = CustomUser.objects.filter(is_approved=False)
        serializer = self.get_serializer(pending_users, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsSuperAdmin])
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
    
    @action(detail=True, methods=['post'], permission_classes=[IsSuperAdmin])
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
    
    @action(detail=True, methods=['post'], permission_classes=[IsSuperAdmin])
    def deactivate(self, request, pk=None):
        """Deactivate a user account"""
        user = self.get_object()
        if user.role == 'super_admin':
            return Response(
                {'error': 'Cannot deactivate super admin accounts.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user.is_active = False
        user.save()
        
        return Response({
            'message': f'User {user.email} has been deactivated.',
            'user': UserSerializer(user).data
        })
    
    @action(detail=True, methods=['post'], permission_classes=[IsSuperAdmin])
    def activate(self, request, pk=None):
        """Activate a user account"""
        user = self.get_object()
        user.is_active = True
        user.save()
        
        return Response({
            'message': f'User {user.email} has been activated.',
            'user': UserSerializer(user).data
        })
    
    @action(detail=True, methods=['patch'], permission_classes=[IsSuperAdmin])
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
    
    @action(detail=True, methods=['patch'], permission_classes=[IsSuperAdmin])
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
