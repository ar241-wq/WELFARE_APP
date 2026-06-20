import uuid
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Q
from users.permissions import IsProvider, IsEmployer, IsEmployee
from catalog.models import Perk, Redemption
from wallet.models import Wallet, Transaction
from .models import Collaboration, PackageDeal
from .serializers import CollaborationSerializer, PackageDealSerializer

User = get_user_model()


class CollaborationListView(APIView):
    permission_classes = [IsProvider]

    def get(self, request):
        collabs = Collaboration.objects.filter(
            Q(from_provider=request.user) | Q(to_provider=request.user)
        ).select_related('from_provider', 'to_provider').order_by('-created_at')
        return Response(CollaborationSerializer(collabs, many=True).data)

    def post(self, request):
        email = request.data.get('email', '').strip()
        message = request.data.get('message', '').strip()

        if not email:
            return Response({'detail': 'Provider email is required.'}, status=400)

        try:
            to_provider = User.objects.get(email=email, role='provider')
        except User.DoesNotExist:
            return Response({'detail': 'No provider found with that email.'}, status=404)

        if to_provider == request.user:
            return Response({'detail': 'You cannot collaborate with yourself.'}, status=400)

        # Check if already exists
        existing = Collaboration.objects.filter(
            Q(from_provider=request.user, to_provider=to_provider) |
            Q(from_provider=to_provider, to_provider=request.user)
        ).first()

        if existing:
            if existing.status == 'accepted':
                return Response({'detail': 'You already have an active collaboration.'}, status=400)
            if existing.status == 'pending':
                return Response({'detail': 'A collaboration invite is already pending.'}, status=400)
            # declined — allow re-invite by updating
            existing.status = 'pending'
            existing.message = message
            existing.responded_at = None
            existing.save()
            return Response(CollaborationSerializer(existing).data, status=201)

        collab = Collaboration.objects.create(
            from_provider=request.user,
            to_provider=to_provider,
            message=message,
        )
        return Response(CollaborationSerializer(collab).data, status=201)


class CollaborationRespondView(APIView):
    permission_classes = [IsProvider]

    def patch(self, request, pk):
        try:
            collab = Collaboration.objects.get(pk=pk, to_provider=request.user, status='pending')
        except Collaboration.DoesNotExist:
            return Response({'detail': 'Invite not found.'}, status=404)

        action = request.data.get('action')
        if action not in ('accept', 'decline'):
            return Response({'detail': 'action must be "accept" or "decline".'}, status=400)

        collab.status = 'accepted' if action == 'accept' else 'declined'
        collab.responded_at = timezone.now()
        collab.save()
        return Response(CollaborationSerializer(collab).data)


class CollaborationPerksView(APIView):
    """Return all active perks from both providers in an accepted collaboration."""
    permission_classes = [IsProvider]

    def get(self, request, pk):
        from catalog.models import Perk
        from catalog.serializers import PerkSerializer

        try:
            collab = Collaboration.objects.get(pk=pk, status='accepted')
            if request.user not in (collab.from_provider, collab.to_provider):
                raise Collaboration.DoesNotExist
        except Collaboration.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)

        def provider_data(provider):
            name = getattr(getattr(provider, 'provider_profile', None), 'company_name', None) or provider.full_name
            perks = Perk.objects.filter(provider=provider, is_active=True).select_related('category')
            return {'id': provider.id, 'name': name, 'perks': PerkSerializer(perks, many=True).data}

        return Response({
            'from_provider': provider_data(collab.from_provider),
            'to_provider': provider_data(collab.to_provider),
        })


class CollaborationDetailView(APIView):
    permission_classes = [IsProvider]

    def patch(self, request, pk):
        """Allow the sender to edit a pending invite's message."""
        try:
            collab = Collaboration.objects.get(pk=pk, from_provider=request.user, status='pending')
        except Collaboration.DoesNotExist:
            return Response({'detail': 'Invite not found.'}, status=404)

        if 'message' in request.data:
            collab.message = request.data['message']
            collab.save()
        return Response(CollaborationSerializer(collab).data)

    def delete(self, request, pk):
        """Allow the sender to cancel/delete a pending invite."""
        try:
            collab = Collaboration.objects.get(pk=pk, from_provider=request.user, status='pending')
        except Collaboration.DoesNotExist:
            return Response({'detail': 'Invite not found.'}, status=404)

        collab.delete()
        return Response(status=204)


