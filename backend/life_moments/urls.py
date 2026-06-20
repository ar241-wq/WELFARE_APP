from django.urls import path
from .views import LifeEventView, PendingLifeEventsView, ApproveCarePackageView, DonateToEventView

urlpatterns = [
    path('', LifeEventView.as_view(), name='life-events'),
    path('pending/', PendingLifeEventsView.as_view(), name='pending-life-events'),
    path('<int:pk>/approve/', ApproveCarePackageView.as_view(), name='approve-care-package'),
    path('<int:pk>/donate/', DonateToEventView.as_view(), name='donate-to-event'),
]
