from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from decimal import Decimal
from companies.models import Company
from wallet.models import Wallet, Transaction
from .models import InternalPerk, InternalPerkRedemption
from .serializers import InternalPerkSerializer, InternalPerkRedemptionSerializer


def get_user_company(user):
    # Employees and employers both have a direct company FK on the User model
    if user.company:
        return user.company
    # Employers may own a company via created_by
    return Company.objects.filter(created_by=user).first()


def is_hr(user):
    return user.role == 'employer'


class InternalPerkListView(APIView):
    """List active internal perks for the user's company. Employers can also create."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company = get_user_company(request.user)
        if not company:
            return Response([])
        perks = InternalPerk.objects.filter(company=company, is_active=True)
        return Response(InternalPerkSerializer(perks, many=True, context={'request': request}).data)

    def post(self, request):
        if not is_hr(request.user):
            return Response({'detail': 'Employer only.'}, status=403)
        company = get_user_company(request.user)
        if not company:
            return Response({'detail': 'No company found.'}, status=400)
        title = request.data.get('title', '').strip()
        description = request.data.get('description', '').strip()
        if not title or not description:
            return Response({'detail': 'title and description required.'}, status=400)
        perk = InternalPerk.objects.create(
            company=company,
            created_by=request.user,
            title=title,
            description=description,
            icon=request.data.get('icon', '🎁'),
            credit_cost=request.data.get('credit_cost', 0),
            is_free=request.data.get('is_free', False),
            available_slots=request.data.get('available_slots') or None,
            requires_approval=request.data.get('requires_approval', True),
        )
        return Response(InternalPerkSerializer(perk, context={'request': request}).data, status=201)


class InternalPerkDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            perk = InternalPerk.objects.get(pk=pk)
        except InternalPerk.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)
        return Response(InternalPerkSerializer(perk, context={'request': request}).data)

    def patch(self, request, pk):
        if not is_hr(request.user):
            return Response({'detail': 'Employer only.'}, status=403)
        try:
            perk = InternalPerk.objects.get(pk=pk)
        except InternalPerk.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)
        for field in ('title', 'description', 'icon', 'credit_cost', 'is_free', 'available_slots', 'requires_approval', 'is_active'):
            if field in request.data:
                setattr(perk, field, request.data[field])
        perk.save()
        return Response(InternalPerkSerializer(perk, context={'request': request}).data)

    def delete(self, request, pk):
        if not is_hr(request.user):
            return Response({'detail': 'Employer only.'}, status=403)
        try:
            perk = InternalPerk.objects.get(pk=pk)
        except InternalPerk.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)
        perk.is_active = False
        perk.save()
        return Response(status=204)


class InternalPerkRedeemView(APIView):
    """Employee requests/redeems an internal perk."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            perk = InternalPerk.objects.get(pk=pk, is_active=True)
        except InternalPerk.DoesNotExist:
            return Response({'detail': 'Perk not found.'}, status=404)

        # Check already requested
        if perk.redemptions.filter(employee=request.user, status__in=('pending', 'approved')).exists():
            return Response({'detail': 'You have already requested this perk.'}, status=400)

        # Check slots
        if perk.slots_remaining is not None and perk.slots_remaining <= 0:
            return Response({'detail': 'No slots remaining.'}, status=400)

        # Handle credit cost
        if not perk.is_free and perk.credit_cost > 0:
            wallet, _ = Wallet.objects.get_or_create(employee=request.user)
            if Decimal(str(wallet.balance)) < perk.credit_cost:
                return Response({'detail': 'Insufficient credits.'}, status=400)
            wallet.balance = Decimal(str(wallet.balance)) - perk.credit_cost
            wallet.save()
            Transaction.objects.create(
                wallet=wallet,
                amount=-perk.credit_cost,
                type='debit',
                description=f'Internal Perk: {perk.title}',
            )

        note = request.data.get('note', '')
        redemption = InternalPerkRedemption.objects.create(
            perk=perk, employee=request.user, note=note,
            status='approved' if not perk.requires_approval else 'pending',
        )
        return Response({
            'detail': 'Approved!' if not perk.requires_approval else 'Request submitted — awaiting approval.',
            'status': redemption.status,
            'redemption_id': redemption.id,
        }, status=201)


class HRRedemptionListView(APIView):
    """Employer sees all pending/recent redemptions for their company's internal perks."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_hr(request.user):
            return Response({'detail': 'Employer only.'}, status=403)
        company = get_user_company(request.user)
        if not company:
            return Response([])
        redemptions = InternalPerkRedemption.objects.filter(
            perk__company=company
        ).select_related('perk', 'employee').order_by('-requested_at')
        status_filter = request.query_params.get('status')
        if status_filter:
            redemptions = redemptions.filter(status=status_filter)
        return Response(InternalPerkRedemptionSerializer(redemptions, many=True).data)


class HRRedemptionResolveView(APIView):
    """Employer approves or denies a redemption."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not is_hr(request.user):
            return Response({'detail': 'Employer only.'}, status=403)
        try:
            redemption = InternalPerkRedemption.objects.get(pk=pk)
        except InternalPerkRedemption.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)
        action = request.data.get('action')  # 'approve' or 'deny'
        if action not in ('approve', 'deny'):
            return Response({'detail': 'action must be approve or deny.'}, status=400)
        redemption.status = 'approved' if action == 'approve' else 'denied'
        redemption.hr_note = request.data.get('hr_note', '')
        redemption.resolved_at = timezone.now()
        redemption.save()

        # Refund credits if denied and perk had a credit cost
        if redemption.status == 'denied' and not redemption.perk.is_free and redemption.perk.credit_cost > 0:
            wallet, _ = Wallet.objects.get_or_create(employee=redemption.employee)
            wallet.balance = Decimal(str(wallet.balance)) + redemption.perk.credit_cost
            wallet.save()
            Transaction.objects.create(
                wallet=wallet,
                amount=redemption.perk.credit_cost,
                type='refund',
                description=f'Refund: Internal Perk denied — {redemption.perk.title}',
            )

        return Response({'detail': f'Redemption {redemption.status}.', 'status': redemption.status})
