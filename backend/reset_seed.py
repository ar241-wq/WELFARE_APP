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
from companies.models import Team, TeamMembership
from secret_santa.models import SecretSantaEvent, SantaParticipant, SantaAssignment
from collaborations.models import Collaboration, PackageDeal

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
    Challenge.objects.all().delete()
except: pass

try:
    TeamMembership.objects.all().delete()
    Team.objects.all().delete()
except: pass

try:
    SantaAssignment.objects.all().delete()
    SantaParticipant.objects.all().delete()
    SecretSantaEvent.objects.all().delete()
except: pass

try:
    PackageDeal.objects.all().delete()
    Collaboration.objects.all().delete()
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

# Reset passwords for all existing users
for u in User.objects.exclude(is_superuser=True):
    u.set_password('password123')
    u.save()

print("  ✓ Passwords reset to 'password123'")

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
# birthday uses year 1900 (dummy) — only month+day are used for matching
from datetime import date as _date
today = _date.today()
EMPLOYEES = [
    # email, name, company, dept, balance, birthday (month, day)
    ('liam@novatech.com',   'Liam Johnson',   company_nova,  dept_eng,          500, (4, 10)),
    ('emma@novatech.com',   'Emma Rodriguez', company_nova,  dept_eng,          500, (9, 22)),
    ('noah@novatech.com',   'Noah Williams',  company_nova,  dept_design,       500, (today.month, today.day)),   # 🎂 birthday TODAY — triggers popup
    ('olivia@novatech.com', 'Olivia Brown',   company_nova,  dept_design,       500, (7, 4)),
    ('james@greenleaf.com', 'James Taylor',   company_green, dept_green_ops,    400, (11, 28)),
    ('ava@greenleaf.com',   'Ava Martinez',   company_green, dept_green_ops,    400, (2, 14)),
    ('lucas@greenleaf.com', 'Lucas Anderson', company_green, dept_green_ops,    400, (8, 20)),
    ('mia@pulse.com',       'Mia Chen',       company_pulse, dept_pulse_content,450, (5, 1)),
    ('ethan@pulse.com',     'Ethan Kim',      company_pulse, dept_pulse_content,450, (10, 31)),
    ('sofia@pulse.com',     'Sofia Davis',    company_pulse, dept_pulse_content,450, (1, 7)),
]

for email, name, company, dept, balance, bday in EMPLOYEES:
    emp, _ = User.objects.get_or_create(
        email=email,
        defaults={'full_name': name, 'role': 'employee', 'company': company, 'is_verified': True}
    )
    emp.full_name = name
    emp.company = company
    emp.is_verified = True
    emp.birthday = _date(1900, bday[0], bday[1])
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

# ── SEED TEAMS ───────────────────────────────────────────────
# ── SEED BIRTHDAY GIFTS (pre-seeded so Noah's popup fires on demo) ───────────
noah_user = User.objects.get(email='noah@novatech.com')
liam_user = User.objects.get(email='liam@novatech.com')
emma_user = User.objects.get(email='emma@novatech.com')
olivia_user = User.objects.get(email='olivia@novatech.com')

for sender, amount in [(liam_user, 100), (emma_user, 200), (olivia_user, 50)]:
    BirthdayGift.objects.create(from_user=sender, to_user=noah_user, amount=Decimal(str(amount)), seen=False)
    sender_wallet = Wallet.objects.get(employee=sender)
    sender_wallet.balance -= Decimal(str(amount))
    sender_wallet.save()
    noah_wallet = Wallet.objects.get(employee=noah_user)
    noah_wallet.balance += Decimal(str(amount))
    noah_wallet.save()

print("  ✓ 3 birthday gifts pre-seeded for Noah (350 credits total, popup ready)")

print("\n[7/10] Seeding teams...")

liam    = User.objects.get(email='liam@novatech.com')
emma    = User.objects.get(email='emma@novatech.com')
noah    = User.objects.get(email='noah@novatech.com')
olivia  = User.objects.get(email='olivia@novatech.com')
james   = User.objects.get(email='james@greenleaf.com')
ava     = User.objects.get(email='ava@greenleaf.com')
lucas   = User.objects.get(email='lucas@greenleaf.com')
mia     = User.objects.get(email='mia@pulse.com')
ethan   = User.objects.get(email='ethan@pulse.com')
sofia   = User.objects.get(email='sofia@pulse.com')

