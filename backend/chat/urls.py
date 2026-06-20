from django.urls import path
from .views import ConversationListView, MessageThreadView, UserSearchView

urlpatterns = [
    path('conversations/', ConversationListView.as_view()),
    path('messages/', MessageThreadView.as_view()),
    path('users/', UserSearchView.as_view()),
]
