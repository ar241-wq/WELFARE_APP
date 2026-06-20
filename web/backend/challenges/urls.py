from django.urls import path
from .views import ChallengeListView, ChallengeDetailView, DistributePrizeView, ChallengeWinNotificationView

urlpatterns = [
    path('', ChallengeListView.as_view()),
    path('win-notifications/', ChallengeWinNotificationView.as_view()),
    path('<int:pk>/', ChallengeDetailView.as_view()),
    path('<int:pk>/distribute/', DistributePrizeView.as_view()),
]