# NovaTech teams
team_backend = Team.objects.create(name='Backend Squad', company=company_nova, manager=employer_novatech)
team_product = Team.objects.create(name='Product & Design', company=company_nova, manager=employer_novatech)
TeamMembership.objects.create(employee=liam, team=team_backend)
TeamMembership.objects.create(employee=emma, team=team_backend)
TeamMembership.objects.create(employee=noah, team=team_product)
TeamMembership.objects.create(employee=olivia, team=team_product)

# GreenLeaf team
team_green_ops = Team.objects.create(name='Sustainability Ops', company=company_green, manager=employer_greenleaf)
TeamMembership.objects.create(employee=james, team=team_green_ops)
TeamMembership.objects.create(employee=ava, team=team_green_ops)
TeamMembership.objects.create(employee=lucas, team=team_green_ops)

# Pulse team
team_pulse = Team.objects.create(name='Content Creators', company=company_pulse, manager=employer_pulse)
TeamMembership.objects.create(employee=mia, team=team_pulse)
TeamMembership.objects.create(employee=ethan, team=team_pulse)
TeamMembership.objects.create(employee=sofia, team=team_pulse)

print("  ✓ 3 teams created across NovaTech, GreenLeaf, Pulse")

# ── SEED CHALLENGES ───────────────────────────────────────────
print("\n[8/10] Seeding challenges...")

from datetime import date as _date

# Active challenges
ch1 = Challenge.objects.create(
    company=company_nova,
    created_by=employer_novatech,
    title='AI Tool Adoption Sprint',
    description='Be the first department to integrate and demonstrate 3 AI tools into your daily workflow. Submit a short report with screenshots.',
    challenge_type='ai_adoption',
    target_metric='Integrate 3 AI tools into daily workflow',
    reward_credits=Decimal('2000'),
    status='active',
    deadline=timezone.now() + timedelta(days=14),
)
ch2 = Challenge.objects.create(
    company=company_nova,
    created_by=employer_novatech,
    title='Q3 Code Quality Challenge',
    description='Reduce bug count in your sprint by 30% compared to last quarter. Tracked via Jira ticket velocity.',
    challenge_type='kpi',
    target_metric='Reduce sprint bugs by 30%',
    reward_credits=Decimal('1500'),
    status='active',
    deadline=timezone.now() + timedelta(days=21),
)
ch3 = Challenge.objects.create(
    company=company_green,
    created_by=employer_greenleaf,
    title='Green Innovation Pitch',
    description='Submit the most impactful sustainability idea for Q3. Winning team gets credits + company-wide recognition.',
    challenge_type='innovation',
    target_metric='Best sustainability idea submission',
    reward_credits=Decimal('1200'),
    status='active',
    deadline=timezone.now() + timedelta(days=10),
)
ch4 = Challenge.objects.create(
    company=company_pulse,
    created_by=employer_pulse,
    title='Content Velocity Race',
    description='Publish the highest number of approved content pieces this month. Quality-checked by editors.',
    challenge_type='first_to',
    target_metric='Most approved content pieces in July',
    reward_credits=Decimal('800'),
    status='active',
    deadline=timezone.now() + timedelta(days=7),
)

# One completed challenge with winner + notifications
from decimal import Decimal as D
ch5 = Challenge.objects.create(
    company=company_nova,
    created_by=employer_novatech,
    title='Onboarding Excellence Award',
    description='Best onboarding experience rating from new hires. Engineering team wins!',
    challenge_type='custom',
    target_metric='Highest new-hire satisfaction score',
    reward_credits=Decimal('1000'),
    status='completed',
    winner_department=dept_eng,
    deadline=timezone.now() - timedelta(days=2),
)
# Distribute 1000 credits / 2 members = 500 each, create notifications
each_win = Decimal('500.00')
for winner in [liam, emma]:
    w, _ = Wallet.objects.get_or_create(employee=winner)
    w.balance += each_win
    w.save()
    Transaction.objects.create(
        wallet=w, amount=each_win, type='credit',
        description=f'Challenge prize (Engineering won): {ch5.title}'
    )
    ChallengeWinNotification.objects.create(
        user=winner, challenge=ch5,
        department_name='Engineering', amount=each_win, seen=False,
    )

