from django.db import models
from django.conf import settings


class DirectMessage(models.Model):
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_messages')
    text = models.TextField()
    reply_context = models.CharField(max_length=140, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False)

    class Meta:
        ordering = ['created_at']


class GroupChat(models.Model):
    GROUP_TYPE_CHOICES = [('department', 'Department'), ('community', 'Community')]

    name = models.CharField(max_length=120)
    icon = models.CharField(max_length=10, default='💬')
    group_type = models.CharField(max_length=20, choices=GROUP_TYPE_CHOICES, default='community')
    department = models.OneToOneField(
        'companies.Department', on_delete=models.CASCADE,
        null=True, blank=True, related_name='group_chat'
    )
    category = models.OneToOneField(
        'catalog.Category', on_delete=models.CASCADE,
        null=True, blank=True, related_name='group_chat'
    )
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name='group_chats')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class GroupMessage(models.Model):
    group = models.ForeignKey(GroupChat, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='group_messages')
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