class PackageDealListView(APIView):
    permission_classes = [IsProvider]

    def get(self, request):
        packages = PackageDeal.objects.filter(
            Q(collaboration__from_provider=request.user) |
            Q(collaboration__to_provider=request.user)
        ).select_related('collaboration__from_provider', 'collaboration__to_provider',
                         'target_employer').prefetch_related('perks').order_by('-created_at')
        return Response(PackageDealSerializer(packages, many=True).data)

    def post(self, request):
        collab_id = request.data.get('collaboration_id')
        name = request.data.get('name', '').strip()

        if not collab_id or not name:
            return Response({'detail': 'collaboration_id and name are required.'}, status=400)

        try:
            collab = Collaboration.objects.get(
                pk=collab_id, status='accepted',
            )
            if request.user not in (collab.from_provider, collab.to_provider):
                raise Collaboration.DoesNotExist
        except Collaboration.DoesNotExist:
            return Response({'detail': 'Active collaboration not found.'}, status=404)

        package = PackageDeal.objects.create(
            collaboration=collab,
            name=name,
            description=request.data.get('description', ''),
            total_price=request.data.get('total_price', 0),
            created_by=request.user,
        )

        perk_ids = request.data.get('perk_ids', [])
        if perk_ids:
            valid_perks = Perk.objects.filter(
                id__in=perk_ids,
                provider__in=[collab.from_provider, collab.to_provider]
            )
            package.perks.set(valid_perks)

        return Response(PackageDealSerializer(package).data, status=201)


class PackageDealDetailView(APIView):
    permission_classes = [IsProvider]

    def _get_package(self, request, pk):
        try:
            pkg = PackageDeal.objects.get(pk=pk)
            collab = pkg.collaboration
            if request.user not in (collab.from_provider, collab.to_provider):
                return None
            return pkg
        except PackageDeal.DoesNotExist:
            return None

    def patch(self, request, pk):
        pkg = self._get_package(request, pk)
        if not pkg:
            return Response({'detail': 'Not found.'}, status=404)
        if pkg.status in ('offered', 'accepted'):
            return Response({'detail': 'Cannot edit after offering.'}, status=400)

        if 'name' in request.data:
            pkg.name = request.data['name']
        if 'description' in request.data:
            pkg.description = request.data['description']
        if 'total_price' in request.data:
            pkg.total_price = request.data['total_price']

        # Target employer by email
        employer_email = request.data.get('target_employer_email')
        if employer_email:
            try:
                employer = User.objects.get(email=employer_email, role='employer')
                pkg.target_employer = employer
            except User.DoesNotExist:
                return Response({'detail': 'Employer not found.'}, status=404)

        # Update perks
        perk_ids = request.data.get('perk_ids')
        changed = False
        if perk_ids is not None:
            collab = pkg.collaboration
            valid_perks = Perk.objects.filter(
                id__in=perk_ids,
                provider__in=[collab.from_provider, collab.to_provider]
            )
            pkg.perks.set(valid_perks)
            changed = True

        if 'total_price' in request.data:
            changed = True

        # Any change resets both confirmations so both must re-agree
        if changed:
            pkg.from_provider_confirmed = False
            pkg.to_provider_confirmed = False

        pkg.save()
        return Response(PackageDealSerializer(pkg).data)

    def delete(self, request, pk):
        pkg = self._get_package(request, pk)
        if not pkg:
            return Response({'detail': 'Not found.'}, status=404)
        pkg.delete()
        return Response(status=204)


class PackageDealConfirmView(APIView):
    """Toggle the current provider's agreement on a draft package."""
    permission_classes = [IsProvider]

    def post(self, request, pk):
        try:
            pkg = PackageDeal.objects.get(pk=pk, status='draft')
            collab = pkg.collaboration
            if request.user not in (collab.from_provider, collab.to_provider):
                raise PackageDeal.DoesNotExist
        except PackageDeal.DoesNotExist:
            return Response({'detail': 'Package not found.'}, status=404)

        if request.user == collab.from_provider:
            pkg.from_provider_confirmed = not pkg.from_provider_confirmed
        else:
            pkg.to_provider_confirmed = not pkg.to_provider_confirmed
        pkg.save()
        return Response(PackageDealSerializer(pkg).data)