# Seed a few entries for active challenges
for emp in [liam, emma]:
    ChallengeEntry.objects.create(
        challenge=ch1, employee=emp,
        submission='We integrated ChatGPT, GitHub Copilot, and Notion AI into our sprints.'
    )
for emp in [noah, olivia]:
    ChallengeEntry.objects.create(
        challenge=ch2, employee=emp,
        submission='Reduced bugs from 24 to 15 this sprint via better PR reviews.'
    )

print("  ✓ 4 active challenges + 1 completed challenge with win notifications")

# ── SEED SECRET SANTA ─────────────────────────────────────────
print("\n[9/10] Seeding Secret Santa...")

from datetime import datetime

# NovaTech Engineering santa — status=assigned (assignments locked)
santa_nova = SecretSantaEvent.objects.create(
    department=dept_eng,
    created_by=employer_novatech,
    title='NovaTech Engineering Secret Santa 🎅',
    credit_budget=Decimal('100'),
    join_deadline=timezone.now() + timedelta(days=3),
    reveal_date=timezone.now() + timedelta(days=10),
    status='open',
)
for emp in [liam, emma]:
    SantaParticipant.objects.create(event=santa_nova, user=emp)
santa_nova.assign_santas()  # locks assignments, sets status='assigned'

# GreenLeaf Operations santa — open for joining
santa_green = SecretSantaEvent.objects.create(
    department=dept_green_ops,
    created_by=employer_greenleaf,
    title='GreenLeaf Holiday Secret Santa 🎄',
    credit_budget=Decimal('75'),
    join_deadline=timezone.now() + timedelta(days=5),
    reveal_date=timezone.now() + timedelta(days=14),
    status='open',
)
for emp in [james, ava, lucas]:
    SantaParticipant.objects.create(event=santa_green, user=emp)
santa_green.assign_santas()

# Pick a perk for the NovaTech assignment (gift sent)
wellness_perk = Perk.objects.filter(provider__email='care@mindspace.com').first()
if wellness_perk:
    assign = SantaAssignment.objects.filter(event=santa_nova).first()
    if assign:
        assign.gifted_perk = wellness_perk
        assign.gift_seen = False
        assign.save()

print("  ✓ 2 Secret Santa events created with participants and assignments")

# ── SEED PACKAGE DEALS ────────────────────────────────────────
print("\n[10/10] Seeding package deals (collaborations)...")

zenfit   = User.objects.get(email='hello@zenfit.com')
boltgym  = User.objects.get(email='info@boltgym.com')
mealcraft = User.objects.get(email='team@mealcraft.com')
skillvault = User.objects.get(email='hi@skillvault.com')
mindspace = User.objects.get(email='care@mindspace.com')
wanderpass = User.objects.get(email='go@wanderpass.com')

# Collaboration 1: ZenFit + BoltGym → NovaTech
collab1, _ = Collaboration.objects.get_or_create(
    from_provider=zenfit, to_provider=boltgym,
    defaults={'message': 'Let\'s bundle wellness and fitness for NovaTech!', 'status': 'accepted'}
)
yoga_perk    = Perk.objects.get(name='Monthly Yoga Unlimited')
gym_perk     = Perk.objects.get(name='Bolt Gym Monthly Pass')
hiit_perk    = Perk.objects.get(name='Group HIIT Classes Bundle')
pkg1 = PackageDeal.objects.create(
    collaboration=collab1,
    name='Total Wellness Bundle',
    description='Yoga + gym access + HIIT classes — the ultimate fitness package for your team. Includes unlimited monthly yoga, full gym access, and 4 weekly HIIT group sessions.',
    target_employer=employer_novatech,
    total_price=Decimal('360'),
    discount_percentage=Decimal('10'),
    status='offered',
    from_provider_confirmed=True,
    to_provider_confirmed=True,
    created_by=zenfit,
    offered_at=timezone.now() - timedelta(days=1),
)
pkg1.perks.set([yoga_perk, gym_perk, hiit_perk])

