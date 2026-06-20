from django.urls import path
from .views import CompanyView, EmployeeListView, EmployeeDetailView, AllocateCreditsView, TeamListView, TeamDetailView

urlpatterns = [
    path('', CompanyView.as_view(), name='company'),
    path('settings/', CompanyView.as_view(), name='company-settings'),
    path('employees/', EmployeeListView.as_view(), name='employees'),
    path('employees/<int:pk>/', EmployeeDetailView.as_view(), name='employee-detail'),
    path('allocate/', AllocateCreditsView.as_view(), name='allocate'),
    path('teams/', TeamListView.as_view(), name='teams'),
    path('teams/<int:pk>/', TeamDetailView.as_view(), name='team-detail'),
]
