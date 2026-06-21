from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.utils import timezone
from .serializers import RegisterSerializer, UserSerializer, CustomTokenObtainPairSerializer, UpdateProfileSerializer
from .models import ProviderProfile

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Resolve referral code before saving
        referral_code = request.data.get('referral_code', '').strip().upper()
        referrer = None
        if referral_code:
            referrer = User.objects.filter(referral_code=referral_code).first()

        user = serializer.save()
        if referrer:
            user.referred_by = referrer
            user.save(update_fields=['referred_by'])

        # Auto-create wallet for employees
        if user.role == 'employee':
            from wallet.models import Wallet, Transaction
            from decimal import Decimal
            Wallet.objects.get_or_create(employee=user)

            # Award 100 credits to referrer if they're an employee
            if referrer and referrer.role == 'employee':
                ref_wallet, _ = Wallet.objects.get_or_create(employee=referrer)
                ref_wallet.balance = Decimal(str(ref_wallet.balance)) + Decimal('100')
                ref_wallet.save()
                Transaction.objects.create(
                    wallet=ref_wallet,
                    amount=100,
                    type='credit',
                    description=f'Referral bonus — {user.full_name} joined using your code!',
                )

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
    """GET /api/auth/birthday-today/ — colleagues with birthday today (same month+day)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        colleagues = User.objects.filter(
            role='employee',
            birthday__month=today.month,
            birthday__day=today.day,
        ).exclude(pk=request.user.pk)
        return Response([{
            'id': u.id,
            'full_name': u.full_name,
            'avatar': request.build_absolute_uri(u.avatar.url) if u.avatar else None,
        } for u in colleagues])


class ColleagueProfileView(APIView):
    """GET /api/auth/profile/<id>/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)
        from companies.models import DepartmentMembership
        dept = DepartmentMembership.objects.filter(employee=user).select_related('department').first()
        from life_moments.models import LifeEvent
        event_objs = LifeEvent.objects.filter(employee=user, is_active=True)
        events = [
            {'id': e.id, 'event_type': e.event_type, 'event_type_display': e.get_event_type_display(), 'note': e.note, 'created_at': e.created_at}
            for e in event_objs
        ]
        from wallet.models import Transaction
        credits_received = Transaction.objects.filter(
            wallet__employee=user, type__in=['credit', 'donation']
        ).count()
        return Response({
            'id': user.id,
            'full_name': user.full_name,
            'avatar': request.build_absolute_uri(user.avatar.url) if user.avatar else None,
            'department': dept.department.name if dept else None,
            'birthday_month': user.birthday.month if user.birthday else None,
            'birthday_day': user.birthday.day if user.birthday else None,
            'life_events': events,
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
