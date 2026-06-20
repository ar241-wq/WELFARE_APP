from django.contrib import admin
from .models import LifeEvent, CarePackage, CreditDonation


@admin.register(LifeEvent)
class LifeEventAdmin(admin.ModelAdmin):
    list_display = ['employee', 'event_type', 'is_active', 'created_at']
    list_filter = ['event_type', 'is_active']
    search_fields = ['employee__email']


@admin.register(CarePackage)
class CarePackageAdmin(admin.ModelAdmin):
    list_display = ['life_event', 'status', 'credit_boost', 'approved_by', 'approved_at']
    list_filter = ['status']
    filter_horizontal = ['perks']


@admin.register(CreditDonation)
class CreditDonationAdmin(admin.ModelAdmin):
    list_display = ['to_wallet', 'amount', 'life_event', 'created_at']
