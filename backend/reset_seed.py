"""
Full database reset & reseed script.
Wipes all user-generated data and restores the demo dataset to its original state.
Run with: python3 reset_seed.py
"""
import os
import django
import random
from decimal import Decimal
from datetime import date, timedelta, datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.utils import timezone
from companies.models import Company, Department, DepartmentMembership
from users.models import ProviderProfile
from wallet.models import Wallet, Transaction, BirthdayGift
from catalog.models import Category, Perk, Redemption, Review
from life_moments.models import LifeEvent, CarePackage, CreditDonation
from chat.models import DirectMessage, GroupChat, GroupMessage
from community.models import Post, PostView, Like
from challenges.models import Challenge, ChallengeEntry, ChallengeWinNotification
from internal_perks.models import InternalPerk, InternalPerkRedemption
from group_buying.models import GroupBuy, GroupBuyMember

User = get_user_model()

print("=" * 60)
print("WELFARE APP — FULL DATABASE RESET")
print("=" * 60)

# ── WIPE USER-GENERATED DATA ─────────────────────────────────
print("\n[1/6] Clearing user-generated data...")

BirthdayGift.objects.all().delete()
CreditDonation.objects.all().delete()
CarePackage.objects.all().delete()
LifeEvent.objects.all().delete()

try:
    GroupBuyMember.objects.all().delete()
    GroupBuy.objects.all().delete()
except: pass

try:
    ChallengeWinNotification.objects.all().delete()
    ChallengeEntry.objects.all().delete()
except: pass

try:
    InternalPerkRedemption.objects.all().delete()
except: pass

try:
    Like.objects.all().delete()
    PostView.objects.all().delete()
    Post.objects.all().delete()
except: pass

try:
    GroupMessage.objects.all().delete()
    DirectMessage.objects.all().delete()
except: pass

Review.objects.all().delete()
Redemption.objects.all().delete()
Transaction.objects.all().delete()
Wallet.objects.all().delete()

print("  ✓ Cleared all transactions, redemptions, reviews, life events, chat messages")

# ── RESET USER ACCOUNTS ───────────────────────────────────────
print("\n[2/6] Resetting user accounts...")

User.objects.exclude(email__in=[
    'ceo@novatech.com', 'hr@greenleaf.com', 'people@pulse.com',
    'hello@zenfit.com', 'info@boltgym.com', 'team@mealcraft.com',
    'hi@skillvault.com', 'care@mindspace.com', 'go@wanderpass.com',
    'liam@novatech.com', 'emma@novatech.com', 'noah@novatech.com', 'olivia@novatech.com',
    'james@greenleaf.com', 'ava@greenleaf.com', 'lucas@greenleaf.com',
    'mia@pulse.com', 'ethan@pulse.com', 'sofia@pulse.com',
]).exclude(is_superuser=True).delete()

# Reset passwords and birthdays for all existing users
for u in User.objects.exclude(is_superuser=True):
    u.set_password('password123')
    u.birthday = None
    u.save()

print("  ✓ Passwords reset to 'password123', birthdays cleared")

# ── REBUILD COMPANIES & DEPARTMENTS ──────────────────────────
print("\n[3/6] Rebuilding companies and departments...")

employer_novatech = User.objects.get(email='ceo@novatech.com')
employer_greenleaf = User.objects.get(email='hr@greenleaf.com')
employer_pulse = User.objects.get(email='people@pulse.com')

company_nova, _ = Company.objects.get_or_create(
    name='NovaTech Solutions',
    defaults={'industry': 'Technology', 'monthly_budget_per_employee': 500, 'credits_rollover': False, 'created_by': employer_novatech}
)
company_green, _ = Company.objects.get_or_create(
    name='GreenLeaf Corp',
    defaults={'industry': 'Sustainability', 'monthly_budget_per_employee': 400, 'credits_rollover': False, 'created_by': employer_greenleaf}
)
company_pulse, _ = Company.objects.get_or_create(
    name='Pulse Digital',
    defaults={'industry': 'Media', 'monthly_budget_per_employee': 450, 'credits_rollover': False, 'created_by': employer_pulse}
)

