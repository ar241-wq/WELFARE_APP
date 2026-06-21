from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from companies.models import Department, DepartmentMembership
from wallet.models import Wallet, Transaction
from catalog.models import Perk, Redemption
from .models import SecretSantaEvent, SantaParticipant, SantaAssignment
from .serializers import SecretSantaEventSerializer
import uuid


def is_hr(user):
    return user.role in ('employer', 'hr')


class HRSantaView(APIView):
    """HR: list all Secret Santa events for the company, or create one."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_hr(request.user):
            return Response({'detail': 'HR only.'}, status=403)
        # All departments belonging to the employer's company
        company = getattr(request.user, 'company', None)
        if not company:
            return Response([], status=200)
        dept_ids = Department.objects.filter(company=company).values_list('id', flat=True)
        events = SecretSantaEvent.objects.filter(
            department_id__in=dept_ids
        ).order_by('-created_at')
        return Response(SecretSantaEventSerializer(events, many=True, context={'request': request}).data)

    def post(self, request):
        """HR creates a new event."""
        if not is_hr(request.user):
            return Response({'detail': 'HR only.'}, status=403)
        dept_id = request.data.get('department_id')
        title = request.data.get('title', 'Secret Santa')
        credit_budget = request.data.get('credit_budget', 50)
        join_deadline = request.data.get('join_deadline')
        reveal_date = request.data.get('reveal_date')
        if not all([dept_id, join_deadline, reveal_date]):
            return Response({'detail': 'department_id, join_deadline, and reveal_date are required.'}, status=400)
        try:
            dept = Department.objects.get(pk=dept_id)
        except Department.DoesNotExist:
            return Response({'detail': 'Department not found.'}, status=404)
        parsed_join = parse_datetime(join_deadline) if isinstance(join_deadline, str) else join_deadline
        parsed_reveal = parse_datetime(reveal_date) if isinstance(reveal_date, str) else reveal_date
        if not parsed_join or not parsed_reveal:
            return Response({'detail': 'Invalid date format. Use ISO 8601 (e.g. 2026-12-20T23:59:00Z).'}, status=400)
        event = SecretSantaEvent.objects.create(
            department=dept, created_by=request.user, title=title,
            credit_budget=credit_budget, join_deadline=parsed_join, reveal_date=parsed_reveal,
        )
        return Response(SecretSantaEventSerializer(event, context={'request': request}).data, status=201)


class MyDepartmentSantaView(APIView):
    """List Secret Santa events for the current user's department(s)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        dept_ids = DepartmentMembership.objects.filter(
            employee=request.user
        ).values_list('department_id', flat=True)
        events = SecretSantaEvent.objects.filter(
            department_id__in=dept_ids
        ).order_by('-created_at')
        return Response(SecretSantaEventSerializer(events, many=True, context={'request': request}).data)


class SantaEventDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_event(self, pk):
        try:
            return SecretSantaEvent.objects.get(pk=pk)
        except SecretSantaEvent.DoesNotExist:
            return None

    def get(self, request, pk):
        event = self._get_event(pk)
        if not event:
            return Response({'detail': 'Not found.'}, status=404)
        return Response(SecretSantaEventSerializer(event, context={'request': request}).data)

    def patch(self, request, pk):
        if not is_hr(request.user):
            return Response({'detail': 'HR only.'}, status=403)
        event = self._get_event(pk)
        if not event:
            return Response({'detail': 'Not found.'}, status=404)
        if event.status != 'open':
            return Response({'detail': 'Can only edit open events.'}, status=400)
        if 'title' in request.data:
            event.title = request.data['title']
        if 'credit_budget' in request.data:
            event.credit_budget = request.data['credit_budget']
        if 'join_deadline' in request.data:
            parsed = parse_datetime(request.data['join_deadline'])
            if not parsed:
                return Response({'detail': 'Invalid join_deadline format.'}, status=400)
            event.join_deadline = parsed
        if 'reveal_date' in request.data:
            parsed = parse_datetime(request.data['reveal_date'])
            if not parsed:
                return Response({'detail': 'Invalid reveal_date format.'}, status=400)
            event.reveal_date = parsed
        event.save()
        return Response(SecretSantaEventSerializer(event, context={'request': request}).data)

    def delete(self, request, pk):
        if not is_hr(request.user):
            return Response({'detail': 'HR only.'}, status=403)
        event = self._get_event(pk)
        if not event:
            return Response({'detail': 'Not found.'}, status=404)
        event.delete()
        return Response(status=204)


