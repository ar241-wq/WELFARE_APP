from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from companies.models import Department, DepartmentMembership
from wallet.models import Wallet, Transaction
from .models import SecretSantaEvent, SantaParticipant, SantaAssignment
from .serializers import SecretSantaEventSerializer


def is_hr(user):
    return user.role in ('employer', 'hr')


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
        # Parse date strings into datetime objects before saving
        parsed_join = parse_datetime(join_deadline) if isinstance(join_deadline, str) else join_deadline
        parsed_reveal = parse_datetime(reveal_date) if isinstance(reveal_date, str) else reveal_date
        if not parsed_join or not parsed_reveal:
            return Response({'detail': 'Invalid date format. Use ISO 8601 (e.g. 2026-12-20T23:59:00Z).'}, status=400)
        event = SecretSantaEvent.objects.create(
            department=dept, created_by=request.user, title=title,
            credit_budget=credit_budget, join_deadline=parsed_join, reveal_date=parsed_reveal,
        )
        return Response(SecretSantaEventSerializer(event, context={'request': request}).data, status=201)


class SantaEventDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            event = SecretSantaEvent.objects.get(pk=pk)
        except SecretSantaEvent.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)
        return Response(SecretSantaEventSerializer(event, context={'request': request}).data)


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
    """Participant sends credits as a gift to their assigned receiver."""
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
        amount = float(request.data.get('amount', event.credit_budget))
        # Deduct from giver wallet
        giver_wallet, _ = Wallet.objects.get_or_create(employee=request.user)
        if float(giver_wallet.balance) < amount:
            return Response({'detail': 'Insufficient credits.'}, status=400)
        giver_wallet.balance = float(giver_wallet.balance) - amount
        giver_wallet.save()
        # Add to receiver wallet
        receiver_wallet, _ = Wallet.objects.get_or_create(employee=assignment.receiver)
        receiver_wallet.balance = float(receiver_wallet.balance) + amount
        receiver_wallet.save()
        # Record transaction
        Transaction.objects.create(
            wallet=receiver_wallet,
            amount=amount,
            type='credit',
            description='Secret Santa gift',
        )
        # Mark gift sent
        SantaParticipant.objects.filter(event=event, user=request.user).update(gift_sent=True)
        return Response({'detail': f'Gift of {amount} credits sent!', 'gift_sent': True})


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
