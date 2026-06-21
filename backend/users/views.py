from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, UserSerializer, CustomTokenObtainPairSerializer, UpdateProfileSerializer

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
