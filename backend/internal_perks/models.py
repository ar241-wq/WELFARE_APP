from django.db import models
from django.conf import settings

PERK_ICONS = [
    ('🏖️', 'Day Off'),
    ('🎓', 'Training'),
    ('🏋️', 'Wellness'),
    ('💆', 'Coaching'),
    ('🚗', 'Parking'),
    ('🍽️', 'Meal'),
    ('💻', 'Equipment'),
    ('⏰', 'Flexible Hours'),
    ('⭐', 'Recognition'),
    ('🎁', 'Gift'),
]


class InternalPerk(models.Model):
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='internal_perks')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_internal_perks')
    title = models.CharField(max_length=200)
    description = models.TextField()
    icon = models.CharField(max_length=10, default='🎁')
    credit_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # 0 = free
    is_free = models.BooleanField(default=False)
    available_slots = models.PositiveIntegerField(null=True, blank=True)  # null = unlimited
    requires_approval = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} ({self.company.name})'

    @property
    def slots_remaining(self):
        if self.available_slots is None:
            return None
        used = self.redemptions.filter(status__in=('pending', 'approved')).count()
        return max(0, self.available_slots - used)


class InternalPerkRedemption(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('denied', 'Denied'),
    ]
    perk = models.ForeignKey(InternalPerk, on_delete=models.CASCADE, related_name='redemptions')
    employee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='internal_perk_redemptions')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    note = models.TextField(blank=True)  # employee's note when requesting
    hr_note = models.TextField(blank=True)  # HR response note
    requested_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-requested_at']
