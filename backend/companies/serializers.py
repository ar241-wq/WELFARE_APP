from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Company, Team, TeamMembership

User = get_user_model()


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ['id', 'name', 'logo', 'industry', 'monthly_budget_per_employee', 'credits_rollover', 'created_at']
        read_only_fields = ['created_at']


class TeamSerializer(serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = ['id', 'name', 'manager', 'member_count', 'created_at']

    def get_member_count(self, obj):
        return obj.memberships.count()


class EmployeeSerializer(serializers.ModelSerializer):
    wallet_balance = serializers.SerializerMethodField()
    team = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'full_name', 'email', 'avatar', 'wallet_balance', 'team', 'created_at']

    def get_wallet_balance(self, obj):
        if hasattr(obj, 'wallet'):
            return obj.wallet.balance
        return 0

    def get_team(self, obj):
        membership = obj.team_memberships.select_related('team').first()
        return membership.team.name if membership else None


class AllocateCreditsSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    employee_ids = serializers.ListField(child=serializers.IntegerField(), required=False)
    team_id = serializers.IntegerField(required=False)
    allocate_all = serializers.BooleanField(default=False)
    month = serializers.CharField(required=False)
