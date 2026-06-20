from rest_framework import serializers
from .models import GroupBuy, GroupBuyMember
from decimal import Decimal


class GroupBuySerializer(serializers.ModelSerializer):
    perk_name = serializers.CharField(source='perk.name', read_only=True)
    perk_id = serializers.IntegerField(source='perk.id', read_only=True)
    original_price = serializers.DecimalField(source='perk.credit_price', max_digits=10, decimal_places=2, read_only=True)
    member_count = serializers.SerializerMethodField()
    discount_rate = serializers.SerializerMethodField()
    discounted_price = serializers.SerializerMethodField()
    is_member = serializers.SerializerMethodField()
    is_locked_in = serializers.SerializerMethodField()
    is_active = serializers.BooleanField(read_only=True)
    members_preview = serializers.SerializerMethodField()
    savings = serializers.SerializerMethodField()

    class Meta:
        model = GroupBuy
        fields = [
            'id', 'perk_id', 'perk_name', 'original_price',
            'member_count', 'discount_rate', 'discounted_price', 'savings',
            'is_member', 'is_locked_in', 'is_active',
            'expires_at', 'created_at', 'members_preview',
        ]

    def get_member_count(self, obj):
        return obj.member_count

    def get_discount_rate(self, obj):
        return float(obj.discount_rate)

    def get_discounted_price(self, obj):
        return float(obj.discounted_price)

    def get_savings(self, obj):
        return float(obj.perk.credit_price * obj.discount_rate)

    def get_is_member(self, obj):
        user = self.context['request'].user
        return obj.members.filter(user=user).exists()

    def get_is_locked_in(self, obj):
        user = self.context['request'].user
        return obj.members.filter(user=user, locked_in=True).exists()

    def get_members_preview(self, obj):
        members = obj.members.select_related('user')[:5]
        return [m.user.full_name.split()[0] for m in members]
