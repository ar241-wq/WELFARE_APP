from django.db import models
from django.conf import settings


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
