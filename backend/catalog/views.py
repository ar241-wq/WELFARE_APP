from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models.functions import Coalesce
from django.utils import timezone
from users.permissions import IsEmployee, IsProvider
from wallet.models import Wallet, Transaction
from .models import Category, Perk, Redemption, Review, ReputationScore
from .serializers import (
    CategorySerializer, PerkSerializer, RedemptionSerializer,
    ReviewSerializer, PublicReviewSerializer, ReputationScoreSerializer,
)
import qrcode
import io
import base64
import decimal


class CategoryListView(ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]


class PerkListView(ListAPIView):
    serializer_class = PerkSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Perk.objects.filter(is_active=True).select_related(
            'category', 'provider__provider_profile', 'provider__reputation_score'
        )
        category = self.request.query_params.get('category')
        max_price = self.request.query_params.get('max_price')
        search = self.request.query_params.get('search')
        mine = self.request.query_params.get('mine')

        if category:
            qs = qs.filter(category__name__iexact=category)
        if max_price:
            qs = qs.filter(credit_price__lte=max_price)
        if search:
            qs = qs.filter(name__icontains=search)
        if mine and self.request.user.role == 'provider':
            qs = Perk.objects.filter(provider=self.request.user)

        # Annotate with cached rep score; new/unranked providers get 0 (still visible)
        qs = qs.annotate(
            rep_score=Coalesce('provider__reputation_score__composite_score', 0.0)
        ).order_by('-is_featured', '-rep_score', '-created_at')

        return qs


class PerkDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            perk = Perk.objects.get(pk=pk, is_active=True)
        except Perk.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)
        return Response(PerkSerializer(perk).data)


class FeaturedPerksView(ListAPIView):
    serializer_class = PerkSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Perk.objects.filter(is_featured=True, is_active=True)[:8]


class SuggestionsView(APIView):
    permission_classes = [IsEmployee]

    def get(self, request):
        redeemed = Redemption.objects.filter(employee=request.user).values_list('perk__tags', flat=True)
        all_tags = []
        for tags in redeemed:
            if tags:
                all_tags.extend(tags)

        if not all_tags:
            perks = Perk.objects.filter(is_active=True).order_by('?')[:6]
        else:
            from collections import Counter
            top_tags = [tag for tag, _ in Counter(all_tags).most_common(3)]
            redeemed_ids = Redemption.objects.filter(employee=request.user).values_list('perk_id', flat=True)
            perks = Perk.objects.filter(is_active=True).exclude(id__in=redeemed_ids)
            matching = [p for p in perks if any(t in p.tags for t in top_tags)][:6]
            perks = matching if matching else list(perks[:6])

        return Response(PerkSerializer(perks, many=True).data)


class RedeemPerkView(APIView):
    permission_classes = [IsEmployee]

    def post(self, request, pk):
        try:
            perk = Perk.objects.get(pk=pk, is_active=True)
        except Perk.DoesNotExist:
            return Response({'detail': 'Perk not found.'}, status=404)

        wallet, _ = Wallet.objects.get_or_create(employee=request.user)
        if wallet.balance < perk.credit_price:
            return Response({'detail': 'Insufficient credits.'}, status=400)

        wallet.balance -= decimal.Decimal(str(perk.credit_price))
        wallet.save()

        Transaction.objects.create(
            wallet=wallet,
            amount=-perk.credit_price,
            type='debit',
            description=f'Redeemed: {perk.name}'
        )

        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr_data = f'REDEMPTION:{request.user.id}:{perk.id}:{timezone.now().timestamp()}'
        qr.add_data(qr_data)
        qr.make(fit=True)
        img = qr.make_image(fill_color='black', back_color='white')
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        qr_base64 = 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()

        redemption = Redemption.objects.create(
            employee=request.user,
            perk=perk,
            qr_code=qr_base64,
            status='pending'
        )

        return Response(RedemptionSerializer(redemption).data, status=201)


class RedemptionListView(ListAPIView):
    serializer_class = RedemptionSerializer
    permission_classes = [IsEmployee]

    def get_queryset(self):
        return Redemption.objects.filter(employee=self.request.user)


def _resolve_category(name):
    """Get or create a Category by name (case-insensitive)."""
    if not name:
        return None
    cat, _ = Category.objects.get_or_create(
        name__iexact=name,
        defaults={'name': name.capitalize()}
    )
    return cat


