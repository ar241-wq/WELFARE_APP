from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from .models import Challenge

User = get_user_model()


def _dept_list(company):
    """Return departments with member counts for a company."""
    from companies.models import Department
    depts = []
    for dept in company.departments.all():
        count = dept.memberships.count()
        depts.append({
            'id': dept.id,
            'name': dept.name,
            'member_count': count,
        })
    return depts


def _challenge_data(challenge, user=None):
    company = challenge.company
    depts = _dept_list(company)
    user_dept = None
    if user and user.role == 'employee':
        membership = user.department_memberships.filter(
            department__company=company
        ).select_related('department').first()
        if membership:
            user_dept = {'id': membership.department.id, 'name': membership.department.name}

    winner_dept = None
    if challenge.winner_department_id:
        winner_dept = {
            'id': challenge.winner_department.id,
            'name': challenge.winner_department.name,
        }

    return {
        'id': challenge.id,
        'title': challenge.title,
        'description': challenge.description,
        'challenge_type': challenge.challenge_type,
        'target_metric': challenge.target_metric,
        'reward_credits': str(challenge.reward_credits),
        'status': challenge.status,
        'deadline': challenge.deadline,
        'created_at': challenge.created_at,
        'departments': depts,
        'department_count': len(depts),
        'user_department': user_dept,
        'winner_department': winner_dept,
        'distributed': challenge.status == 'completed',
    }


class ChallengeListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role == 'employer':
            company = user.owned_companies.first()
            if not company:
                return Response([])
            challenges = Challenge.objects.filter(company=company)
        else:
            if not user.company:
                return Response([])
            challenges = Challenge.objects.filter(company=user.company, status='active')
        return Response([_challenge_data(c, user) for c in challenges])

    def post(self, request):
        if request.user.role != 'employer':
            return Response({'detail': 'Only employers can create challenges.'}, status=403)
        company = request.user.owned_companies.first()
        if not company:
            return Response({'detail': 'No company found.'}, status=400)

        title = request.data.get('title', '').strip()
        description = request.data.get('description', '').strip()
        reward_credits = request.data.get('reward_credits')
        deadline = request.data.get('deadline')
        challenge_type = request.data.get('challenge_type', 'custom')
        target_metric = request.data.get('target_metric', '').strip()

        if not title or not description or not reward_credits:
            return Response({'detail': 'title, description and reward_credits are required.'}, status=400)

        challenge = Challenge.objects.create(
            company=company,
            created_by=request.user,
            title=title,
            description=description,
            challenge_type=challenge_type,
            target_metric=target_metric,
            reward_credits=reward_credits,
            deadline=deadline or None,
        )
        return Response(_challenge_data(challenge), status=201)


class ChallengeDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        challenge = get_object_or_404(Challenge, pk=pk)
        return Response(_challenge_data(challenge, request.user))


class DistributePrizeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if request.user.role != 'employer':
            return Response({'detail': 'Only employers can distribute the prize.'}, status=403)

        challenge = get_object_or_404(Challenge, pk=pk, created_by=request.user, status='active')

        dept_id = request.data.get('department_id')
        if not dept_id:
            return Response({'detail': 'department_id is required.'}, status=400)

        from companies.models import Department
        dept = get_object_or_404(Department, pk=dept_id, company=challenge.company)

        members = [m.employee for m in dept.memberships.select_related('employee').all()]
        count = len(members)
        if count == 0:
            return Response({'detail': 'That department has no members.'}, status=400)

        from decimal import Decimal, ROUND_DOWN
        each = (Decimal(str(challenge.reward_credits)) / count).quantize(Decimal('0.01'), rounding=ROUND_DOWN)

        from wallet.models import Wallet, Transaction
        for employee in members:
            wallet, _ = Wallet.objects.get_or_create(employee=employee)
            wallet.balance += each
            wallet.save()
            Transaction.objects.create(
                wallet=wallet,
                type='credit',
                amount=each,
                description=f'Challenge prize ({dept.name} won): {challenge.title}',
            )

        challenge.winner_department = dept
        challenge.status = 'completed'
        challenge.save()

        # Create win notifications for each member
        from .models import ChallengeWinNotification
        for employee in members:
            ChallengeWinNotification.objects.create(
                user=employee,
                challenge=challenge,
                department_name=dept.name,
                amount=each,
            )

        return Response({
            **_challenge_data(challenge),
            'winner_department': {'id': dept.id, 'name': dept.name},
            'distributed_to': count,
            'each_amount': str(each),
        })


class ChallengeWinNotificationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .models import ChallengeWinNotification
        notifications = ChallengeWinNotification.objects.filter(
            user=request.user, seen=False
        ).select_related('challenge')
        data = [{
            'id': n.id,
            'challenge_title': n.challenge.title,
            'department_name': n.department_name,
            'amount': str(n.amount),
        } for n in notifications]
        return Response(data)

    def post(self, request):
        from .models import ChallengeWinNotification
        ChallengeWinNotification.objects.filter(
            user=request.user, seen=False
        ).update(seen=True)
        return Response({'detail': 'marked seen'})
