from rest_framework import serializers
from django.utils import timezone
from .models import Post


class PostSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.full_name', read_only=True)
    author_id = serializers.IntegerField(source='author.id', read_only=True)
    author_avatar = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_icon = serializers.CharField(source='category.icon', read_only=True)
    like_count = serializers.SerializerMethodField()
    liked_by_me = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    expires_at = serializers.DateTimeField(read_only=True)
    seconds_left = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'author_id', 'author_name', 'author_avatar',
            'category_name', 'category_icon',
            'caption', 'image_url', 'like_count', 'liked_by_me',
            'created_at', 'expires_at', 'seconds_left',
        ]

    def get_author_avatar(self, obj):
        req = self.context.get('request')
        if obj.author.avatar:
            url = obj.author.avatar.url
            return req.build_absolute_uri(url) if req else url
        return None

    def get_image_url(self, obj):
        req = self.context.get('request')
        if obj.image:
            url = obj.image.url
            return req.build_absolute_uri(url) if req else url
        return None

    def get_like_count(self, obj):
        return obj.likes.count()

    def get_liked_by_me(self, obj):
        req = self.context.get('request')
        if req and req.user.is_authenticated:
            return obj.likes.filter(user=req.user).exists()
        return False

    def get_seconds_left(self, obj):
        if not obj.expires_at:
            return 86400
        delta = (obj.expires_at - timezone.now()).total_seconds()
        return max(0, int(delta))
