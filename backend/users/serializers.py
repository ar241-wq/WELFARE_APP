from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from .models import ProviderProfile

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    company_name = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['email', 'password', 'full_name', 'role', 'company_name']

    def validate(self, data):
        if data.get('role') == 'provider' and not data.get('company_name'):
            raise serializers.ValidationError({'company_name': 'Required for providers.'})
        return data

    def create(self, validated_data):
        company_name = validated_data.pop('company_name', None)
        user = User.objects.create_user(**validated_data)
        if user.role == 'provider' and company_name:
            ProviderProfile.objects.create(user=user, company_name=company_name)
        return user


class UserSerializer(serializers.ModelSerializer):
    provider_profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'role', 'avatar', 'is_verified', 'created_at', 'provider_profile']

    def get_provider_profile(self, obj):
        if obj.role == 'provider' and hasattr(obj, 'provider_profile'):
            return {
                'company_name': obj.provider_profile.company_name,
                'is_verified': obj.provider_profile.is_verified,
                'logo': obj.provider_profile.logo.url if obj.provider_profile.logo else None,
            }
        return None


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data


class UpdateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['full_name', 'avatar']
