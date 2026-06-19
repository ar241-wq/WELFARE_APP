from django.urls import path
from .views import (
    CollaborationListView, CollaborationRespondView,
    PackageDealListView, PackageDealDetailView, PackageDealOfferView,
    EmployerPackageOffersView, EmployerPackageRespondView,
    EmployeePackagesView, RedeemPackageView,
)

urlpatterns = [
    # Provider
    path('', CollaborationListView.as_view(), name='collaborations'),
    path('<int:pk>/respond/', CollaborationRespondView.as_view(), name='collab-respond'),
    path('packages/', PackageDealListView.as_view(), name='packages'),
    path('packages/<int:pk>/', PackageDealDetailView.as_view(), name='package-detail'),
    path('packages/<int:pk>/offer/', PackageDealOfferView.as_view(), name='package-offer'),
    # Employer
    path('offers/', EmployerPackageOffersView.as_view(), name='employer-offers'),
    path('offers/<int:pk>/', EmployerPackageRespondView.as_view(), name='employer-offer-respond'),
    # Employee
    path('my-packages/', EmployeePackagesView.as_view(), name='employee-packages'),
    path('my-packages/<int:pk>/redeem/', RedeemPackageView.as_view(), name='redeem-package'),
]
