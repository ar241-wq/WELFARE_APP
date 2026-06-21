from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.contrib.auth import get_user_model
from .models import DirectMessage, GroupChat, GroupMessage
from .serializers import MessageSerializer, GroupMessageSerializer

User = get_user_model()


class ConversationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        me = request.user
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
        msg = DirectMessage.objects.create(
            sender=request.user, recipient=recipient,
            text=text, reply_context=reply_context
        )
        return Response(MessageSerializer(msg, context={'request': request}).data, status=201)


class UserSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        users = User.objects.exclude(pk=request.user.pk).filter(role='employee')
        if q:
            users = users.filter(full_name__icontains=q)
        return Response([{
            'id': u.id,
            'full_name': u.full_name,
            'avatar': request.build_absolute_uri(u.avatar.url) if u.avatar else None,
        } for u in users[:20]])


class GroupChatListView(APIView):
    """
    GET /api/chat/groups/
    Returns all group chats the user belongs to.
    Auto-creates + syncs department group chats for the user's department.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Auto-sync department group chats
        if user.role == 'employee':
            from companies.models import DepartmentMembership
            memberships = DepartmentMembership.objects.filter(employee=user).select_related('department')
            for m in memberships:
                dept = m.department
                gc, _ = GroupChat.objects.get_or_create(
                    department=dept,
                    defaults={
                        'name': f'{dept.name} Team',
                        'icon': '🏢',
                        'group_type': 'department',
                    }
                )
                gc.members.add(user)

        # Community chats — based on redeemed perk categories
        from catalog.models import Redemption
        redeemed_category_ids = Redemption.objects.filter(
            employee=user
        ).values_list('perk__category_id', flat=True).distinct()

        for cat_id in redeemed_category_ids:
            if not cat_id:
                continue
            from catalog.models import Category
            try:
                cat = Category.objects.get(pk=cat_id)
                gc, _ = GroupChat.objects.get_or_create(
                    category=cat,
                    defaults={
                        'name': f'{cat.name} Community',
                        'icon': cat.icon or '💬',
                        'group_type': 'community',
                    }
                )
                gc.members.add(user)
            except Category.DoesNotExist:
                pass

        # Return all groups user is in
        groups = GroupChat.objects.filter(members=user).order_by('group_type', 'name')
        result = []
        for g in groups:
            last_msg = g.messages.last()
            result.append({
                'id': g.id,
                'name': g.name,
                'icon': g.icon,
                'type': g.group_type,
                'member_count': g.members.count(),
                'last_message': last_msg.text if last_msg else '',
                'last_sender': last_msg.sender.full_name.split()[0] if last_msg else '',
                'last_time': last_msg.created_at.isoformat() if last_msg else '',
            })
        return Response(result)


class GroupMessageView(APIView):
    """
    GET  /api/chat/groups/<pk>/messages/
    POST /api/chat/groups/<pk>/messages/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            group = GroupChat.objects.get(pk=pk, members=request.user)
        except GroupChat.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)
        msgs = group.messages.select_related('sender').all()
        return Response(GroupMessageSerializer(msgs, many=True, context={'request': request}).data)

    def post(self, request, pk):
        try:
            group = GroupChat.objects.get(pk=pk, members=request.user)
        except GroupChat.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)
        text = request.data.get('text', '').strip()
        if not text:
            return Response({'detail': 'text required'}, status=400)
        msg = GroupMessage.objects.create(group=group, sender=request.user, text=text)
        return Response(GroupMessageSerializer(msg, context={'request': request}).data, status=201)
