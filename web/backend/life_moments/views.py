from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from users.permissions import IsEmployee, IsEmployer
from companies.models import Company
from catalog.models import Perk
from wallet.models import Wallet, Transaction
from .models import LifeEvent, CarePackage, CreditDonation
from .serializers import LifeEventSerializer, ApproveCarePackageSerializer
import decimal


def suggest_perks_for_event(event_type):
    tags = LifeEvent.EVENT_TAGS.get(event_type, [])
    all_perks = Perk.objects.filter(is_active=True)
    seen = set()
    unique_perks = []
    for perk in all_perks:
        perk_tags = perk.tags or []
        if any(t in perk_tags for t in tags) and perk.id not in seen:
            seen.add(perk.id)
            unique_perks.append(perk)
        if len(unique_perks) >= 5:
            break
    return unique_perks


class LifeEventView(APIView):
    permission_classes = [IsEmployee]

    def get(self, request):
        events = LifeEvent.objects.filter(employee=request.user).order_by('-created_at')
        return Response(LifeEventSerializer(events, many=True).data)

    def post(self, request):
        serializer = LifeEventSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        event = serializer.save(employee=request.user)

        suggested_perks = suggest_perks_for_event(event.event_type)
        care_package = CarePackage.objects.create(life_event=event)
        care_package.perks.set(suggested_perks)

        return Response(LifeEventSerializer(event).data, status=201)


class PendingLifeEventsView(ListAPIView):
    permission_classes = [IsEmployer]
    serializer_class = LifeEventSerializer

    def get_queryset(self):
        company = Company.objects.filter(created_by=self.request.user).first()
        if not company:
            return LifeEvent.objects.none()
        return LifeEvent.objects.filter(
            employee__company=company,
            care_package__status='pending_approval'
        ).select_related('employee', 'care_package')


class ApproveCarePackageView(APIView):
    permission_classes = [IsEmployer]

    def post(self, request, pk):
        try:
            event = LifeEvent.objects.get(pk=pk)
            care_package = event.care_package
        except (LifeEvent.DoesNotExist, CarePackage.DoesNotExist):
            return Response({'detail': 'Not found.'}, status=404)

        serializer = ApproveCarePackageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        credit_boost = serializer.validated_data.get('credit_boost', 0)
        care_package.status = 'approved'
        care_package.credit_boost = credit_boost
        care_package.approved_by = request.user
        care_package.approved_at = timezone.now()
        care_package.save()

        if credit_boost > 0:
            wallet, _ = Wallet.objects.get_or_create(employee=event.employee)
            wallet.balance += decimal.Decimal(str(credit_boost))
            wallet.save()
            Transaction.objects.create(
                wallet=wallet,
                amount=credit_boost,
                type='credit',
                description=f'Care package credit boost — {event.get_event_type_display()}'
            )

        return Response(LifeEventSerializer(event).data)


class CompanyFeedView(APIView):
    """Active life events from colleagues in the same company."""
    permission_classes = [IsEmployee]

    def get(self, request):
        if not request.user.company:
            return Response([])
        events = LifeEvent.objects.filter(
            employee__company=request.user.company,
            is_active=True,
        ).exclude(employee=request.user).select_related('employee').order_by('-created_at')[:20]
        return Response([{
            'id': e.id,
            'event_type': e.event_type,
            'event_type_display': e.get_event_type_display(),
            'employee_id': e.employee.id,
            'employee_name': e.employee.full_name,
            'created_at': e.created_at.isoformat(),
            'total_donations': sum(d.amount for d in e.donations.all()),
        } for e in events])


class DonateToEventView(APIView):
    permission_classes = [IsEmployee]

    def get(self, request, pk):
        try:
            event = LifeEvent.objects.get(pk=pk, is_active=True)
        except LifeEvent.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)

        total_donations = sum(d.amount for d in event.donations.all())
        donor_count = event.donations.values('from_wallet').distinct().count()
        return Response({
            'event_type': event.get_event_type_display(),
            'total_donations': total_donations,
            'donor_count': donor_count,
        })

    def post(self, request, pk):
        try:
            event = LifeEvent.objects.get(pk=pk, is_active=True)
        except LifeEvent.DoesNotExist:
            return Response({'detail': 'Life event not found.'}, status=404)

        if event.employee == request.user:
            return Response({'detail': 'You cannot donate to yourself.'}, status=400)

        amount = request.data.get('amount')
        if not amount:
            return Response({'detail': 'Amount is required.'}, status=400)

        try:
            amount = decimal.Decimal(str(amount))
        except Exception:
            return Response({'detail': 'Invalid amount.'}, status=400)

        donor_wallet, _ = Wallet.objects.get_or_create(employee=request.user)
        if donor_wallet.balance < amount:
            return Response({'detail': 'Insufficient credits.'}, status=400)

        recipient_wallet, _ = Wallet.objects.get_or_create(employee=event.employee)

        donor_wallet.balance -= amount
        donor_wallet.save()
        recipient_wallet.balance += amount
        recipient_wallet.save()

        Transaction.objects.create(
            wallet=donor_wallet,
            amount=-amount,
            type='donation',
            description="Anonymous donation to a colleague's life event"
        )
        Transaction.objects.create(
            wallet=recipient_wallet,
            amount=amount,
            type='donation',
            description='Your team sent you care credits'
        )

        CreditDonation.objects.create(
            from_wallet=donor_wallet,
            to_wallet=recipient_wallet,
            life_event=event,
            amount=amount,
            is_anonymous=True
        )

        return Response({'detail': 'Credits donated anonymously.', 'amount': str(amount)})
