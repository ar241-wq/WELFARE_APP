from django.contrib import admin
from .models import Company, Team, TeamMembership


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ['name', 'industry', 'monthly_budget_per_employee', 'credits_rollover', 'created_at']
    search_fields = ['name']


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ['name', 'company', 'manager']
    list_filter = ['company']


@admin.register(TeamMembership)
class TeamMembershipAdmin(admin.ModelAdmin):
    list_display = ['employee', 'team', 'joined_at']
