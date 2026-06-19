from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from users.permissions import IsEmployee, IsEmployer
from companies.models import Company
from .models import PerkRequest, PerkBundle, BundleAssignment
from .serializers import (
    PerkRequestSerializer, ReviewRequestSerializer,
    PerkBundleSerializer, AssignBundleSerializer
)


class PerkRequestView(APIView):
    def get_permissions(self):
        return [IsEmployee()] if self.request.method == 'POST' else [IsEmployer()]

    def get(self, request):
        company = Company.objects.filter(created_by=request.user).first()
        if not company:
            return Response([])
        requests = PerkRequest.objects.filter(employee__company=company)
        return Response(PerkRequestSerializer(requests, many=True).data)

    def post(self, request):
        serializer = PerkRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(employee=request.user)
        return Response(serializer.data, status=201)


class ReviewRequestView(APIView):
    permission_classes = [IsEmployer]

    def patch(self, request, pk):
        try:
            perk_request = PerkRequest.objects.get(pk=pk)
        except PerkRequest.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)

        serializer = ReviewRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        perk_request.status = serializer.validated_data['status']
        perk_request.reviewed_by = request.user
        perk_request.reviewed_at = timezone.now()
        perk_request.save()

        if perk_request.status == 'approved':
            from wallet.models import Wallet, Transaction
            import decimal
            wallet, _ = Wallet.objects.get_or_create(employee=perk_request.employee)
            wallet.balance += decimal.Decimal(str(perk_request.estimated_credits))
            wallet.save()
            Transaction.objects.create(
                wallet=wallet,
                amount=perk_request.estimated_credits,
                type='credit',
                description=f'Approved perk request: {perk_request.perk_name}'
            )

        return Response(PerkRequestSerializer(perk_request).data)


class PerkBundleView(APIView):
    permission_classes = [IsEmployer]

    def get(self, request):
        company = Company.objects.filter(created_by=request.user).first()
        if not company:
            return Response([])
        bundles = PerkBundle.objects.filter(company=company).prefetch_related('perks')
        return Response(PerkBundleSerializer(bundles, many=True).data)

    def post(self, request):
        company = Company.objects.filter(created_by=request.user).first()
        serializer = PerkBundleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(company=company)
        return Response(serializer.data, status=201)


class AssignBundleView(APIView):
    permission_classes = [IsEmployer]

    def post(self, request, pk):
        try:
            bundle = PerkBundle.objects.get(pk=pk)
        except PerkBundle.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)

        serializer = AssignBundleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from django.contrib.auth import get_user_model
        from companies.models import Team
        User = get_user_model()

        employee_id = serializer.validated_data.get('employee_id')
        team_id = serializer.validated_data.get('team_id')

        if employee_id:
            employee = User.objects.get(pk=employee_id)
            BundleAssignment.objects.create(bundle=bundle, assigned_to_employee=employee)
        elif team_id:
            team = Team.objects.get(pk=team_id)
            BundleAssignment.objects.create(bundle=bundle, assigned_to_team=team)

        return Response({'detail': 'Bundle assigned successfully.'})
