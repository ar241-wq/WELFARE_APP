from django.urls import path
from .views import (
    CategoryListView, PerkListView, PerkDetailView, FeaturedPerksView,
    SuggestionsView, RedeemPerkView, RedemptionListView, ProviderPerkCreateView,
    ScanRedemptionView,
)

urlpatterns = [
    path('categories/', CategoryListView.as_view(), name='categories'),
    path('perks/', PerkListView.as_view(), name='perks'),
    path('perks/featured/', FeaturedPerksView.as_view(), name='featured-perks'),
    path('perks/suggestions/', SuggestionsView.as_view(), name='suggestions'),
    path('perks/manage/', ProviderPerkCreateView.as_view(), name='perk-manage'),
    path('perks/manage/<int:pk>/', ProviderPerkCreateView.as_view(), name='perk-manage-detail'),
    path('perks/<int:pk>/', PerkDetailView.as_view(), name='perk-detail'),
    path('redeem/<int:pk>/', RedeemPerkView.as_view(), name='redeem'),
    path('redeem/scan/', ScanRedemptionView.as_view(), name='redeem-scan'),
    path('redemptions/', RedemptionListView.as_view(), name='redemptions'),
]
