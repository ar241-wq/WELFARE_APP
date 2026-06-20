from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal


def discount_for_count(count):
    if count >= 10:
        return Decimal('0.15')
    elif count >= 5:
        return Decimal('0.10')
    elif count >= 3:
        return Decimal('0.05')
    return Decimal('0')


class GroupBuy(models.Model):
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('expired', 'Expired'),
    ]
    perk = models.ForeignKey('catalog.Perk', on_delete=models.CASCADE, related_name='group_buys')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_group_buys')
    expires_at = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(hours=48)
        super().save(*args, **kwargs)

    @property
    def member_count(self):
        return self.members.count()

    @property
    def discount_rate(self):
        return discount_for_count(self.member_count)

    @property
    def discounted_price(self):
        base = self.perk.credit_price
        return base * (1 - self.discount_rate)

    @property
    def is_active(self):
        return self.status == 'open' and self.expires_at > timezone.now()

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'GroupBuy: {self.perk.name} ({self.member_count} members)'


class GroupBuyMember(models.Model):
    group_buy = models.ForeignKey(GroupBuy, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='group_buy_memberships')
    locked_in = models.BooleanField(default=False)
    locked_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['group_buy', 'user']
