from rest_framework import serializers
from .models import InternalPerk, InternalPerkRedemption


class InternalPerkSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    slots_remaining = serializers.SerializerMethodField()
    has_requested = serializers.SerializerMethodField()
    my_request_status = serializers.SerializerMethodField()

    class Meta:
        model = InternalPerk
        fields = [
            'id', 'title', 'description', 'icon', 'credit_cost', 'is_free',
            'available_slots', 'slots_remaining', 'requires_approval',
            'is_active', 'company_name', 'has_requested', 'my_request_status', 'created_at',
        ]

    def get_slots_remaining(self, obj):
        return obj.slots_remaining

    def get_has_requested(self, obj):
        user = self.context['request'].user
        return obj.redemptions.filter(employee=user, status__in=('pending', 'approved')).exists()

    def get_my_request_status(self, obj):
        user = self.context['request'].user
        req = obj.redemptions.filter(employee=user).order_by('-requested_at').first()
        return req.status if req else None


class InternalPerkRedemptionSerializer(serializers.ModelSerializer):
    perk_title = serializers.CharField(source='perk.title', read_only=True)
    perk_icon = serializers.CharField(source='perk.icon', read_only=True)
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_email = serializers.CharField(source='employee.email', read_only=True)

    class Meta:
        model = InternalPerkRedemption
        fields = [
            'id', 'perk_title', 'perk_icon', 'employee_name', 'employee_email',
            'status', 'note', 'hr_note', 'requested_at', 'resolved_at',
        ]
