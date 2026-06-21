from rest_framework import serializers
from django.utils import timezone
from .models import SecretSantaEvent, SantaParticipant, SantaAssignment


class SecretSantaEventSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    participant_count = serializers.SerializerMethodField()
    is_joined = serializers.SerializerMethodField()
    my_assignment = serializers.SerializerMethodField()
    my_gift_received = serializers.SerializerMethodField()
    is_revealed = serializers.SerializerMethodField()
    all_assignments = serializers.SerializerMethodField()
    participants = serializers.SerializerMethodField()

    class Meta:
        model = SecretSantaEvent
        fields = [
            'id', 'title', 'department_name', 'credit_budget',
            'join_deadline', 'reveal_date', 'status',
            'participant_count', 'is_joined', 'my_assignment', 'my_gift_received',
            'is_revealed', 'all_assignments', 'participants', 'created_at',
        ]

    def get_participant_count(self, obj):
        return obj.participants.count()

    def get_is_joined(self, obj):
        user = self.context['request'].user
        return obj.participants.filter(user=user).exists()

    def get_my_assignment(self, obj):
        user = self.context['request'].user
        if obj.status not in ('assigned', 'revealed'):
            return None
        try:
            assignment = obj.assignments.select_related('gifted_perk').get(giver=user)
            gift_sent = obj.participants.filter(user=user).values_list('gift_sent', flat=True).first() or False
            result = {
                'receiver_id': assignment.receiver.id,
                'receiver_name': assignment.receiver.full_name,
                'gift_sent': gift_sent,
                'gifted_perk_name': assignment.gifted_perk.name if assignment.gifted_perk else None,
            }
            return result
        except SantaAssignment.DoesNotExist:
            return None

    def get_my_gift_received(self, obj):
        """What gift the current user received (only visible after reveal)."""
        if obj.status != 'revealed':
            return None
        user = self.context['request'].user
        try:
            assignment = obj.assignments.select_related('giver', 'gifted_perk').get(receiver=user)
            result = {'giver_name': assignment.giver.full_name}
            if assignment.gifted_perk:
                result['perk_name'] = assignment.gifted_perk.name
                result['perk_description'] = assignment.gifted_perk.description
            return result
        except SantaAssignment.DoesNotExist:
            return None

    def get_is_revealed(self, obj):
        return obj.status == 'revealed' or (obj.reveal_date and obj.reveal_date <= timezone.now())

    def get_participants(self, obj):
        return [
            {'id': p.user.id, 'name': p.user.full_name, 'gift_sent': p.gift_sent}
            for p in obj.participants.select_related('user')
        ]

    def get_all_assignments(self, obj):
        if obj.status != 'revealed' and not (obj.reveal_date and obj.reveal_date <= timezone.now()):
            return None
        return [
            {
                'giver_name': a.giver.full_name,
                'receiver_name': a.receiver.full_name,
                'gifted_perk_name': a.gifted_perk.name if a.gifted_perk else None,
            }
            for a in obj.assignments.select_related('giver', 'receiver', 'gifted_perk')
        ]