# Collaboration 2: MealCraft + SkillVault → GreenLeaf
collab2, _ = Collaboration.objects.get_or_create(
    from_provider=mealcraft, to_provider=skillvault,
    defaults={'message': 'Healthy body, sharp mind package for GreenLeaf.', 'status': 'accepted'}
)
meal_perk    = Perk.objects.get(name='Healthy Lunch Plan')
learn_perk   = Perk.objects.get(name='All-Access Learning Pass')
lang_perk    = Perk.objects.get(name='Language Learning — 3 Mo')
pkg2 = PackageDeal.objects.create(
    collaboration=collab2,
    name='Nourish & Grow Package',
    description='Feed your mind and body — healthy lunches delivered plus full access to SkillVault\'s learning library and language courses.',
    target_employer=employer_greenleaf,
    total_price=Decimal('250'),
    discount_percentage=Decimal('15'),
    status='offered',
    from_provider_confirmed=True,
    to_provider_confirmed=True,
    created_by=mealcraft,
    offered_at=timezone.now() - timedelta(hours=6),
)
pkg2.perks.set([meal_perk, learn_perk, lang_perk])

# Collaboration 3: MindSpace + WanderPass → Pulse Digital
collab3, _ = Collaboration.objects.get_or_create(
    from_provider=mindspace, to_provider=wanderpass,
    defaults={'message': 'Mental wellness + travel rewards for Pulse Digital.', 'status': 'accepted'}
)
therapy_perk  = Perk.objects.get(name='Therapy Session')
sleep_perk    = Perk.objects.get(name='Sleep Improvement Program')
lounge_perk   = Perk.objects.get(name='Airport Lounge Pass')
pkg3 = PackageDeal.objects.create(
    collaboration=collab3,
    name='Recharge & Explore Bundle',
    description='Balance mental wellbeing with travel perks — therapy sessions and sleep coaching paired with airport lounge access for your next work trip.',
    target_employer=employer_pulse,
    total_price=Decimal('235'),
    discount_percentage=Decimal('12'),
    status='offered',
    from_provider_confirmed=True,
    to_provider_confirmed=True,
    created_by=mindspace,
    offered_at=timezone.now() - timedelta(hours=3),
)
pkg3.perks.set([therapy_perk, sleep_perk, lounge_perk])

# One already-accepted package (NovaTech, a previous deal)
collab4, _ = Collaboration.objects.get_or_create(
    from_provider=skillvault, to_provider=wanderpass,
    defaults={'message': 'Learning + travel perks bundle.', 'status': 'accepted'}
)
cert_perk   = Perk.objects.get(name='Professional Certification')
hotel_perk  = Perk.objects.get(name='Hotel Night Voucher')
pkg4 = PackageDeal.objects.create(
    collaboration=collab4,
    name='Level Up & Get Away',
    description='Earn a professional certification then celebrate with a hotel night — the ultimate reward package for high performers.',
    target_employer=employer_novatech,
    total_price=Decimal('430'),
    discount_percentage=Decimal('8'),
    status='accepted',
    from_provider_confirmed=True,
    to_provider_confirmed=True,
    created_by=skillvault,
    offered_at=timezone.now() - timedelta(days=5),
    responded_at=timezone.now() - timedelta(days=3),
)
pkg4.perks.set([cert_perk, hotel_perk])

print("  ✓ 4 package deals created (3 pending, 1 accepted) across 3 employers")

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
print("  NovaTech employees: 500 cr base (+500 win bonus Liam & Emma, -350 gifted to Noah)")
print("  GreenLeaf employees: 400 credits each")
print("  Pulse employees: 450 credits each")
print("\n🎂 Birthday: Noah Williams (noah@novatech.com) — popup fires for Liam, Emma, Olivia")
print("   Noah opens app → sees BirthdayGiftsPopup with 350 credits from 3 colleagues")
print("\nChallenges: 4 active + 1 completed (Engineering won, notifications pending)")
print("Teams: Backend Squad, Product & Design (Nova) | Sustainability Ops (Green) | Content Creators (Pulse)")
print("Secret Santa: 2 events (NovaTech Eng assigned, GreenLeaf Ops assigned)")
print("Package Deals: 3 offered + 1 accepted")
