from django.urls import path
from .views import ConversationListView, MessageThreadView, UserSearchView, GroupChatListView, GroupChatMessagesView

urlpatterns = [
    path('conversations/', ConversationListView.as_view()),
    path('messages/', MessageThreadView.as_view()),
    path('users/', UserSearchView.as_view()),
    path('groups/', GroupChatListView.as_view()),
    path('groups/<int:pk>/messages/', GroupChatMessagesView.as_view()),
]
