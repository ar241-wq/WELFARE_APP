from django.urls import path
from . import views

urlpatterns = [
    path('', views.InternalPerkListView.as_view()),
    path('<int:pk>/', views.InternalPerkDetailView.as_view()),
    path('<int:pk>/redeem/', views.InternalPerkRedeemView.as_view()),
    path('hr/requests/', views.HRRedemptionListView.as_view()),
    path('hr/requests/<int:pk>/resolve/', views.HRRedemptionResolveView.as_view()),
]
