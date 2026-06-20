import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from companies.models import Company, Team, TeamMembership
from wallet.models import Wallet, Transaction
from catalog.models import Category, Perk
from users.models import ProviderProfile

User = get_user_model()

print("Seeding database...")

# Categories
categories_data = [
    ('Wellness', '🧘', 'Gyms, therapy, meditation, and health'),
    ('Food', '🍔', 'Meal delivery, restaurants, and groceries'),
    ('Travel', '✈️', 'Airlines, hotels, and travel agencies'),
    ('Learning', '📚', 'Online courses, certifications, and books'),
    ('Connectivity', '📱', 'Mobile plans, internet, and devices'),
    ('Lifestyle', '🎬', 'Streaming, childcare, pets, and more'),
]
categories = {}
for name, icon, desc in categories_data:
    cat, _ = Category.objects.get_or_create(name=name, defaults={'icon': icon, 'description': desc})
    categories[name] = cat
print(f"  Created {len(categories)} categories")

# Employer
employer, _ = User.objects.get_or_create(
    email='hr@techcorp.com',
    defaults={'full_name': 'James HR Manager', 'role': 'employer', 'is_verified': True}
)
employer.set_password('password123')
employer.save()

company, _ = Company.objects.get_or_create(
    name='TechCorp',
    defaults={
        'industry': 'Technology',
        'monthly_budget_per_employee': 400,
        'credits_rollover': False,
        'created_by': employer
    }
)
employer.company = company
employer.save()

team, _ = Team.objects.get_or_create(name='Engineering', company=company, defaults={'manager': employer})
print(f"  Created company: {company.name}")

# Provider — Gym
gym_user, _ = User.objects.get_or_create(
    email='info@liftgym.com',
    defaults={'full_name': 'Lift Gym', 'role': 'provider', 'is_verified': True}
)
gym_user.set_password('password123')
gym_user.save()
ProviderProfile.objects.get_or_create(
    user=gym_user,
    defaults={'company_name': 'Lift Gym', 'description': 'Premium gym network', 'is_verified': True}
)

# Provider — MealKit
meal_user, _ = User.objects.get_or_create(
    email='info@freshmeals.com',
    defaults={'full_name': 'Fresh Meals', 'role': 'provider', 'is_verified': True}
)
meal_user.set_password('password123')
meal_user.save()
ProviderProfile.objects.get_or_create(
    user=meal_user,
    defaults={'company_name': 'Fresh Meals Co.', 'description': 'Weekly meal kits', 'is_verified': True}
)

# Provider — Courses
course_user, _ = User.objects.get_or_create(
    email='info@learnhub.com',
    defaults={'full_name': 'LearnHub', 'role': 'provider', 'is_verified': True}
)
course_user.set_password('password123')
course_user.save()
ProviderProfile.objects.get_or_create(
    user=course_user,
    defaults={'company_name': 'LearnHub', 'description': 'Online learning platform', 'is_verified': True}
)
print("  Created 3 providers")

# Perks
perks_data = [
    (gym_user, 'Wellness', 'Monthly Gym Membership', 'Full access to all Lift Gym facilities', 150, True, ['fitness', 'health', 'wellness']),
    (gym_user, 'Wellness', 'Personal Training Session', '1-hour session with a certified trainer', 80, False, ['fitness', 'health']),
    (meal_user, 'Food', 'Weekly Meal Kit', 'Fresh ingredients delivered weekly for 2 people', 120, True, ['food', 'health']),
    (meal_user, 'Food', 'Restaurant Voucher', 'Voucher valid at 200+ partner restaurants', 50, False, ['food']),
    (course_user, 'Learning', 'Online Course Access', 'Unlimited access to 1000+ courses for 1 month', 100, True, ['learning', 'career']),
    (course_user, 'Learning', 'Language Learning App', '3-month premium subscription', 60, False, ['learning']),
    (gym_user, 'Wellness', 'Meditation App Premium', '6-month subscription to top meditation app', 40, True, ['wellness', 'therapy', 'sleep']),
    (meal_user, 'Lifestyle', 'Streaming Bundle', '1 month of premium streaming', 30, False, ['lifestyle']),
    (course_user, 'Connectivity', 'Mobile Data Plan', 'Extra 20GB data add-on', 50, False, ['connectivity']),
    (gym_user, 'Wellness', 'Therapy Session', '1-hour online therapy session', 90, True, ['therapy', 'wellness', 'health']),
    (meal_user, 'Food', 'Childcare App Premium', '1 month access to childcare platform', 80, True, ['childcare', 'lifestyle']),
    (gym_user, 'Wellness', 'Sleep Tracking App', '6-month premium subscription', 35, False, ['sleep', 'wellness', 'health']),
]

for provider, cat_name, name, desc, price, featured, tags in perks_data:
    Perk.objects.get_or_create(
        name=name,
        provider=provider,
        defaults={
            'category': categories[cat_name],
            'description': desc,
            'credit_price': price,
            'is_featured': featured,
            'is_active': True,
            'tags': tags
        }
    )
print(f"  Created {len(perks_data)} perks")

# Employees
employees_data = [
    ('maria@techcorp.com', 'Maria Silva'),
    ('john@techcorp.com', 'John Smith'),
    ('ana@techcorp.com', 'Ana Costa'),
]
for email, name in employees_data:
    emp, created = User.objects.get_or_create(
        email=email,
        defaults={'full_name': name, 'role': 'employee', 'company': company, 'is_verified': True}
    )
    if created:
        emp.set_password('password123')
        emp.save()
        wallet = Wallet.objects.create(employee=emp, balance=400)
        Transaction.objects.create(
            wallet=wallet,
            amount=400,
            type='credit',
            description='Monthly credit allocation from TechCorp'
        )
        TeamMembership.objects.get_or_create(employee=emp, team=team)
print(f"  Created {len(employees_data)} employees (400 credits each)")

print("\nSeed complete! Demo accounts:")
print("  Employer:  hr@techcorp.com / password123")
print("  Employee:  maria@techcorp.com / password123")
print("  Provider:  info@liftgym.com / password123")
print("  Admin:     run createsuperuser")
