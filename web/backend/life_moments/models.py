from django.db import models
from django.conf import settings


class LifeEvent(models.Model):
    EVENT_CHOICES = [
        ('new_baby', 'New Baby'),
        ('medical', 'Medical Leave'),
        ('relocation', 'Relocation'),
        ('bereavement', 'Bereavement'),
        ('burnout', 'Burnout Leave'),
    ]

    EVENT_TAGS = {
        'new_baby': ['food', 'childcare', 'wellness', 'sleep'],
        'medical': ['wellness', 'therapy', 'food', 'health'],
        'relocation': ['food', 'lifestyle', 'connectivity'],
        'bereavement': ['wellness', 'therapy', 'food'],
        'burnout': ['wellness', 'therapy', 'fitness', 'food'],
    }

    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='life_events'
    )
    event_type = models.CharField(max_length=30, choices=EVENT_CHOICES)
    note = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.employee.full_name} — {self.get_event_type_display()}'


class CarePackage(models.Model):
    STATUS_CHOICES = [
        ('pending_approval', 'Pending Approval'),
        ('approved', 'Approved'),
        ('delivered', 'Delivered'),
    ]

    life_event = models.OneToOneField(LifeEvent, on_delete=models.CASCADE, related_name='care_package')
    perks = models.ManyToManyField('catalog.Perk', blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending_approval')
    credit_boost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_care_packages'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Care package for {self.life_event}'


class CreditDonation(models.Model):
    from_wallet = models.ForeignKey('wallet.Wallet', on_delete=models.CASCADE, related_name='donations_made')
    to_wallet = models.ForeignKey('wallet.Wallet', on_delete=models.CASCADE, related_name='donations_received')
    life_event = models.ForeignKey(LifeEvent, on_delete=models.CASCADE, related_name='donations')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    is_anonymous = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Donation of {self.amount} credits to {self.to_wallet.employee.full_name}'
