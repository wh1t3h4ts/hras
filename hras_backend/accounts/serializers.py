from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import CustomUser


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT serializer that includes user role and approval status in token.
    Also provides better error messages for unapproved users.
    """
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add custom claims
        token['email'] = user.email
        token['role'] = user.role
        token['is_approved'] = user.is_approved
        token['hospital_id'] = user.hospital_id if user.hospital else None
        
        return token
    
    def validate(self, attrs):
        # Get email from username field (since we use email as username)
        email = attrs.get('email') or attrs.get('username')
        password = attrs.get('password')
        
        if not email or not password:
            raise serializers.ValidationError('Email and password are required.')
        
        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError('No account found with this email.')
        
        # Check if user is approved
        if not user.is_approved:
            raise serializers.ValidationError(
                'Your account is pending approval. Please contact an administrator.'
            )
        
        # Check if user is active
        if not user.is_active:
            raise serializers.ValidationError(
                'Your account has been deactivated. Please contact an administrator.'
            )
        
        # Validate password
        if not user.check_password(password):
            raise serializers.ValidationError('Invalid email or password.')
        
        # Call parent validate to generate tokens
        attrs['username'] = email  # Ensure username is set for parent class
        data = super().validate(attrs)
        
        # Add user info to response
        data['user'] = {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'hospital_id': user.hospital_id if user.hospital else None,
        }
        
        return data


class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration with approval workflow.
    Users register but remain inactive until admin approval.
    """
    password = serializers.CharField(write_only=True, min_length=5, style={'input_type': 'password'})
    password_confirm = serializers.CharField(write_only=True, style={'input_type': 'password'})
    hospital_id = serializers.IntegerField(required=False, allow_null=True, write_only=True)
    
    class Meta:
        model = CustomUser
        fields = ['email', 'password', 'password_confirm', 'first_name', 'last_name', 'role', 'hospital_id']
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
        }
    
    def validate_role(self, value):
        """Prevent users from registering as super_admin"""
        if value == 'super_admin':
            raise serializers.ValidationError("Cannot register as super admin. Contact system administrator.")
        return value
    
    def validate(self, data):
        """Validate password confirmation"""
        if data.get('password') != data.get('password_confirm'):
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return data
    
    def create(self, validated_data):
        """
        Create user with hashed password.
        User is created as inactive and unapproved for security.
        """
        # Remove password_confirm and hospital_id from validated data
        validated_data.pop('password_confirm')
        hospital_id = validated_data.pop('hospital_id', None)
        
        # Create user with hashed password
        user = CustomUser.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            role=validated_data['role'],
        )
        
        # Set hospital if provided
        if hospital_id:
            from core.models import Hospital
            try:
                hospital = Hospital.objects.get(id=hospital_id)
                user.hospital = hospital
            except Hospital.DoesNotExist:
                pass
        
        # Security: Set user as inactive and unapproved
        # This prevents login until admin approval
        user.is_active = False
        user.is_approved = False
        user.save()
        
        return user


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user details"""
    hospital_name = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'first_name', 'last_name', 'role', 'is_approved', 'is_active', 'hospital', 'hospital_name', 'date_joined']
        read_only_fields = ['id', 'date_joined', 'is_approved', 'is_active']
    
    def get_hospital_name(self, obj):
        return obj.hospital.name if obj.hospital else None
