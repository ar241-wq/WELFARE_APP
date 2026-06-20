from django.urls import path
from .views import slack_events, AIChatView

urlpatterns = [
    path('events/', slack_events, name='slack-events'),
    path('ai/', AIChatView.as_view(), name='ai-chat'),
]
