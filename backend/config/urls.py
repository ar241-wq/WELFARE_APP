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
    path('api/community/', include('community.urls')),
    path('api/chat/', include('chat.urls')),
    path('api/slack/', include('slack_bot.urls')),
    path('api/santa/', include('secret_santa.urls')),
    path('api/group-buy/', include('group_buying.urls')),
    path('api/internal-perks/', include('internal_perks.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
