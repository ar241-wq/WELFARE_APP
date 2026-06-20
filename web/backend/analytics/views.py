from rest_framework.views import APIView
from rest_framework.response import Response
from users.permissions import IsEmployer, IsProvider
from companies.models import Company
from catalog.models import Redemption, Perk
from wallet.models import Transaction
from django.db.models import Sum, Count
from django.utils import timezone


class SpendByCategoryView(APIView):
    permission_classes = [IsEmployer]

    def get(self, request):
        company = Company.objects.filter(created_by=request.user).first()
        if not company:
            return Response({'total': 0, 'by_category': [], 'recent_activity': []})

        redemptions = Redemption.objects.filter(
            employee__company=company
        ).select_related('perk__category', 'employee').order_by('-redeemed_at')

        spend = {}
        total = 0
        for r in redemptions:
            if r.perk.category:
                cat = r.perk.category.name
                spend[cat] = spend.get(cat, 0) + float(r.perk.credit_price)
            total += float(r.perk.credit_price)

        recent = []
        for r in redemptions[:10]:
            recent.append({
                'id': r.id,
                'description': f'{r.employee.full_name} redeemed {r.perk.name}',
                'timestamp': r.redeemed_at.strftime('%-d %b %Y') if r.redeemed_at else '',
            })

        return Response({
            'total': total,
            'by_category': [{'category': k, 'amount': v} for k, v in spend.items()],
            'recent_activity': recent,
        })


class UtilizationView(APIView):
    permission_classes = [IsEmployer]

    def get(self, request):
        company = Company.objects.filter(created_by=request.user).first()
        if not company:
            return Response({'rate': 0})

        from django.contrib.auth import get_user_model
        User = get_user_model()
        employees = User.objects.filter(company=company, role='employee').select_related('wallet')

        if not employees.exists() or not company.monthly_budget_per_employee:
            return Response({'rate': 0})

        rates = []
        for emp in employees:
            balance = float(emp.wallet.balance) if hasattr(emp, 'wallet') else 0
            allocated = float(company.monthly_budget_per_employee)
            used = allocated - balance
            rate = (used / allocated * 100) if allocated > 0 else 0
            rates.append(max(0, min(100, rate)))

        avg_rate = sum(rates) / len(rates) if rates else 0
        return Response({'rate': round(avg_rate, 1)})


class TopPerksView(APIView):
    permission_classes = [IsEmployer]

    def get(self, request):
        company = Company.objects.filter(created_by=request.user).first()
        if not company:
            return Response([])

        top = Redemption.objects.filter(
            employee__company=company
        ).values('perk__name').annotate(
            count=Count('id')
        ).order_by('-count')[:10]

        return Response([{'name': r['perk__name'], 'count': r['count']} for r in top])


class ProviderStatsView(APIView):
    permission_classes = [IsProvider]

    def get(self, request):
        perks = Perk.objects.filter(provider=request.user).prefetch_related('redemptions')

        per_perk = []
        total_redemptions = 0
        for perk in perks:
            count = perk.redemptions.count()
            credits = count * float(perk.credit_price)
            total_redemptions += count
            per_perk.append({
                'perk_name': perk.name,
                'redemptions': count,
                'credits': credits,
            })

        total_credits = sum(p['credits'] for p in per_perk)

        is_verified = False
        if hasattr(request.user, 'provider_profile'):
            is_verified = request.user.provider_profile.is_verified

        return Response({
            'redemptions_this_month': total_redemptions,
            'credits_earned': total_credits,
            'is_verified': is_verified,
            'per_perk': per_perk,
            'peak_times': [],
        })
