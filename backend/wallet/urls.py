from django.urls import path
from .views import WalletView, TransactionListView, DonateView, GiftCreditsView

urlpatterns = [
    path('', WalletView.as_view(), name='wallet'),
    path('transactions/', TransactionListView.as_view(), name='transactions'),
    path('donate/', DonateView.as_view(), name='donate'),
    path('gift/', GiftCreditsView.as_view(), name='gift-credits'),
]
