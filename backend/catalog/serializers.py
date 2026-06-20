from rest_framework import serializers
from .models import Category, Perk, PerkImage, Redemption


class CategorySerializer(serializers.ModelSerializer):
    perk_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'icon', 'description', 'perk_count']

    def get_perk_count(self, obj):
        return obj.perks.filter(is_active=True).count()


class PerkImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerkImage
        fields = ['id', 'image', 'order']


class PerkSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    provider_name = serializers.SerializerMethodField()
    provider_verified = serializers.SerializerMethodField()
    images = PerkImageSerializer(many=True, read_only=True)

    class Meta:
        model = Perk
        fields = [
            'id', 'name', 'description', 'credit_price', 'category', 'category_name',
            'provider_name', 'provider_verified', 'is_active', 'is_featured',
            'tags', 'images', 'created_at'
        ]
        read_only_fields = ['created_at']

    def get_provider_name(self, obj):
        if hasattr(obj.provider, 'provider_profile'):
            return obj.provider.provider_profile.company_name
        return obj.provider.full_name

    def get_provider_verified(self, obj):
        if hasattr(obj.provider, 'provider_profile'):
            return obj.provider.provider_profile.is_verified
        return False


class RedemptionSerializer(serializers.ModelSerializer):
    perk_name = serializers.CharField(source='perk.name', read_only=True)
    perk_credit_price = serializers.DecimalField(source='perk.credit_price', max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Redemption
        fields = ['id', 'perk', 'perk_name', 'perk_credit_price', 'qr_code', 'status', 'created_at']
