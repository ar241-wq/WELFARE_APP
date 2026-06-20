from django.urls import path
from .views import PostListView, PostDetailView, PostLikeView, PostViewMarkView, MyInstantsView, CategoryFeedView

urlpatterns = [
    path('', PostListView.as_view(), name='posts'),
    path('mine/', MyInstantsView.as_view(), name='my-instants'),
    path('<int:pk>/', PostDetailView.as_view(), name='post-detail'),
    path('<int:pk>/view/', PostViewMarkView.as_view(), name='post-view'),
    path('<int:pk>/like/', PostLikeView.as_view(), name='post-like'),
    path('categories/', CategoryFeedView.as_view(), name='community-categories'),
]
