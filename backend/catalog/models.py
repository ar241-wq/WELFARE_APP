from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class Category(models.Model):
    name = models.CharField(max_length=100)
    icon = models.CharField(max_length=10, blank=True)
    description = models.TextField(blank=True)
    order = models.IntegerField(default=0)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['order']

    def __str__(self):
        return self.name


class Perk(models.Model):
    provider = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='perks'
    )
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='perks')
    name = models.CharField(max_length=255)
    description = models.TextField()
    credit_price = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    tags = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-is_featured', '-created_at']

    def __str__(self):
        return self.name


class PerkImage(models.Model):
    perk = models.ForeignKey(Perk, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='perk_images/')
    order = models.IntegerField(default=0)


class Redemption(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('redeemed', 'Redeemed'),
        ('expired', 'Expired'),
    ]

    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='redemptions'
    )
    perk = models.ForeignKey(Perk, on_delete=models.CASCADE, related_name='redemptions')
    qr_code = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    redeemed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.employee.full_name} — {self.perk.name}'


class Review(models.Model):
    redemption = models.OneToOneField(
        Redemption,
        on_delete=models.CASCADE,
        related_name='review'
    )
    provider = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='received_reviews'
    )
    perk = models.ForeignKey(
        Perk,
        on_delete=models.CASCADE,
        related_name='reviews'
    )
    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='written_reviews'
    )
    stars = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField(blank=True, max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Review #{self.id} — {self.perk.name} ({self.stars}★)'


class ReputationScore(models.Model):
    TIER_CHOICES = [
        ('unranked', 'Unranked'),
        ('bronze', 'Bronze'),
        ('silver', 'Silver'),
        ('gold', 'Gold'),
        ('platinum', 'Platinum'),
    ]

    provider = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reputation_score'
    )
    composite_score = models.FloatField(null=True, blank=True)
    tier = models.CharField(max_length=20, choices=TIER_CHOICES, default='unranked')
    avg_stars = models.FloatField(null=True, blank=True)
    review_count = models.IntegerField(default=0)
    redemption_count = models.IntegerField(default=0)
    repeat_rate = models.FloatField(default=0.0)
    consistency_score = models.FloatField(default=0.0)
    score_breakdown = models.JSONField(default=dict)
    gap_to_next = models.JSONField(default=dict)
    last_calculated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'ReputationScore — {self.provider.email} ({self.tier})'