class SantaJoinView(APIView):
    """Employee joins or leaves a Secret Santa event."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            event = SecretSantaEvent.objects.get(pk=pk)
        except SecretSantaEvent.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)
        if event.status != 'open':
            return Response({'detail': 'Joining is closed.'}, status=400)
        if timezone.now() > event.join_deadline:
            return Response({'detail': 'Join deadline has passed.'}, status=400)
        participant, created = SantaParticipant.objects.get_or_create(event=event, user=request.user)
        if not created:
            participant.delete()
            return Response({'joined': False, 'participant_count': event.participants.count()})
        return Response({'joined': True, 'participant_count': event.participants.count()})


class SantaAssignView(APIView):
    """HR triggers the random assignment."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not is_hr(request.user):
            return Response({'detail': 'HR only.'}, status=403)
        try:
            event = SecretSantaEvent.objects.get(pk=pk)
        except SecretSantaEvent.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)
        if event.participants.count() < 2:
            return Response({'detail': 'Need at least 2 participants.'}, status=400)
        event.assign_santas()
        return Response({'detail': 'Assignments made.', 'status': event.status})


class SantaSendGiftView(APIView):
    """Participant sends a gift to their assigned receiver.

    Option A — send a perk: POST {perk_id: <id>}
      Deducts perk.credit_price from giver, creates a Redemption for the receiver.

    Option B — send credits: POST {amount: <n>}
      Deducts amount from giver wallet, credits receiver wallet.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            event = SecretSantaEvent.objects.get(pk=pk)
        except SecretSantaEvent.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)
        if event.status != 'assigned':
            return Response({'detail': 'Assignments not locked yet.'}, status=400)
        try:
            assignment = event.assignments.get(giver=request.user)
        except SantaAssignment.DoesNotExist:
            return Response({'detail': 'You are not assigned in this event.'}, status=403)

        giver_wallet, _ = Wallet.objects.get_or_create(employee=request.user)
        perk_id = request.data.get('perk_id')

        if perk_id:
            # ── Perk gift ──────────────────────────────────────────────────
            try:
                perk = Perk.objects.get(pk=perk_id, is_active=True)
            except Perk.DoesNotExist:
                return Response({'detail': 'Perk not found.'}, status=404)
            amount = float(perk.credit_price)
            if float(giver_wallet.balance) < amount:
                return Response({'detail': 'Insufficient credits.'}, status=400)
            giver_wallet.balance = float(giver_wallet.balance) - amount
            giver_wallet.save()
            Transaction.objects.create(
                wallet=giver_wallet,
                amount=amount,
                type='debit',
                description=f'Secret Santa gift: {perk.name}',
            )
            Redemption.objects.create(
                employee=assignment.receiver,
                perk=perk,
                qr_code=str(uuid.uuid4()),
                status='pending',
            )
            assignment.gifted_perk = perk
            assignment.save()
            SantaParticipant.objects.filter(event=event, user=request.user).update(gift_sent=True)
            return Response({'detail': f'🎁 You gifted {perk.name} to {assignment.receiver.full_name}!', 'gift_sent': True})

        else:
            # ── Credit gift ────────────────────────────────────────────────
            amount = float(request.data.get('amount', event.credit_budget))
            if float(giver_wallet.balance) < amount:
                return Response({'detail': 'Insufficient credits.'}, status=400)
            giver_wallet.balance = float(giver_wallet.balance) - amount
            giver_wallet.save()
            receiver_wallet, _ = Wallet.objects.get_or_create(employee=assignment.receiver)
            receiver_wallet.balance = float(receiver_wallet.balance) + amount
            receiver_wallet.save()
            Transaction.objects.create(
                wallet=receiver_wallet,
                amount=amount,
                type='credit',
                description='Secret Santa gift',
            )
            SantaParticipant.objects.filter(event=event, user=request.user).update(gift_sent=True)
            return Response({'detail': f'🎁 Sent {amount} credits to {assignment.receiver.full_name}!', 'gift_sent': True})


class SantaRevealView(APIView):
    """HR reveals all assignments."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not is_hr(request.user):
            return Response({'detail': 'HR only.'}, status=403)
        try:
            event = SecretSantaEvent.objects.get(pk=pk)
        except SecretSantaEvent.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)
        event.status = 'revealed'
        event.save()
        return Response({'detail': 'Revealed!', 'status': 'revealed'})