class ProviderPerkCreateView(APIView):
    permission_classes = [IsProvider]

    def get(self, request):
        perks = Perk.objects.filter(provider=request.user).select_related('category')
        return Response(PerkSerializer(perks, many=True).data)

    def post(self, request):
        data = request.data.copy()
        # Resolve category name → FK id
        cat_name = data.get('category')
        if cat_name and not str(cat_name).isdigit():
            cat = _resolve_category(cat_name)
            data['category'] = cat.id if cat else None

        serializer = PerkSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(provider=request.user)
        return Response(serializer.data, status=201)

    def patch(self, request, pk):
        try:
            perk = Perk.objects.get(pk=pk, provider=request.user)
        except Perk.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)

        data = request.data.copy()
        cat_name = data.get('category')
        if cat_name and not str(cat_name).isdigit():
            cat = _resolve_category(cat_name)
            data['category'] = cat.id if cat else None

        serializer = PerkSerializer(perk, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        try:
            perk = Perk.objects.get(pk=pk, provider=request.user)
        except Perk.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)
        perk.delete()
        return Response(status=204)


class PerkImageView(APIView):
    permission_classes = [IsProvider]

    def post(self, request, pk):
        try:
            perk = Perk.objects.get(pk=pk, provider=request.user)
        except Perk.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)

        image = request.FILES.get('image')
        if not image:
            return Response({'detail': 'No image provided.'}, status=400)

        from .models import PerkImage
        img = PerkImage.objects.create(perk=perk, image=image)
        from .serializers import PerkImageSerializer
        return Response(PerkImageSerializer(img).data, status=201)

    def delete(self, request, pk, img_pk):
        try:
            perk = Perk.objects.get(pk=pk, provider=request.user)
        except Perk.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)

        from .models import PerkImage
        try:
            img = PerkImage.objects.get(pk=img_pk, perk=perk)
        except PerkImage.DoesNotExist:
            return Response({'detail': 'Image not found.'}, status=404)

        img.image.delete(save=False)
        img.delete()
        return Response(status=204)


class ScanRedemptionView(APIView):
    permission_classes = [IsProvider]

    def post(self, request):
        qr_code = request.data.get('qr_code', '').strip()
        if not qr_code:
            return Response({'detail': 'qr_code is required.'}, status=400)

        redemption = None

        # Format 1: REDEMPTION:<redemption_id>  (new mobile format)
        if qr_code.startswith('REDEMPTION:'):
            parts = qr_code.split(':')
            try:
                redemption_id = int(parts[1])
                redemption = Redemption.objects.filter(
                    pk=redemption_id,
                    perk__provider=request.user,
                ).select_related('perk', 'employee').first()
            except (ValueError, IndexError):
                pass

        # Format 2: plain redemption ID
        if not redemption:
            try:
                redemption = Redemption.objects.filter(
                    pk=int(qr_code),
                    perk__provider=request.user,
                ).select_related('perk', 'employee').first()
            except (ValueError, TypeError):
                pass

        if not redemption:
            return Response({'detail': 'Redemption not found or does not belong to your perks.'}, status=404)

        if redemption.status == 'redeemed':
            return Response({'detail': 'This QR code has already been redeemed.'}, status=400)

        redemption.status = 'redeemed'
        redemption.redeemed_at = timezone.now()
        redemption.save()

        return Response({
            'perk_name': redemption.perk.name,
            'employee_name': redemption.employee.full_name,
            'status': 'redeemed',
            'prompt_review': True,
            'redemption_id': redemption.id,
        })


# ─── Review endpoints ─────────────────────────────────────────────────────────

