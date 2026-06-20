from django.contrib import admin
from .models import PerkRequest, PerkBundle, BundleAssignment


@admin.register(PerkRequest)
class PerkRequestAdmin(admin.ModelAdmin):
    list_display = ['employee', 'perk_name', 'estimated_credits', 'status', 'created_at']
    list_filter = ['status']
    search_fields = ['employee__email', 'perk_name']


@admin.register(PerkBundle)
class PerkBundleAdmin(admin.ModelAdmin):
    list_display = ['name', 'company', 'created_at']
    filter_horizontal = ['perks']


@admin.register(BundleAssignment)
class BundleAssignmentAdmin(admin.ModelAdmin):
    list_display = ['bundle', 'assigned_to_employee', 'assigned_to_team', 'assigned_at']
