from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from catalog.models import Perk
from wallet.models import Wallet, Transaction
from .models import GroupBuy, GroupBuyMember, discount_for_count
from .serializers import GroupBuySerializer
from decimal import Decimal


class PerkGroupBuysView(APIView):
    """List active group buys for a perk, or start one."""
    permission_classes = [IsAuthenticated]

    def get(self, request, perk_id):
        buys = GroupBuy.objects.filter(
            perk_id=perk_id, status='open', expires_at__gt=timezone.now()
        ).prefetch_related('members__user')
        return Response(GroupBuySerializer(buys, many=True, context={'request': request}).data)

    def post(self, request, perk_id):
        try:
            perk = Perk.objects.get(pk=perk_id)
        except Perk.DoesNotExist:
            return Response({'detail': 'Perk not found.'}, status=404)
        # Check if user already in an open group buy for this perk
        existing = GroupBuy.objects.filter(
            perk=perk, status='open', expires_at__gt=timezone.now(),
            members__user=request.user
        ).first()
        if existing:
            return Response({'detail': 'You are already in a group buy for this perk.', 'id': existing.id}, status=400)
        group_buy = GroupBuy.objects.create(perk=perk, created_by=request.user)
        GroupBuyMember.objects.create(group_buy=group_buy, user=request.user)
        return Response(GroupBuySerializer(group_buy, context={'request': request}).data, status=201)


class GroupBuyDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            gb = GroupBuy.objects.get(pk=pk)
        except GroupBuy.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)
        return Response(GroupBuySerializer(gb, context={'request': request}).data)


class GroupBuyJoinView(APIView):
    """Join or leave a group buy."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            gb = GroupBuy.objects.get(pk=pk, status='open')
        except GroupBuy.DoesNotExist:
            return Response({'detail': 'Group buy not found or closed.'}, status=404)
        if not gb.is_active:
            return Response({'detail': 'This group buy has expired.'}, status=400)
        member, created = GroupBuyMember.objects.get_or_create(group_buy=gb, user=request.user)
        if not created:
            if member.locked_in:
                return Response({'detail': 'Already locked in — cannot leave.'}, status=400)
            member.delete()
            return Response({'joined': False, 'member_count': gb.member_count, 'discount': float(gb.discount_rate)})
        return Response({'joined': True, 'member_count': gb.member_count, 'discount': float(gb.discount_rate)})


class GroupBuyLockInView(APIView):
    """Lock in to the group buy — deducts credits at the discounted price."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            gb = GroupBuy.objects.get(pk=pk, status='open')
        except GroupBuy.DoesNotExist:
            return Response({'detail': 'Not found or closed.'}, status=404)
        if not gb.is_active:
            return Response({'detail': 'Group buy expired.'}, status=400)
        try:
            member = GroupBuyMember.objects.get(group_buy=gb, user=request.user)
        except GroupBuyMember.DoesNotExist:
            return Response({'detail': 'You have not joined this group buy.'}, status=400)
        if member.locked_in:
            return Response({'detail': 'Already locked in.'}, status=400)

        price = gb.discounted_price
        wallet, _ = Wallet.objects.get_or_create(employee=request.user)
        if Decimal(str(wallet.balance)) < price:
            return Response({'detail': f'Insufficient credits. Need {price:.0f}, have {wallet.balance}.'}, status=400)

        wallet.balance = Decimal(str(wallet.balance)) - price
        wallet.save()

        Transaction.objects.create(
            wallet=wallet,
            amount=-price,
            type='debit',
            description=f'Group Buy: {gb.perk.name} ({int(gb.discount_rate * 100)}% off)',
        )

        member.locked_in = True
        member.locked_price = price
        member.save()

        return Response({
            'detail': f'Locked in at {price:.0f} credits ({int(gb.discount_rate * 100)}% off)!',
            'price_paid': float(price),
            'discount_applied': float(gb.discount_rate),
            'savings': float(gb.perk.credit_price * gb.discount_rate),
        })


class MyGroupBuysView(APIView):
    """All group buys the current user is in."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        buy_ids = GroupBuyMember.objects.filter(user=request.user).values_list('group_buy_id', flat=True)
        buys = GroupBuy.objects.filter(pk__in=buy_ids, status='open', expires_at__gt=timezone.now())
        return Response(GroupBuySerializer(buys, many=True, context={'request': request}).data)
