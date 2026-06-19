from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from users.permissions import IsEmployee
from .models import Wallet, Transaction
from .serializers import WalletSerializer, TransactionSerializer, DonateSerializer
import decimal


class WalletView(APIView):
    permission_classes = [IsEmployee]

    def get(self, request):
        wallet, _ = Wallet.objects.get_or_create(employee=request.user)
        return Response({
            'balance': wallet.balance,
            'currency': 'credits',
            'updated_at': wallet.updated_at,
        })


class TransactionListView(APIView):
    permission_classes = [IsEmployee]

    def get(self, request):
        wallet, _ = Wallet.objects.get_or_create(employee=request.user)
        transactions = wallet.transactions.all()[:50]
        return Response(TransactionSerializer(transactions, many=True).data)


class DonateView(APIView):
    permission_classes = [IsEmployee]

    def post(self, request):
        serializer = DonateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from life_moments.models import LifeEvent
        try:
            event = LifeEvent.objects.get(id=serializer.validated_data['life_event_id'], is_active=True)
        except LifeEvent.DoesNotExist:
            return Response({'detail': 'Life event not found.'}, status=404)

        if event.employee == request.user:
            return Response({'detail': 'You cannot donate to yourself.'}, status=400)

        amount = serializer.validated_data['amount']
        donor_wallet, _ = Wallet.objects.get_or_create(employee=request.user)

        if donor_wallet.balance < amount:
            return Response({'detail': 'Insufficient credits.'}, status=400)

        recipient_wallet, _ = Wallet.objects.get_or_create(employee=event.employee)

        donor_wallet.balance -= decimal.Decimal(str(amount))
        donor_wallet.save()

        recipient_wallet.balance += decimal.Decimal(str(amount))
        recipient_wallet.save()

        Transaction.objects.create(
            wallet=donor_wallet,
            amount=-amount,
            type='donation',
            description='Anonymous donation to a colleague\'s life event'
        )
        Transaction.objects.create(
            wallet=recipient_wallet,
            amount=amount,
            type='donation',
            description='Your team sent you care credits'
        )

        from life_moments.models import CreditDonation
        CreditDonation.objects.create(
            from_wallet=donor_wallet,
            to_wallet=recipient_wallet,
            life_event=event,
            amount=amount,
            is_anonymous=True
        )

        return Response({'detail': 'Credits donated anonymously.', 'amount': str(amount)})