class ReviewSubmitView(APIView):
    """
    POST /api/catalog/reviews/
    Employee submits a review for a redeemed redemption.
    """
    permission_classes = [IsEmployee]

    def post(self, request):
        redemption_id = request.data.get('redemption_id')
        stars = request.data.get('stars')
        comment = request.data.get('comment', '')

        if not redemption_id:
            return Response({'detail': 'redemption_id is required.'}, status=400)

        try:
            stars = int(stars)
        except (TypeError, ValueError):
            return Response({'detail': 'stars must be an integer 1-5.'}, status=400)

        if not (1 <= stars <= 5):
            return Response({'detail': 'stars must be between 1 and 5.'}, status=400)

        try:
            redemption = Redemption.objects.select_related('perk__provider').get(pk=redemption_id)
        except Redemption.DoesNotExist:
            return Response({'detail': 'Redemption not found.'}, status=404)

        # Security: only the employee who made the redemption can review
        if redemption.employee_id != request.user.id:
            return Response({'detail': 'You can only review your own redemptions.'}, status=403)

        # Allow review on any non-cancelled redemption
        if redemption.status == 'cancelled':
            return Response({'detail': 'Cannot review a cancelled redemption.'}, status=400)

        # Auto-stamp redeemed_at if missing (QR not yet scanned)
        if not redemption.redeemed_at:
            redemption.redeemed_at = timezone.now()
            redemption.save(update_fields=['redeemed_at'])

        # One review per redemption
        if Review.objects.filter(redemption=redemption).exists():
            return Response({'detail': 'You have already reviewed this redemption.'}, status=400)

        review = Review.objects.create(
            redemption=redemption,
            provider=redemption.perk.provider,
            perk=redemption.perk,
            employee=request.user,
            stars=stars,
            comment=comment,
        )

        return Response(ReviewSerializer(review).data, status=201)


class ReviewCheckView(APIView):
    """
    GET /api/catalog/reviews/check/?redemption_id=X
    Returns whether the employee has already reviewed this redemption.
    """
    permission_classes = [IsEmployee]

    def get(self, request):
        redemption_id = request.query_params.get('redemption_id')
        if not redemption_id:
            return Response({'detail': 'redemption_id is required.'}, status=400)
        try:
            redemption = Redemption.objects.get(pk=redemption_id, employee=request.user)
        except Redemption.DoesNotExist:
            return Response({'detail': 'Redemption not found.'}, status=404)

        reviewed = Review.objects.filter(redemption=redemption).exists()
        return Response({
            'reviewed': reviewed,
            'status': redemption.status,
        })


class ProviderReviewListView(ListAPIView):
    """
    GET /api/catalog/providers/<provider_id>/reviews/
    Public (authenticated) — anonymous reviews only.
    """
    serializer_class = PublicReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        provider_id = self.kwargs['provider_id']
        return Review.objects.filter(
            provider_id=provider_id
        ).select_related('perk').order_by('-created_at')


class TopProvidersView(APIView):
    """GET /api/catalog/providers/top/ — top 3 providers by composite score."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        limit = int(request.query_params.get('limit', 3))
        scores = ReputationScore.objects.filter(
            review_count__gte=10,
            composite_score__isnull=False,
        ).select_related('provider__provider_profile').order_by('-composite_score')[:limit]

        result = []
        for rep in scores:
            provider = rep.provider
            try:
                company_name = provider.provider_profile.company_name or provider.full_name
                logo = provider.provider_profile.logo.url if provider.provider_profile.logo else None
            except Exception:
                company_name = provider.full_name
                logo = None

            perks = Perk.objects.filter(provider=provider, is_active=True)
            result.append({
                'provider_id': provider.id,
                'company_name': company_name,
                'logo': request.build_absolute_uri(logo) if logo else None,
                'tier': rep.tier,
                'composite_score': round(rep.composite_score, 1),
                'avg_stars': round(rep.avg_stars, 2) if rep.avg_stars else None,
                'review_count': rep.review_count,
                'perk_count': perks.count(),
                'top_perk': perks.first().name if perks.exists() else None,
            })

        return Response(result)


class PerkReviewListView(APIView):
    """GET /api/catalog/perks/<pk>/reviews/ — recent reviews for a specific perk."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        reviews = Review.objects.filter(perk_id=pk).order_by('-created_at')[:20]
        data = [{
            'stars': r.stars,
            'comment': r.comment,
            'created_at': r.created_at.isoformat(),
        } for r in reviews]
        return Response(data)


class ProviderReputationView(APIView):
    """
    GET /api/catalog/providers/<provider_id>/reputation/
    Returns cached ReputationScore. Never triggers recomputation.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, provider_id):
        try:
            rep = ReputationScore.objects.get(provider_id=provider_id)
        except ReputationScore.DoesNotExist:
            # Provider has no score yet — return unranked stub
            return Response({
                'tier': 'unranked',
                'composite_score': None,
                'avg_stars': None,
                'review_count': 0,
                'redemption_count': 0,
                'repeat_rate': 0,
                'consistency_score': 0,
                'score_breakdown': {},
                'gap_to_next': {},
                'reviews_needed': 10,
            })

        data = ReputationScoreSerializer(rep).data
        if rep.review_count < 10:
            data['reviews_needed'] = max(0, 10 - rep.review_count)
        return Response(data)
