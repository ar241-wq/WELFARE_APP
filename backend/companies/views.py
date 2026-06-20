from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from users.permissions import IsEmployer
from wallet.models import Wallet, Transaction, CreditAllocation
from django.utils import timezone
from .models import Company, Team, TeamMembership, Department, DepartmentMembership
from .serializers import CompanySerializer, TeamSerializer, EmployeeSerializer, AllocateCreditsSerializer, DepartmentSerializer
import decimal

User = get_user_model()


class CompanyView(APIView):
    permission_classes = [IsEmployer]

    def get(self, request):
        company = Company.objects.filter(created_by=request.user).first()
        if not company:
            return Response({'detail': 'No company found.'}, status=404)
        return Response(CompanySerializer(company).data)

    def post(self, request):
        serializer = CompanySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        company = serializer.save(created_by=request.user)
        request.user.company = company
        request.user.save()
        return Response(CompanySerializer(company).data, status=201)

    def patch(self, request):
        company = Company.objects.filter(created_by=request.user).first()
        if not company:
            return Response({'detail': 'No company found.'}, status=404)
        serializer = CompanySerializer(company, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(CompanySerializer(company).data)


class EmployeeListView(APIView):
    permission_classes = [IsEmployer]

    def get(self, request):
        company = Company.objects.filter(created_by=request.user).first()
        if not company:
            return Response([])
        employees = User.objects.filter(company=company, role='employee').select_related('wallet')
        return Response(EmployeeSerializer(employees, many=True).data)

    def post(self, request):
        company = Company.objects.filter(created_by=request.user).first()
        if not company:
            return Response({'detail': 'No company found.'}, status=404)

        email = request.data.get('email', '').strip()
        full_name = request.data.get('full_name', '').strip()
        password = request.data.get('password', '').strip()

        if not email or not full_name or not password:
            return Response({'detail': 'email, full_name, and password are required.'}, status=400)

        if User.objects.filter(email=email).exists():
            return Response({'detail': 'An account with this email already exists.'}, status=400)

        employee = User.objects.create_user(
            email=email,
            full_name=full_name,
            password=password,
            role='employee',
            company=company,
        )

        from wallet.models import Wallet
        Wallet.objects.get_or_create(employee=employee)

        team_id = request.data.get('team_id')
        if team_id:
            try:
                team = Team.objects.get(id=team_id, company=company)
                TeamMembership.objects.create(employee=employee, team=team)
            except Team.DoesNotExist:
                pass

        return Response(EmployeeSerializer(employee).data, status=201)


class AllocateCreditsView(APIView):
    permission_classes = [IsEmployer]

    def post(self, request):
        serializer = AllocateCreditsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        company = Company.objects.filter(created_by=request.user).first()
        if not company:
            return Response({'detail': 'No company found.'}, status=404)

        amount = serializer.validated_data['amount']
        employee_ids = serializer.validated_data.get('employee_ids', [])
        team_id = serializer.validated_data.get('team_id')
        allocate_all = serializer.validated_data.get('allocate_all', False)

        if employee_ids:
            employees = User.objects.filter(id__in=employee_ids, company=company, role='employee')
        elif team_id:
            employees = User.objects.filter(
                team_memberships__team_id=team_id,
                company=company,
                role='employee'
            )
        else:
            # no specific selection → allocate to everyone in the company
            employees = User.objects.filter(company=company, role='employee')

        allocated = []
        for employee in employees:
            wallet, _ = Wallet.objects.get_or_create(employee=employee)
            wallet.balance += decimal.Decimal(str(amount))
            wallet.save()

            Transaction.objects.create(
                wallet=wallet,
                amount=amount,
                type='credit',
                description=f'Monthly credit allocation from {company.name}'
            )

            CreditAllocation.objects.create(
                company=company,
                employee=employee,
                amount=amount,
                month=timezone.now().strftime('%Y-%m'),
                expires_at=timezone.now().replace(day=28) + timezone.timedelta(days=4)
            )
            allocated.append(employee.full_name)

        return Response({'allocated_to': allocated, 'amount_each': str(amount)})


class TeamListView(APIView):
    permission_classes = [IsEmployer]

    def get(self, request):
        company = Company.objects.filter(created_by=request.user).first()
        if not company:
            return Response([])
        teams = Team.objects.filter(company=company)
        return Response(TeamSerializer(teams, many=True).data)

    def post(self, request):
        company = Company.objects.filter(created_by=request.user).first()
        if not company:
            return Response({'detail': 'No company found.'}, status=404)
        serializer = TeamSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(company=company)
        return Response(serializer.data, status=201)


class TeamDetailView(APIView):
    permission_classes = [IsEmployer]

    def _get_team(self, request, pk):
        company = Company.objects.filter(created_by=request.user).first()
        if not company:
            return None, None
        try:
            return Team.objects.get(pk=pk, company=company), company
        except Team.DoesNotExist:
            return None, company

    def get(self, request, pk):
        team, _ = self._get_team(request, pk)
        if not team:
            return Response({'detail': 'Not found.'}, status=404)
        members = User.objects.filter(team_memberships__team=team, role='employee').select_related('wallet')
        return Response({
            'team': TeamSerializer(team).data,
            'members': EmployeeSerializer(members, many=True).data,
        })

    def patch(self, request, pk):
        team, company = self._get_team(request, pk)
        if not team:
            return Response({'detail': 'Not found.'}, status=404)
        serializer = TeamSerializer(team, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        team, _ = self._get_team(request, pk)
        if not team:
            return Response({'detail': 'Not found.'}, status=404)
        team.delete()
        return Response(status=204)


class EmployeeDetailView(APIView):
    permission_classes = [IsEmployer]

    def _get_employee(self, request, pk):
        company = Company.objects.filter(created_by=request.user).first()
        if not company:
            return None, None
        try:
            return User.objects.select_related('wallet').get(pk=pk, company=company, role='employee'), company
        except User.DoesNotExist:
            return None, company

    def get(self, request, pk):
        employee, _ = self._get_employee(request, pk)
        if not employee:
            return Response({'detail': 'Not found.'}, status=404)
        return Response(EmployeeSerializer(employee).data)

    def patch(self, request, pk):
        employee, company = self._get_employee(request, pk)
        if not employee:
            return Response({'detail': 'Not found.'}, status=404)

        # Update name
        if 'full_name' in request.data:
            employee.full_name = request.data['full_name']
            employee.save(update_fields=['full_name'])

        # Update team membership
        if 'team_id' in request.data:
            TeamMembership.objects.filter(employee=employee).delete()
            team_id = request.data['team_id']
            if team_id:
                try:
                    team = Team.objects.get(id=team_id, company=company)
                    TeamMembership.objects.create(employee=employee, team=team)
                except Team.DoesNotExist:
                    pass

        # Update wallet balance (credit top-up)
        if 'wallet_balance' in request.data:
            wallet, _ = Wallet.objects.get_or_create(employee=employee)
            new_balance = decimal.Decimal(str(request.data['wallet_balance']))
            diff = new_balance - wallet.balance
            wallet.balance = new_balance
            wallet.save()
            if diff != 0:
                Transaction.objects.create(
                    wallet=wallet,
                    amount=diff,
                    type='credit' if diff > 0 else 'debit',
                    description='Balance adjusted by employer'
                )

        employee.refresh_from_db()
        return Response(EmployeeSerializer(employee).data)


class DepartmentListView(APIView):
    permission_classes = [IsEmployer]

    def get(self, request):
        company = Company.objects.filter(created_by=request.user).first()
        if not company:
            return Response([])
        departments = Department.objects.filter(company=company)
        return Response(DepartmentSerializer(departments, many=True).data)

    def post(self, request):
        company = Company.objects.filter(created_by=request.user).first()
        if not company:
            return Response({'detail': 'No company found.'}, status=404)
        serializer = DepartmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(company=company)
        return Response(serializer.data, status=201)


class DepartmentDetailView(APIView):
    permission_classes = [IsEmployer]

    def _get_dept(self, request, pk):
        company = Company.objects.filter(created_by=request.user).first()
        if not company:
            return None, None
        try:
            return Department.objects.get(pk=pk, company=company), company
        except Department.DoesNotExist:
            return None, company

    def get(self, request, pk):
        dept, _ = self._get_dept(request, pk)
        if not dept:
            return Response({'detail': 'Not found.'}, status=404)
        members = User.objects.filter(department_memberships__department=dept, role='employee').select_related('wallet')
        return Response({
            'department': DepartmentSerializer(dept).data,
            'members': EmployeeSerializer(members, many=True).data,
        })

    def patch(self, request, pk):
        dept, _ = self._get_dept(request, pk)
        if not dept:
            return Response({'detail': 'Not found.'}, status=404)
        serializer = DepartmentSerializer(dept, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        dept, _ = self._get_dept(request, pk)
        if not dept:
            return Response({'detail': 'Not found.'}, status=404)
        dept.delete()
        return Response(status=204)


class DepartmentMembersView(APIView):
    permission_classes = [IsEmployer]

    def post(self, request, pk):
        """Add or remove employees from a department."""
        company = Company.objects.filter(created_by=request.user).first()
        if not company:
            return Response({'detail': 'No company found.'}, status=404)
        try:
            dept = Department.objects.get(pk=pk, company=company)
        except Department.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)

        action = request.data.get('action', 'add')
        employee_ids = request.data.get('employee_ids', [])
        employees = User.objects.filter(id__in=employee_ids, company=company, role='employee')

        if action == 'add':
            for emp in employees:
                DepartmentMembership.objects.get_or_create(employee=emp, department=dept)
        else:
            DepartmentMembership.objects.filter(employee__in=employees, department=dept).delete()

        return Response({'status': 'ok'})


class DepartmentAllocateView(APIView):
    permission_classes = [IsEmployer]

    def post(self, request, pk):
        """Send monthly_credits to all members of this department."""
        company = Company.objects.filter(created_by=request.user).first()
        if not company:
            return Response({'detail': 'No company found.'}, status=404)
        try:
            dept = Department.objects.get(pk=pk, company=company)
        except Department.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)

        # Accept either per-employee amounts or a single flat amount
        # per_employee: [{ "employee_id": 1, "amount": 300 }, ...]
        per_employee = request.data.get('per_employee')
        flat_amount = request.data.get('amount')

        members = User.objects.filter(department_memberships__department=dept, role='employee')
        member_map = {emp.id: emp for emp in members}

        if per_employee:
            allocations = []
            for entry in per_employee:
                emp_id = entry.get('employee_id')
                amt = decimal.Decimal(str(entry.get('amount', 0)))
                if emp_id in member_map and amt > 0:
                    allocations.append((member_map[emp_id], amt))
        elif flat_amount:
            amt = decimal.Decimal(str(flat_amount))
            if amt <= 0:
                return Response({'detail': 'Amount must be greater than 0.'}, status=400)
            allocations = [(emp, amt) for emp in members]
        else:
            return Response({'detail': 'Provide either per_employee or amount.'}, status=400)

        allocated = []
        for employee, amt in allocations:
            wallet, _ = Wallet.objects.get_or_create(employee=employee)
            wallet.balance += amt
            wallet.save()
            Transaction.objects.create(
                wallet=wallet,
                amount=amt,
                type='credit',
                description=f'Department credit allocation — {dept.name}'
            )
            CreditAllocation.objects.create(
                company=company,
                employee=employee,
                amount=amt,
                month=timezone.now().strftime('%Y-%m'),
                expires_at=timezone.now().replace(day=28) + timezone.timedelta(days=4)
            )
            allocated.append({'name': employee.full_name, 'amount': str(amt)})

        return Response({'allocated_to': allocated, 'department': dept.name})
