from django.urls import path
from .views import SpendByCategoryView, UtilizationView, TopPerksView, ProviderStatsView

urlpatterns = [
    path('spend/', SpendByCategoryView.as_view(), name='spend'),
    path('utilization/', UtilizationView.as_view(), name='utilization'),
    path('top-perks/', TopPerksView.as_view(), name='top-perks'),
    path('provider-stats/', ProviderStatsView.as_view(), name='provider-stats'),
]
