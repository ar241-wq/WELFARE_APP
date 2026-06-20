from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count
from django.utils import timezone
from catalog.models import Category, Redemption
from .models import Post, Like, PostView
from .serializers import PostSerializer


def get_user_categories(user):
    return list(
        Redemption.objects.filter(employee=user)
        .values_list('perk__category_id', flat=True).distinct()
    )


class PostListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_cat_ids = get_user_categories(request.user)
        if not user_cat_ids:
            return Response({'detail': 'No access. Redeem a perk first.'}, status=403)

        category_id = request.query_params.get('category')
        qs = (Post.objects
              .select_related('author', 'category')
              .prefetch_related('likes', 'views')
              .filter(expires_at__gt=timezone.now())
              .filter(category_id__in=user_cat_ids)
              .exclude(author=request.user))  # exclude your own — you already saw them

        if category_id:
            if int(category_id) not in user_cat_ids:
                return Response({'detail': 'You have not purchased any perks in this category.'}, status=403)
            qs = qs.filter(category_id=category_id)

        # Exclude posts the user has already viewed (they're gone)
        viewed_ids = set(PostView.objects.filter(user=request.user).values_list('post_id', flat=True))
        unviewed = [p for p in qs if p.id not in viewed_ids]

        return Response(PostSerializer(unviewed, many=True, context={'request': request}).data)

    def post(self, request):
        user_cat_ids = get_user_categories(request.user)
        category_id = request.data.get('category_id')
        caption = request.data.get('caption', '').strip()
        image = request.FILES.get('image')

        if not category_id:
            return Response({'detail': 'category_id is required.'}, status=400)
        if int(category_id) not in user_cat_ids:
            return Response({'detail': 'You need to purchase a perk in this category to post here.'}, status=403)

        try:
            category = Category.objects.get(pk=category_id)
        except Category.DoesNotExist:
            return Response({'detail': 'Category not found.'}, status=404)

        post = Post.objects.create(
            author=request.user, category=category, caption=caption, image=image or None,
        )
        return Response(PostSerializer(post, context={'request': request}).data, status=201)


class PostDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            post = Post.objects.get(pk=pk, author=request.user)
        except Post.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)
        if post.image:
            post.image.delete(save=False)
        post.delete()
        return Response(status=204)


class PostViewMarkView(APIView):
    """Mark an instant as viewed — it disappears permanently for this user."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            post = Post.objects.get(pk=pk)
        except Post.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)
        PostView.objects.get_or_create(post=post, user=request.user)
        return Response({'viewed': True, 'deleted': True})


class PostLikeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            post = Post.objects.get(pk=pk)
        except Post.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)

        user_cat_ids = get_user_categories(request.user)
        if post.category_id not in user_cat_ids:
            return Response({'detail': 'Join this community first.'}, status=403)

        like, created = Like.objects.get_or_create(post=post, user=request.user)
        if not created:
            like.delete()
            return Response({'liked': False, 'count': post.likes.count()})
        return Response({'liked': True, 'count': post.likes.count()})


class MyInstantsView(APIView):
    """Returns the current user's own posted instants."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        posts = Post.objects.filter(
            author=request.user, expires_at__gt=timezone.now()
        ).select_related('category').prefetch_related('likes', 'views')
        return Response(PostSerializer(posts, many=True, context={'request': request}).data)


class CategoryFeedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_cat_ids = get_user_categories(request.user)
        cats = Category.objects.filter(pk__in=user_cat_ids).annotate(post_count=Count('posts'))
        return Response([{'id': c.id, 'name': c.name, 'icon': c.icon, 'post_count': c.post_count} for c in cats])
