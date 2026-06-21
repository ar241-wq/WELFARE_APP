from django.urls import path
from .views import (
    CategoryListView, PerkListView, PerkDetailView, FeaturedPerksView,
    SuggestionsView, RedeemPerkView, RedemptionListView, ProviderPerkCreateView,
    ScanRedemptionView, PerkImageView,
    ReviewSubmitView, ReviewCheckView,
    ProviderReviewListView, ProviderReputationView,
    TopProvidersView, PerkReviewListView,
)

urlpatterns = [
    path('categories/', CategoryListView.as_view(), name='categories'),
    path('perks/', PerkListView.as_view(), name='perks'),
    path('perks/featured/', FeaturedPerksView.as_view(), name='featured-perks'),
    path('perks/suggestions/', SuggestionsView.as_view(), name='suggestions'),
    path('perks/manage/', ProviderPerkCreateView.as_view(), name='perk-manage'),
    path('perks/manage/<int:pk>/', ProviderPerkCreateView.as_view(), name='perk-manage-detail'),
    path('perks/manage/<int:pk>/images/', PerkImageView.as_view(), name='perk-images'),
    path('perks/manage/<int:pk>/images/<int:img_pk>/', PerkImageView.as_view(), name='perk-image-delete'),
    path('perks/<int:pk>/', PerkDetailView.as_view(), name='perk-detail'),
    path('redeem/<int:pk>/', RedeemPerkView.as_view(), name='redeem'),
    path('redeem/scan/', ScanRedemptionView.as_view(), name='redeem-scan'),
    path('redemptions/', RedemptionListView.as_view(), name='redemptions'),
    # Reviews
    path('reviews/', ReviewSubmitView.as_view(), name='review-submit'),
    path('reviews/check/', ReviewCheckView.as_view(), name='review-check'),
    # Provider reputation
    path('providers/top/', TopProvidersView.as_view(), name='top-providers'),
    path('providers/<int:provider_id>/reviews/', ProviderReviewListView.as_view(), name='provider-reviews'),
    path('providers/<int:provider_id>/reputation/', ProviderReputationView.as_view(), name='provider-reputation'),
    # Perk reviews
    path('perks/<int:pk>/reviews/', PerkReviewListView.as_view(), name='perk-reviews'),
]