class PackageDealOfferView(APIView):
    permission_classes = [IsProvider]

    def post(self, request, pk):
        try:
            pkg = PackageDeal.objects.get(pk=pk)
            collab = pkg.collaboration
            if request.user not in (collab.from_provider, collab.to_provider):
                raise PackageDeal.DoesNotExist
        except PackageDeal.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)

        if not pkg.target_employer:
            return Response({'detail': 'Set a target employer before offering.'}, status=400)
        if pkg.perks.count() == 0:
            return Response({'detail': 'Add at least one perk before offering.'}, status=400)
        if pkg.status != 'draft':
            return Response({'detail': 'Package has already been offered.'}, status=400)
        if not (pkg.from_provider_confirmed and pkg.to_provider_confirmed):
            return Response({'detail': 'Both providers must confirm the package before offering.'}, status=400)

        pkg.status = 'offered'
        pkg.offered_at = timezone.now()
        pkg.save()
        return Response(PackageDealSerializer(pkg).data)


# ── Employer side ──────────────────────────────────────────────────────────

class EmployerPackageOffersView(APIView):
    permission_classes = [IsEmployer]

    def get(self, request):
        packages = PackageDeal.objects.filter(
            target_employer=request.user
        ).select_related(
            'collaboration__from_provider', 'collaboration__to_provider'
        ).prefetch_related('perks').order_by('-offered_at')
        return Response(PackageDealSerializer(packages, many=True).data)


class EmployerPackageRespondView(APIView):
    permission_classes = [IsEmployer]

    def patch(self, request, pk):
        try:
            pkg = PackageDeal.objects.get(pk=pk, target_employer=request.user, status='offered')
        except PackageDeal.DoesNotExist:
            return Response({'detail': 'Package offer not found.'}, status=404)

        action = request.data.get('action')
        if action not in ('accept', 'reject'):
            return Response({'detail': 'action must be "accept" or "reject".'}, status=400)

        pkg.status = 'accepted' if action == 'accept' else 'rejected'
        pkg.responded_at = timezone.now()
        pkg.save()
        return Response(PackageDealSerializer(pkg).data)


# ── Employee side ──────────────────────────────────────────────────────────

class EmployeePackagesView(APIView):
    permission_classes = [IsEmployee]

    def get(self, request):
        if not request.user.company:
            return Response([])

        # Find the employer who owns the employee's company
        employer = request.user.company.created_by

        packages = PackageDeal.objects.filter(
            target_employer=employer,
            status='accepted',
        ).select_related(
            'collaboration__from_provider', 'collaboration__to_provider'
        ).prefetch_related('perks__category').order_by('-responded_at')

        return Response(PackageDealSerializer(packages, many=True).data)


class RedeemPackageView(APIView):
    permission_classes = [IsEmployee]

    def post(self, request, pk):
        if not request.user.company:
            return Response({'detail': 'You are not part of a company.'}, status=400)

        employer = request.user.company.created_by

        try:
            pkg = PackageDeal.objects.get(pk=pk, target_employer=employer, status='accepted')
        except PackageDeal.DoesNotExist:
            return Response({'detail': 'Package not found or not available.'}, status=404)

        perks = list(pkg.perks.all())
        if not perks:
            return Response({'detail': 'This package has no perks.'}, status=400)

        total_cost = sum(p.credit_price for p in perks)

        try:
            wallet = request.user.wallet
        except Exception:
            return Response({'detail': 'Wallet not found.'}, status=400)

        if wallet.balance < total_cost:
            return Response({
                'detail': f'Insufficient credits. Need {total_cost}, have {wallet.balance}.'
            }, status=400)

        # Deduct balance
        wallet.balance -= total_cost
        wallet.save()

        Transaction.objects.create(
            wallet=wallet,
            amount=total_cost,
            type='debit',
            description=f'Package: {pkg.name}',
            reference_id=f'pkg_{pkg.id}',
        )

        # Create a Redemption per perk
        redemptions = []
        for perk in perks:
            r = Redemption.objects.create(
                employee=request.user,
                perk=perk,
                qr_code=str(uuid.uuid4()),
                status='pending',
            )
            redemptions.append({
                'id': r.id,
                'perk': perk.name,
                'qr_code': r.qr_code,
            })

        return Response({
            'message': f'Successfully redeemed package "{pkg.name}".',
            'credits_spent': float(total_cost),
            'new_balance': float(wallet.balance),
            'redemptions': redemptions,
        })
