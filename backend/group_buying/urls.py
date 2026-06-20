from django.urls import path
from . import views

urlpatterns = [
    path('my/', views.MyGroupBuysView.as_view()),
    path('perk/<int:perk_id>/', views.PerkGroupBuysView.as_view()),
    path('<int:pk>/', views.GroupBuyDetailView.as_view()),
    path('<int:pk>/join/', views.GroupBuyJoinView.as_view()),
    path('<int:pk>/lock-in/', views.GroupBuyLockInView.as_view()),
]
