from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Collaboration, PackageDeal
from catalog.serializers import PerkSerializer

User = get_user_model()


class ProviderMiniSerializer(serializers.ModelSerializer):
    company_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'full_name', 'email', 'company_name']

    def get_company_name(self, obj):
        if hasattr(obj, 'provider_profile'):
            return obj.provider_profile.company_name
        return obj.full_name


class CollaborationSerializer(serializers.ModelSerializer):
    from_provider = ProviderMiniSerializer(read_only=True)
    to_provider = ProviderMiniSerializer(read_only=True)
    package_count = serializers.SerializerMethodField()

    class Meta:
        model = Collaboration
        fields = ['id', 'from_provider', 'to_provider', 'message', 'status',
                  'created_at', 'responded_at', 'package_count']

    def get_package_count(self, obj):
        return obj.packages.count()


class PackageDealSerializer(serializers.ModelSerializer):
    perks = PerkSerializer(many=True, read_only=True)
    perk_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)
    target_employer_email = serializers.EmailField(write_only=True, required=False)
    target_employer_name = serializers.SerializerMethodField()
    collaboration_id = serializers.IntegerField(write_only=True, required=False)
    providers = serializers.SerializerMethodField()

    class Meta:
        model = PackageDeal
        fields = [
            'id', 'collaboration_id', 'name', 'description', 'perks', 'perk_ids',
            'target_employer_email', 'target_employer_name',
            'total_price', 'status', 'created_at', 'offered_at', 'providers',
        ]
        read_only_fields = ['status', 'created_at', 'offered_at']

    def get_target_employer_name(self, obj):
        if obj.target_employer:
            return obj.target_employer.full_name
        return None

    def get_providers(self, obj):
        providers = [obj.collaboration.from_provider, obj.collaboration.to_provider]
        return ProviderMiniSerializer(providers, many=True).data