for emp, company in [
    (employer_novatech, company_nova),
    (employer_greenleaf, company_green),
    (employer_pulse, company_pulse),
]:
    emp.company = company
    emp.save()

# Departments
DepartmentMembership.objects.all().delete()
Department.objects.all().delete()

dept_eng = Department.objects.create(name='Engineering', company=company_nova)
dept_design = Department.objects.create(name='Design', company=company_nova)
dept_green_ops = Department.objects.create(name='Operations', company=company_green)
dept_pulse_content = Department.objects.create(name='Content', company=company_pulse)

# Employees + wallets
EMPLOYEES = [
    ('liam@novatech.com',   'Liam Johnson',   company_nova,  dept_eng,          500),
    ('emma@novatech.com',   'Emma Rodriguez', company_nova,  dept_eng,          500),
    ('noah@novatech.com',   'Noah Williams',  company_nova,  dept_design,       500),
    ('olivia@novatech.com', 'Olivia Brown',   company_nova,  dept_design,       500),
    ('james@greenleaf.com', 'James Taylor',   company_green, dept_green_ops,    400),
    ('ava@greenleaf.com',   'Ava Martinez',   company_green, dept_green_ops,    400),
    ('lucas@greenleaf.com', 'Lucas Anderson', company_green, dept_green_ops,    400),
    ('mia@pulse.com',       'Mia Chen',       company_pulse, dept_pulse_content,450),
    ('ethan@pulse.com',     'Ethan Kim',      company_pulse, dept_pulse_content,450),
    ('sofia@pulse.com',     'Sofia Davis',    company_pulse, dept_pulse_content,450),
]

for email, name, company, dept, balance in EMPLOYEES:
    emp, _ = User.objects.get_or_create(
        email=email,
        defaults={'full_name': name, 'role': 'employee', 'company': company, 'is_verified': True}
    )
    emp.full_name = name
    emp.company = company
    emp.is_verified = True
    emp.birthday = None
    emp.set_password('password123')
    emp.save()

    wallet, _ = Wallet.objects.get_or_create(employee=emp)
    wallet.balance = Decimal(str(balance))
    wallet.save()

    Transaction.objects.create(
        wallet=wallet,
        amount=balance,
        type='credit',
        description=f'Monthly credit allocation from {company.name}'
    )

    DepartmentMembership.objects.get_or_create(employee=emp, department=dept)

print(f"  ✓ {len(EMPLOYEES)} employees reset with original balances and department memberships")

# ── REBUILD GROUP CHATS ───────────────────────────────────────
print("\n[4/6] Rebuilding group chats...")

GroupMessage.objects.all().delete()
GroupChat.objects.all().delete()

for dept in Department.objects.all():
    gc = GroupChat.objects.create(
        name=f'{dept.name} Team',
        icon='🏢',
        group_type='department',
        department=dept,
    )
    members = User.objects.filter(
        department_memberships__department=dept
    )
    gc.members.set(members)

for cat in Category.objects.all():
    gc = GroupChat.objects.create(
        name=f'{cat.name} Community',
        icon=cat.icon,
        group_type='community',
        category=cat,
    )

print("  ✓ Group chats rebuilt")

# ── SEED FAKE REVIEWS ─────────────────────────────────────────
print("\n[5/6] Seeding fake reviews...")

from catalog.models import ReputationScore

employees = list(User.objects.filter(role='employee'))
perks = list(Perk.objects.all())

