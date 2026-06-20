from django.urls import path
from .views import PerkRequestView, ReviewRequestView, PerkBundleView, AssignBundleView

urlpatterns = [
    path('requests/', PerkRequestView.as_view(), name='perk-requests'),
    path('requests/<int:pk>/', ReviewRequestView.as_view(), name='review-request'),
    path('bundles/', PerkBundleView.as_view(), name='bundles'),
    path('bundles/<int:pk>/assign/', AssignBundleView.as_view(), name='assign-bundle'),
]
