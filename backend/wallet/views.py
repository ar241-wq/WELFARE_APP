from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from users.permissions import IsEmployee
from .models import Wallet, Transaction, BirthdayGift
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


class GiftCreditsView(APIView):
    permission_classes = [IsEmployee]

    def post(self, request):
        recipient_id = request.data.get('recipient_id')
        amount = request.data.get('amount')
        note = request.data.get('note', '').strip()

        if not recipient_id or not amount:
            return Response({'detail': 'recipient_id and amount are required.'}, status=400)

        try:
            amount = decimal.Decimal(str(amount))
        except Exception:
            return Response({'detail': 'Invalid amount.'}, status=400)

        if amount <= 0 or amount > 500:
            return Response({'detail': 'Amount must be between 1 and 500 credits.'}, status=400)

        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            recipient = User.objects.get(pk=recipient_id)
        except User.DoesNotExist:
            return Response({'detail': 'Recipient not found.'}, status=404)

        if recipient == request.user:
            return Response({'detail': 'You cannot gift credits to yourself.'}, status=400)

        sender_wallet, _ = Wallet.objects.get_or_create(employee=request.user)
        if sender_wallet.balance < amount:
            return Response({'detail': 'Insufficient credits.'}, status=400)

        recipient_wallet, _ = Wallet.objects.get_or_create(employee=recipient)

        sender_wallet.balance -= amount
        sender_wallet.save()
        recipient_wallet.balance += amount
        recipient_wallet.save()

        desc_sender = f'Gift to {recipient.full_name}' + (f' — {note}' if note else '')
        desc_recipient = f'Gift from {request.user.full_name}' + (f' — {note}' if note else '')

        Transaction.objects.create(wallet=sender_wallet, amount=-amount, type='debit', description=desc_sender)
        Transaction.objects.create(wallet=recipient_wallet, amount=amount, type='credit', description=desc_recipient)

        return Response({
            'detail': 'Credits gifted successfully.',
            'amount': str(amount),
            'recipient_name': recipient.full_name,
            'new_balance': str(sender_wallet.balance),
        })


class BirthdayGiftView(APIView):
    """POST /api/wallet/birthday-gift/ — send birthday credits to a colleague."""
    permission_classes = [IsEmployee]

    def post(self, request):
        recipient_id = request.data.get('recipient_id')
        amount = request.data.get('amount', 10)

        if not recipient_id:
            return Response({'detail': 'recipient_id is required.'}, status=400)

        try:
            amount = decimal.Decimal(str(amount))
        except Exception:
            return Response({'detail': 'Invalid amount.'}, status=400)

        if amount <= 0 or amount > 500:
            return Response({'detail': 'Amount must be between 1 and 500 credits.'}, status=400)

        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            recipient = User.objects.get(pk=recipient_id, role='employee')
        except User.DoesNotExist:
            return Response({'detail': 'Recipient not found.'}, status=404)

        if recipient == request.user:
            return Response({'detail': 'You cannot gift to yourself.'}, status=400)

        sender_wallet, _ = Wallet.objects.get_or_create(employee=request.user)
        if sender_wallet.balance < amount:
            return Response({'detail': 'Insufficient credits.'}, status=400)

        recipient_wallet, _ = Wallet.objects.get_or_create(employee=recipient)

        sender_wallet.balance -= amount
        sender_wallet.save()
        recipient_wallet.balance += amount
        recipient_wallet.save()

        Transaction.objects.create(
            wallet=sender_wallet, amount=-amount, type='debit',
            description=f'Birthday gift to {recipient.full_name} 🎂'
        )
        Transaction.objects.create(
            wallet=recipient_wallet, amount=amount, type='credit',
            description=f'Birthday gift from {request.user.full_name} 🎂'
        )

        BirthdayGift.objects.create(from_user=request.user, to_user=recipient, amount=amount)

        return Response({'detail': 'Birthday gift sent!', 'amount': str(amount)})


class BirthdayGiftsReceivedView(APIView):
    """GET /api/wallet/birthday-gifts/received/ — unseen birthday gifts for the logged-in user."""
    permission_classes = [IsEmployee]

    def get(self, request):
        gifts = BirthdayGift.objects.filter(to_user=request.user, seen=False).select_related('from_user')
        result = []
        for g in gifts:
            avatar = g.from_user.avatar
            result.append({
                'id': g.id,
                'from_name': g.from_user.full_name,
                'from_avatar': request.build_absolute_uri(avatar.url) if avatar else None,
                'amount': float(g.amount),
            })
        # Mark as seen
        gifts.update(seen=True)
        return Response(result)
