from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Max, OuterRef, Subquery
from django.contrib.auth import get_user_model
from .models import DirectMessage
from .serializers import MessageSerializer

User = get_user_model()

class ConversationListView(APIView):
    """Returns list of unique conversation partners with last message."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        me = request.user
        # Get all users who have exchanged messages with me
        partner_ids = set()
        sent = DirectMessage.objects.filter(sender=me).values_list('recipient_id', flat=True)
        received = DirectMessage.objects.filter(recipient=me).values_list('sender_id', flat=True)
        partner_ids.update(sent)
        partner_ids.update(received)

        conversations = []
        for pid in partner_ids:
            partner = User.objects.filter(pk=pid).first()
            if not partner:
                continue
            last_msg = DirectMessage.objects.filter(
                Q(sender=me, recipient=partner) | Q(sender=partner, recipient=me)
            ).last()
            unread = DirectMessage.objects.filter(sender=partner, recipient=me, read=False).count()
            conversations.append({
                'user_id': partner.id,
                'user_name': partner.full_name,
                'user_avatar': request.build_absolute_uri(partner.avatar.url) if partner.avatar else None,
                'last_message': last_msg.text if last_msg else '',
                'last_time': last_msg.created_at.isoformat() if last_msg else '',
                'unread': unread,
            })

        conversations.sort(key=lambda c: c['last_time'], reverse=True)
        return Response(conversations)


class MessageThreadView(APIView):
    """GET messages with a user, POST to send a message."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        with_id = request.query_params.get('with')
        if not with_id:
            return Response({'detail': 'with param required'}, status=400)
        partner = User.objects.filter(pk=with_id).first()
        if not partner:
            return Response({'detail': 'User not found'}, status=404)

        msgs = DirectMessage.objects.filter(
            Q(sender=request.user, recipient=partner) |
            Q(sender=partner, recipient=request.user)
        )
        # Mark as read
        msgs.filter(recipient=request.user, read=False).update(read=True)
        return Response(MessageSerializer(msgs, many=True, context={'request': request}).data)

    def post(self, request):
        recipient_id = request.data.get('recipient_id')
        text = request.data.get('text', '').strip()
        reply_context = request.data.get('reply_context', '').strip()
        if not recipient_id or not text:
            return Response({'detail': 'recipient_id and text required'}, status=400)
        recipient = User.objects.filter(pk=recipient_id).first()
        if not recipient:
            return Response({'detail': 'User not found'}, status=404)
        msg = DirectMessage.objects.create(sender=request.user, recipient=recipient, text=text, reply_context=reply_context)
        return Response(MessageSerializer(msg, context={'request': request}).data, status=201)


class UserSearchView(APIView):
    """Search for users to start a chat with."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        users = User.objects.exclude(pk=request.user.pk).filter(role='employee')
        if q:
            users = users.filter(full_name__icontains=q)
        users = users[:20]
        return Response([{
            'id': u.id,
            'full_name': u.full_name,
            'avatar': request.build_absolute_uri(u.avatar.url) if u.avatar else None,
        } for u in users])
