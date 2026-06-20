from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta


def get_user_context(email):
    User = get_user_model()
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return None

    # Wallet balance
    try:
        balance = int(user.wallet.balance)
    except Exception:
        balance = 0

    # Recent redemptions (last 30 days)
    from catalog.models import Redemption
    recent = (
        Redemption.objects
        .filter(employee=user, created_at__gte=timezone.now() - timedelta(days=30))
        .select_related('perk__category')
        .order_by('-created_at')[:5]
    )
    recent_list = [
        f"{r.perk.name} ({r.perk.category.name if r.perk.category else 'General'})"
        for r in recent
    ]

    # Perks the user can afford right now
    from catalog.models import Perk
    affordable = (
        Perk.objects
        .filter(credit_price__lte=balance, is_active=True)
        .select_related('category')
        .order_by('credit_price')[:6]
    )
    affordable_list = [
        f"{p.name} – {int(p.credit_price)} credits ({p.category.name if p.category else 'General'})"
        for p in affordable
    ]

    # Credits expiring soon (next 7 days)
    from wallet.models import CreditAllocation
    expiring = (
        CreditAllocation.objects
        .filter(employee=user, expires_at__lte=timezone.now() + timedelta(days=7), expires_at__gt=timezone.now())
        .order_by('expires_at')
        .first()
    )
    expiring_note = (
        f"{int(expiring.amount)} credits expire on {expiring.expires_at.strftime('%b %d')}"
        if expiring else None
    )

    return {
        'name': user.full_name.split()[0],
        'balance': balance,
        'recent_redemptions': recent_list or ['None yet'],
        'affordable_perks': affordable_list or ['No perks available in your budget'],
        'expiring_note': expiring_note,
    }
