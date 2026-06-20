from rest_framework import serializers
from .models import PerkRequest, PerkBundle, BundleAssignment
from catalog.serializers import PerkSerializer


class PerkRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.full_name', read_only=True)

    class Meta:
        model = PerkRequest
        fields = [
            'id', 'employee_name', 'perk_name', 'perk_description',
            'estimated_credits', 'reason', 'status', 'reviewed_by_name',
            'reviewed_at', 'created_at'
        ]
        read_only_fields = ['status', 'reviewed_by_name', 'reviewed_at', 'created_at']


class ReviewRequestSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=['approved', 'rejected'])


class PerkBundleSerializer(serializers.ModelSerializer):
    perks = PerkSerializer(many=True, read_only=True)
    perk_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)

    class Meta:
        model = PerkBundle
        fields = ['id', 'name', 'perks', 'perk_ids', 'created_at']

    def create(self, validated_data):
        perk_ids = validated_data.pop('perk_ids', [])
        bundle = PerkBundle.objects.create(**validated_data)
        if perk_ids:
            from catalog.models import Perk
            bundle.perks.set(Perk.objects.filter(id__in=perk_ids))
        return bundle


class AssignBundleSerializer(serializers.Serializer):
    employee_id = serializers.IntegerField(required=False)
    team_id = serializers.IntegerField(required=False)