REVIEW_COMMENTS = {
    5: [
        "Absolutely loved this! Highly recommend to everyone.",
        "Best perk I've used. Life changing.",
        "Top quality, exactly as described.",
        "Exceeded all my expectations!",
        "Will definitely use again. 10/10.",
    ],
    4: [
        "Really good, just a minor issue with scheduling.",
        "Great value for the credits. Very happy.",
        "Loved it overall, small room for improvement.",
        "Solid experience, would recommend.",
        "Very good quality, came through quickly.",
    ],
    3: [
        "Decent but nothing special.",
        "Average experience, gets the job done.",
        "OK for the price but expected more.",
        "Fine, but competitors might be better.",
        "Neutral feeling — not bad, not amazing.",
    ],
    2: [
        "Disappointed with the quality.",
        "Took longer than expected to get going.",
        "Didn't quite live up to the description.",
        "Wouldn't use again personally.",
    ],
    1: [
        "Very poor experience.",
        "Not worth the credits.",
        "Terrible customer service.",
    ],
}

review_count = 0
for perk in perks:
    n_reviews = random.randint(12, 25)
    for _ in range(n_reviews):
        reviewer = random.choice(employees)
        stars = random.choices([5, 4, 3, 2, 1], weights=[40, 30, 15, 10, 5])[0]
        comment = random.choice(REVIEW_COMMENTS[stars])
        days_ago = random.randint(1, 120)
        redeemed_at = timezone.now() - timedelta(days=days_ago + 3)
        reviewed_at = redeemed_at + timedelta(days=random.randint(1, 3))

        redemption = Redemption.objects.create(
            employee=reviewer,
            perk=perk,
            status='used',
            redeemed_at=redeemed_at,
        )
        Review.objects.create(
            redemption=redemption,
            perk=perk,
            provider=perk.provider,
            employee=reviewer,
            stars=stars,
            comment=comment,
            created_at=reviewed_at,
        )
        review_count += 1

print(f"  ✓ Created {review_count} reviews across {len(perks)} perks")

# ── UPDATE REPUTATION SCORES ──────────────────────────────────
print("\n[6/6] Recalculating provider reputation scores...")

providers = User.objects.filter(role='provider')
for provider in providers:
    perks_by_provider = Perk.objects.filter(provider=provider)
    all_reviews = Review.objects.filter(perk__in=perks_by_provider)
    review_count_p = all_reviews.count()

    if review_count_p == 0:
        continue

    avg_stars = sum(r.stars for r in all_reviews) / review_count_p
    perk_count = perks_by_provider.count()
    redemption_count = Redemption.objects.filter(perk__in=perks_by_provider).count()

    # Composite score (0-100)
    star_score = (avg_stars / 5) * 40
    review_score = min(review_count_p / 50, 1) * 20
    redemption_score = min(redemption_count / 100, 1) * 20
    variety_score = min(perk_count / 5, 1) * 10
    response_score = 10  # default full score

    composite = round(star_score + review_score + redemption_score + variety_score + response_score, 1)

    if composite >= 80:
        tier = 'platinum'
    elif composite >= 60:
        tier = 'gold'
    elif composite >= 40:
        tier = 'silver'
    else:
        tier = 'bronze'

    ReputationScore.objects.update_or_create(
        provider=provider,
        defaults={
            'avg_stars': round(avg_stars, 2),
            'review_count': review_count_p,
            'redemption_count': redemption_count,
            'perk_count': perk_count,
            'response_rate': 1.0,
            'composite_score': composite,
            'tier': tier,
        }
    )
    print(f"  {provider.full_name:20} — {tier:8} | score={composite} | avg={avg_stars:.1f}★ | {review_count_p} reviews")

print("\n" + "=" * 60)
print("RESET COMPLETE")
print("=" * 60)
print("\nDemo accounts (all password: password123):")
print("  Employers:  ceo@novatech.com | hr@greenleaf.com | people@pulse.com")
print("  Employees:  liam@novatech.com | emma@novatech.com | noah@novatech.com")
print("              james@greenleaf.com | mia@pulse.com")
print("  Providers:  hello@zenfit.com | info@boltgym.com | team@mealcraft.com")
print("              hi@skillvault.com | care@mindspace.com | go@wanderpass.com")
print("\nAll employee wallets restored:")
print("  NovaTech employees: 500 credits each")
print("  GreenLeaf employees: 400 credits each")
print("  Pulse employees: 450 credits each")
