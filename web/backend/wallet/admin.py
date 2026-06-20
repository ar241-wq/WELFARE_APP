from django.contrib import admin
from .models import Wallet, Transaction, CreditAllocation


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ['employee', 'balance', 'updated_at']
    search_fields = ['employee__email', 'employee__full_name']


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['wallet', 'amount', 'type', 'description', 'created_at']
    list_filter = ['type']
    search_fields = ['wallet__employee__email']


@admin.register(CreditAllocation)
class CreditAllocationAdmin(admin.ModelAdmin):
    list_display = ['employee', 'company', 'amount', 'month', 'expires_at']
    list_filter = ['month', 'company']
