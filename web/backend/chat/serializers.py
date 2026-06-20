from rest_framework import serializers
from .models import DirectMessage

class MessageSerializer(serializers.ModelSerializer):
    sender_id = serializers.IntegerField(source='sender.id', read_only=True)
    sender_name = serializers.CharField(source='sender.full_name', read_only=True)
    sender_avatar = serializers.SerializerMethodField()
    recipient_id = serializers.IntegerField(source='recipient.id', read_only=True)

    class Meta:
        model = DirectMessage
        fields = ['id', 'sender_id', 'sender_name', 'sender_avatar', 'recipient_id', 'text', 'reply_context', 'created_at', 'read']

    def get_sender_avatar(self, obj):
        req = self.context.get('request')
        if obj.sender.avatar and req:
            return req.build_absolute_uri(obj.sender.avatar.url)
        return None
