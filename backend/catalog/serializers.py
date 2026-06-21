from rest_framework import serializers
from .models import Category, Perk, PerkImage, Redemption, Review, ReputationScore


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
    avg_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    reputation_tier = serializers.SerializerMethodField()

    class Meta:
        model = Perk
        fields = [
            'id', 'name', 'description', 'credit_price', 'category', 'category_name',
            'provider_name', 'provider_verified', 'is_active', 'is_featured',
            'tags', 'images', 'created_at',
            'avg_rating', 'review_count', 'reputation_tier',
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

    def _get_reputation(self, obj):
        """Return cached ReputationScore or None — never triggers recomputation."""
        try:
            return obj.provider.reputation_score
        except Exception:
            return None

    def get_avg_rating(self, obj):
        rep = self._get_reputation(obj)
        if rep is None or (rep.review_count or 0) < 10:
            return None
        return rep.avg_stars

    def get_review_count(self, obj):
        rep = self._get_reputation(obj)
        if rep is None:
            return 0
        return rep.review_count or 0

    def get_reputation_tier(self, obj):
        rep = self._get_reputation(obj)
        if rep is None or (rep.review_count or 0) < 10:
            return 'unranked'
        return rep.tier


class RedemptionSerializer(serializers.ModelSerializer):
    perk_name = serializers.CharField(source='perk.name', read_only=True)
    perk_credit_price = serializers.DecimalField(source='perk.credit_price', max_digits=10, decimal_places=2, read_only=True)
    credit_price = serializers.DecimalField(source='perk.credit_price', max_digits=10, decimal_places=2, read_only=True)
    provider_name = serializers.SerializerMethodField()

    def get_provider_name(self, obj):
        try:
            return obj.perk.provider.provider_profile.company_name or obj.perk.provider.full_name
        except Exception:
            return ''

    class Meta:
        model = Redemption
        fields = ['id', 'perk', 'perk_name', 'perk_credit_price', 'credit_price', 'provider_name', 'qr_code', 'status', 'created_at', 'redeemed_at']


class ReviewSerializer(serializers.ModelSerializer):
    """Full review — used for write operations and provider's own reviews list."""
    perk_name = serializers.CharField(source='perk.name', read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'stars', 'comment', 'perk_name', 'created_at']
        read_only_fields = ['id', 'created_at']


class PublicReviewSerializer(serializers.ModelSerializer):
    """Anonymous review — never exposes employee identity."""
    perk_name = serializers.CharField(source='perk.name', read_only=True)

    class Meta:
        model = Review
        fields = ['stars', 'comment', 'perk_name', 'created_at']


class ReputationScoreSerializer(serializers.ModelSerializer):
    reviews_needed = serializers.SerializerMethodField()

    class Meta:
        model = ReputationScore
        fields = [
            'tier', 'composite_score', 'avg_stars', 'review_count',
            'redemption_count', 'repeat_rate', 'consistency_score',
            'score_breakdown', 'gap_to_next', 'last_calculated',
            'reviews_needed',
        ]

    def get_reviews_needed(self, obj):
        from catalog.reputation import TIER_MIN_REVIEWS
        needed = TIER_MIN_REVIEWS.get('bronze', 10)
        return max(0, needed - (obj.review_count or 0))
