from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.utils import timezone
from .serializers import RegisterSerializer, UserSerializer, CustomTokenObtainPairSerializer, UpdateProfileSerializer

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Auto-create wallet for employees
        if user.role == 'employee':
            from wallet.models import Wallet
            Wallet.objects.get_or_create(employee=user)

        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UpdateProfileSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)


class AvatarUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        image = request.FILES.get('avatar')
        if not image:
            return Response({'detail': 'No image provided.'}, status=400)

        user = request.user
        if user.avatar:
            user.avatar.delete(save=False)
        user.avatar = image
        user.save()
        return Response(UserSerializer(user).data)


class BirthdayTodayView(APIView):
    """Returns colleagues in the same company who have their birthday today."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        if not request.user.company:
            return Response([])
        # Exclude people the current user already gifted today
        from wallet.models import BirthdayGift
        already_gifted_ids = BirthdayGift.objects.filter(
            from_user=request.user,
            created_at__date=today,
        ).values_list('to_user_id', flat=True)
        colleagues = User.objects.filter(
            company=request.user.company,
            birthday__month=today.month,
            birthday__day=today.day,
            role='employee',
        ).exclude(pk=request.user.pk).exclude(pk__in=already_gifted_ids)
        return Response([{
            'id': u.id,
            'full_name': u.full_name,
            'avatar': request.build_absolute_uri(u.avatar.url) if u.avatar else None,
        } for u in colleagues])


class ColleagueProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        from django.shortcuts import get_object_or_404
        colleague = get_object_or_404(User, pk=user_id, role='employee')

        # Department
        dept_membership = colleague.department_memberships.select_related('department').first()
        department = {'id': dept_membership.department.id, 'name': dept_membership.department.name} if dept_membership else None

        # Birthday (month/day only for privacy)
        birthday_display = None
        if colleague.birthday:
            birthday_display = colleague.birthday.strftime('%B %d')

        # Life events (active, public ones)
        from life_moments.models import LifeEvent
        events = LifeEvent.objects.filter(employee=colleague, is_active=True).values(
            'id', 'event_type', 'event_type_display', 'created_at'
        )

        # Credits received total
        from wallet.models import Transaction
        wallet = getattr(colleague, 'wallet', None)
        credits_received = 0
        if wallet:
            from django.db.models import Sum
            total = wallet.transactions.filter(type='credit').aggregate(s=Sum('amount'))['s']
            credits_received = int(total or 0)

        return Response({
            'id': colleague.id,
            'full_name': colleague.full_name,
            'avatar': request.build_absolute_uri(colleague.avatar.url) if colleague.avatar else None,
            'department': department,
            'birthday': birthday_display,
            'life_events': list(events),
            'credits_received': credits_received,
        })


class LogoUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        image = request.FILES.get('logo')
        if not image:
            return Response({'detail': 'No image provided.'}, status=400)

        user = request.user
        if user.role == 'provider':
            profile, _ = ProviderProfile.objects.get_or_create(
                user=user,
                defaults={'company_name': user.full_name}
            )
            if profile.logo:
                profile.logo.delete(save=False)
            profile.logo = image
            profile.save()
        else:
            # For employers, store in avatar field
            if user.avatar:
                user.avatar.delete(save=False)
            user.avatar = image
            user.save()

        return Response(UserSerializer(user).data)
