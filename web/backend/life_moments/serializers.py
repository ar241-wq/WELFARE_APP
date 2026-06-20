from rest_framework import serializers
from catalog.serializers import PerkSerializer
from .models import LifeEvent, CarePackage, CreditDonation


class CarePackageSerializer(serializers.ModelSerializer):
    perks = PerkSerializer(many=True, read_only=True)
    total_donations = serializers.SerializerMethodField()

    class Meta:
        model = CarePackage
        fields = ['id', 'status', 'credit_boost', 'perks', 'total_donations', 'approved_at']

    def get_total_donations(self, obj):
        return sum(d.amount for d in obj.life_event.donations.all())


class LifeEventSerializer(serializers.ModelSerializer):
    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True)
    care_package = CarePackageSerializer(read_only=True)
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)

    class Meta:
        model = LifeEvent
        fields = ['id', 'event_type', 'event_type_display', 'note', 'is_active', 'created_at', 'care_package', 'employee_name']
        read_only_fields = ['created_at', 'care_package']


class ApproveCarePackageSerializer(serializers.Serializer):
    credit_boost = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)
