from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/companies/', include('companies.urls')),
    path('api/wallet/', include('wallet.urls')),
    path('api/catalog/', include('catalog.urls')),
    path('api/approvals/', include('approvals.urls')),
    path('api/life-moments/', include('life_moments.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/collaborations/', include('collaborations.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
