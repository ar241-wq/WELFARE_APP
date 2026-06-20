from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta


class Post(models.Model):
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='community_posts')
    category = models.ForeignKey(
        'catalog.Category', on_delete=models.SET_NULL, null=True, related_name='posts')
    caption = models.TextField(blank=True)
    image = models.ImageField(upload_to='community/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = (self.created_at or timezone.now()) + timedelta(hours=24)
        super().save(*args, **kwargs)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.author.full_name} — {self.category}'


class Like(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='post_likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['post', 'user']


class PostView(models.Model):
    """Records that a user has opened/viewed an instant. Once viewed it's gone for them."""
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='views')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='viewed_posts')
    viewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['post', 'user']
