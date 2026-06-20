from django.contrib import admin
from .models import Category, Perk, PerkImage, Redemption


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'icon', 'order']
    ordering = ['order']


@admin.register(Perk)
class PerkAdmin(admin.ModelAdmin):
    list_display = ['name', 'provider', 'category', 'credit_price', 'is_active', 'is_featured']
    list_filter = ['category', 'is_active', 'is_featured']
    search_fields = ['name', 'provider__email']
    list_editable = ['is_active', 'is_featured']


@admin.register(Redemption)
class RedemptionAdmin(admin.ModelAdmin):
    list_display = ['employee', 'perk', 'status', 'created_at']
    list_filter = ['status']
    search_fields = ['employee__email', 'perk__name']
