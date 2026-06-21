from django.urls import path
from . import views

urlpatterns = [
    path('hr/', views.HRSantaView.as_view()),
    path('gifts/notifications/', views.SantaGiftNotificationsView.as_view()),
    path('', views.MyDepartmentSantaView.as_view()),
    path('<int:pk>/', views.SantaEventDetailView.as_view()),
    path('<int:pk>/join/', views.SantaJoinView.as_view()),
    path('<int:pk>/assign/', views.SantaAssignView.as_view()),
    path('<int:pk>/send-gift/', views.SantaSendGiftView.as_view()),
    path('<int:pk>/reveal/', views.SantaRevealView.as_view()),
]
