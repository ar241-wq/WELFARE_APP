from django.db import models
from django.conf import settings


class Collaboration(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
    ]
    from_provider = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_collaborations')
    to_provider = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_collaborations')
    message = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ['from_provider', 'to_provider']

    def __str__(self):
        return f'{self.from_provider.full_name} → {self.to_provider.full_name} ({self.status})'


class PackageDeal(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('offered', 'Offered'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]
    collaboration = models.ForeignKey(
        Collaboration, on_delete=models.CASCADE, related_name='packages')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    perks = models.ManyToManyField('catalog.Perk', blank=True, related_name='package_deals')
    target_employer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='received_packages')
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    from_provider_confirmed = models.BooleanField(default=False)
    to_provider_confirmed = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='created_packages')
    created_at = models.DateTimeField(auto_now_add=True)
    offered_at = models.DateTimeField(null=True, blank=True)
    responded_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.name
