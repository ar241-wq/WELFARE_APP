from django.db import models
from django.conf import settings


class PerkRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='perk_requests'
    )
    perk_name = models.CharField(max_length=255)
    perk_description = models.TextField()
    estimated_credits = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_requests'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.employee.full_name} — {self.perk_name} ({self.status})'


class PerkBundle(models.Model):
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='bundles')
    name = models.CharField(max_length=255)
    perks = models.ManyToManyField('catalog.Perk', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.name} — {self.company.name}'


class BundleAssignment(models.Model):
    bundle = models.ForeignKey(PerkBundle, on_delete=models.CASCADE, related_name='assignments')
    assigned_to_employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='bundle_assignments'
    )
    assigned_to_team = models.ForeignKey(
        'companies.Team',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='bundle_assignments'
    )
    assigned_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        target = self.assigned_to_employee or self.assigned_to_team
        return f'{self.bundle.name} → {target}'
