from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from users.permissions import IsEmployee, IsProvider
from wallet.models import Wallet, Transaction
from .models import Category, Perk, Redemption
from .serializers import CategorySerializer, PerkSerializer, RedemptionSerializer
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
        qs = Perk.objects.filter(is_active=True).select_related('category', 'provider__provider_profile')
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

        # Auto-join the community group chat for this perk's category
        if perk.category:
            from chat.models import GroupChat
            group, _ = GroupChat.objects.get_or_create(
                category=perk.category,
                defaults={'name': perk.category.name},
            )
            group.members.add(request.user)

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
        })
