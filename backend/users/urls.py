from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, LoginView, MeView, AvatarUploadView, LogoUploadView, BirthdayTodayView, ColleagueProfileView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', MeView.as_view(), name='me'),
    path('me/avatar/', AvatarUploadView.as_view(), name='avatar-upload'),
    path('me/logo/', LogoUploadView.as_view(), name='logo-upload'),
    path('birthday-today/', BirthdayTodayView.as_view(), name='birthday-today'),
    path('profile/<int:pk>/', ColleagueProfileView.as_view(), name='colleague-profile'),
]
