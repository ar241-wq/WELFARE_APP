from django.db import models
from django.conf import settings


class Challenge(models.Model):
    STATUS_CHOICES = [('active', 'Active'), ('completed', 'Completed')]
    TYPE_CHOICES = [
        ('kpi',          'KPI Target'),
        ('ai_adoption',  'AI Adoption'),
        ('first_to',     'First to Complete'),
        ('innovation',   'Innovation'),
        ('custom',       'Custom'),
    ]

    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='challenges')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_challenges')
    title = models.CharField(max_length=200)
    description = models.TextField()
    challenge_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='custom')
    target_metric = models.CharField(max_length=255, blank=True, help_text='e.g. "Increase sales by 15%" or "Deploy 2 AI tools"')
    reward_credits = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    winner_department = models.ForeignKey(
        'companies.Department', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='won_challenges'
    )
    deadline = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class ChallengeWinNotification(models.Model):
    """Stored per-user when their department wins a challenge."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='challenge_win_notifications')
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE, related_name='win_notifications')
    department_name = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    seen = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


class ChallengeEntry(models.Model):
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE, related_name='entries')
    employee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='challenge_entries')
    submission = models.TextField()
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('challenge', 'employee')
        ordering = ['submitted_at']

    def __str__(self):
        return f'{self.employee.full_name} → {self.challenge.title}'
