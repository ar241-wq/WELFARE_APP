from django.db import models
from django.conf import settings
import random

class SecretSantaEvent(models.Model):
    STATUS_CHOICES = [
        ('open', 'Open for joining'),
        ('assigned', 'Assignments locked'),
        ('revealed', 'Revealed'),
    ]
    department = models.ForeignKey('companies.Department', on_delete=models.CASCADE, related_name='santa_events')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_santa_events')
    title = models.CharField(max_length=200, default='Secret Santa')
    credit_budget = models.DecimalField(max_digits=10, decimal_places=2, default=50)
    join_deadline = models.DateTimeField()
    reveal_date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.title} — {self.department.name}'

    def assign_santas(self):
        """Randomly assign each participant a recipient. Stored as SantaAssignment rows."""
        participants = list(self.participants.select_related('user'))
        if len(participants) < 2:
            return False
        users = [p.user for p in participants]
        shuffled = users.copy()
        # Ensure nobody gets themselves
        while any(shuffled[i] == users[i] for i in range(len(users))):
            random.shuffle(shuffled)
        SantaAssignment.objects.filter(event=self).delete()
        for giver, receiver in zip(users, shuffled):
            SantaAssignment.objects.create(event=self, giver=giver, receiver=receiver)
        self.status = 'assigned'
        self.save()
        return True


class SantaParticipant(models.Model):
    event = models.ForeignKey(SecretSantaEvent, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='santa_participations')
    joined_at = models.DateTimeField(auto_now_add=True)
    gift_sent = models.BooleanField(default=False)

    class Meta:
        unique_together = ['event', 'user']


class SantaAssignment(models.Model):
    event = models.ForeignKey(SecretSantaEvent, on_delete=models.CASCADE, related_name='assignments')
    giver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='santa_giving')
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='santa_receiving')
    gifted_perk = models.ForeignKey('catalog.Perk', on_delete=models.SET_NULL, null=True, blank=True, related_name='santa_gifts')
    gift_seen = models.BooleanField(default=False)

    class Meta:
        unique_together = ['event', 'giver']
