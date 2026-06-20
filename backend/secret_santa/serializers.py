from rest_framework import serializers
from django.utils import timezone
from .models import SecretSantaEvent, SantaParticipant, SantaAssignment


class SecretSantaEventSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    participant_count = serializers.SerializerMethodField()
    is_joined = serializers.SerializerMethodField()
    my_assignment = serializers.SerializerMethodField()
    is_revealed = serializers.SerializerMethodField()
    all_assignments = serializers.SerializerMethodField()

    class Meta:
        model = SecretSantaEvent
        fields = [
            'id', 'title', 'department_name', 'credit_budget',
            'join_deadline', 'reveal_date', 'status',
            'participant_count', 'is_joined', 'my_assignment',
            'is_revealed', 'all_assignments', 'created_at',
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
            assignment = obj.assignments.get(giver=user)
            return {
                'receiver_id': assignment.receiver.id,
                'receiver_name': assignment.receiver.full_name,
            }
        except SantaAssignment.DoesNotExist:
            return None

    def get_is_revealed(self, obj):
        return obj.status == 'revealed' or (obj.reveal_date and obj.reveal_date <= timezone.now())

    def get_all_assignments(self, obj):
        if obj.status != 'revealed' and not (obj.reveal_date and obj.reveal_date <= timezone.now()):
            return None
        return [
            {
                'giver_name': a.giver.full_name,
                'receiver_name': a.receiver.full_name,
            }
            for a in obj.assignments.select_related('giver', 'receiver')
        ]
